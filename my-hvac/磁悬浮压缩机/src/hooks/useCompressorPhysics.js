import { useState, useEffect, useRef } from 'react';
import { SYSTEM_SPECS, PID_PARAMS } from '../config';

/**
 * SimplePID 控制器
 * 基于 CFD报告 3.2节 和 4.1节
 */
class SimplePID {
    constructor(kp, ki, kd, outputMin = -Infinity, outputMax = Infinity) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.outputMin = outputMin;
        this.outputMax = outputMax;
        this.integral = 0;
        this.prevError = 0;
    }

    update(error, dt) {
        this.integral += error * dt;
        // 积分限幅防止饱和
        this.integral = Math.max(-100, Math.min(100, this.integral));

        const derivative = dt > 0 ? (error - this.prevError) / dt : 0;
        this.prevError = error;

        let output = this.kp * error + this.ki * this.integral + this.kd * derivative;
        return Math.max(this.outputMin, Math.min(this.outputMax, output));
    }

    reset() {
        this.integral = 0;
        this.prevError = 0;
    }
}

/**
 * 安全数值格式化
 */
function safeNumber(value, decimals = 1, fallback = 0) {
    if (!isFinite(value)) return fallback;
    return Number(value.toFixed(decimals));
}

/**
 * R134a 物性计算 (基于CFD报告5.2节)
 */
function getR134aProperties(pressure, temperature) {
    const props = SYSTEM_SPECS.REFRIGERANT_PROPS;

    // 简化的饱和温度-压力关系 (Antoine方程近似)
    const satTemp = 15 + 15 * Math.log10(pressure / 400);

    // 密度随压力变化的简化模型
    const gasDensity = props.GAS_DENSITY * (pressure / 350);
    const liquidDensity = props.LIQUID_DENSITY * (1 - 0.001 * (temperature - 25));

    return {
        satTemp,
        gasDensity: safeNumber(gasDensity, 2),
        liquidDensity: safeNumber(liquidDensity, 1),
        latentHeat: props.LATENT_HEAT
    };
}

/**
 * 压缩机特性曲线计算 (基于CFD报告3.1节)
 * 压比方程: Π(N, ṁ) = C1·N² + C2·ṁ·N + C3·ṁ² + C4
 */
function calculateCompressionRatio(speed, massFlow) {
    const { C1, C2, C3, C4 } = SYSTEM_SPECS.COMPRESSOR.MAP_COEFFICIENTS;
    const N = speed / 1000; // 归一化转速
    const m = massFlow;

    let ratio = C1 * N * N + C2 * m * N + C3 * m * m + C4;
    return Math.max(1.5, Math.min(5.0, ratio)); // 限制在合理范围
}

/**
 * 喘振线计算 (基于CFD报告3.1.2节)
 * ṁ_surge = k1·Π² + k2·Π + k3
 */
function calculateSurgeFlow(pressureRatio) {
    const { K1, K2, K3 } = SYSTEM_SPECS.COMPRESSOR.SURGE_LINE;
    const Pi = pressureRatio;

    return K1 * Pi * Pi + K2 * Pi + K3;
}

/**
 * 喘振裕度计算 (基于CFD报告4.1.1节)
 * S = Q_actual / Q_surge_limit(P_ratio)
 */
function calculateSurgeMargin(actualFlow, pressureRatio) {
    const surgeFlow = calculateSurgeFlow(pressureRatio);
    return actualFlow / surgeFlow;
}

/**
 * 主Hook: 磁悬浮冷水机组物理仿真
 * 基于 CFD仿真报告 的完整三压力节点模型
 */
export const useCompressorPhysics = (params, systemSpecs = null) => {
    const SPECS = systemSpecs || SYSTEM_SPECS;

    // 解构输入参数
    const {
        ambientTemp = 35,        // 室外温度 °C
        waterInletTemp = 12,     // 冷冻水回水温度 °C
        waterOutletSetpoint = 7, // 出水温度设定 °C
        loadPercent = 100,       // 负荷百分比 %
        mode = 'auto'            // 运行模式: auto/manual/economy
    } = params;

    // 持久化状态引用
    const stateRef = useRef({
        // 压缩机状态
        compSpeed: SPECS.COMPRESSOR.MIN_SPEED,
        compSpeedTarget: SPECS.COMPRESSOR.MIN_SPEED,
        igvAngle: 0,
        motorTemp: 40,

        // 三压力节点
        highPressure: 1200,    // kPa (Pc)
        midPressure: 600,      // kPa (Pm)
        lowPressure: 350,      // kPa (Pe)

        // 温度状态
        condTemp: 45,          // 冷凝温度
        evapTemp: 5,           // 蒸发温度
        ecoTemp: 22,           // 经济器温度
        waterOutTemp: 7,       // 出水温度

        // 膨胀阀开度 (%)
        te1Opening: 50,
        te2Opening: 50,
        te3Opening: 30,
        te4Opening: 30,
        te5Opening: 0,         // 防喘振阀

        // 液位 (%)
        evaLevel: 75,
        ecoLevel: 50,

        // 风机
        fanSpeeds: [80, 80, 80, 80, 80, 80],

        // 时间
        lastTime: Date.now()
    });

    // PID 控制器
    const compSpeedPID = useRef(new SimplePID(
        PID_PARAMS.COMPRESSOR_SPEED.KP,
        PID_PARAMS.COMPRESSOR_SPEED.KI,
        PID_PARAMS.COMPRESSOR_SPEED.KD,
        SPECS.COMPRESSOR.MIN_SPEED,
        SPECS.COMPRESSOR.MAX_SPEED
    ));

    const antiSurgePID = useRef(new SimplePID(
        PID_PARAMS.ANTI_SURGE.KP,
        PID_PARAMS.ANTI_SURGE.KI,
        PID_PARAMS.ANTI_SURGE.KD,
        0, 100
    ));

    const evaLevelPID = useRef(new SimplePID(
        PID_PARAMS.EVAPORATOR_LEVEL.KP,
        PID_PARAMS.EVAPORATOR_LEVEL.KI,
        PID_PARAMS.EVAPORATOR_LEVEL.KD,
        0, 100
    ));

    const ecoLevelPID = useRef(new SimplePID(
        PID_PARAMS.ECONOMIZER_LEVEL.KP,
        PID_PARAMS.ECONOMIZER_LEVEL.KI,
        PID_PARAMS.ECONOMIZER_LEVEL.KD,
        0, 100
    ));

    // UI显示状态
    const [stats, setStats] = useState({
        // 压缩机
        compSpeed: 24000,
        compFreq: 50,
        compPower: 80,
        motorTemp: 45,
        igvAngle: 0,
        massFlow: 4.0,

        // 磁悬浮轴承
        axialPosition: 0,
        radialPosition: 0,
        bearingCurrent: 2.5,

        // 三压力节点
        highPressure: 1200,
        midPressure: 600,
        lowPressure: 350,
        pressureRatio: 3.4,

        // 温度
        condTemp: 45,
        evapTemp: 5,
        ecoTemp: 22,
        waterInTemp: 12,
        waterOutTemp: 7,
        superheat: 5,
        subcool: 5,
        dischargeTemp: 75,

        // 膨胀阀
        te1Opening: 50,
        te2Opening: 50,
        te3Opening: 30,
        te4Opening: 30,
        te5Opening: 0,

        // 液位
        evaLevel: 75,
        ecoLevel: 50,

        // 风机
        fanSpeeds: [80, 80, 80, 80, 80, 80],
        fanPower: 12,

        // 性能
        capacity: 500,
        cop: 5.0,
        iplv: 6.5,
        loadPercent: 100,

        // 防喘振
        surgeMargin: 0.25,
        surgeStatus: 'normal', // normal/warning/control/emergency

        // 系统状态
        running: true,
        economizer: true,
        ecoInjection: true,

        error: null
    });

    useEffect(() => {
        const UPDATE_INTERVAL = 500; // ms

        // 重置PID
        compSpeedPID.current.reset();
        antiSurgePID.current.reset();
        evaLevelPID.current.reset();
        ecoLevelPID.current.reset();
        stateRef.current.lastTime = Date.now();

        const timer = setInterval(() => {
            try {
                const now = Date.now();
                const dt = (now - stateRef.current.lastTime) / 1000;
                stateRef.current.lastTime = now;
                const safeDt = Math.min(dt, 1.0);

                const state = stateRef.current;

                // ========== 1. 热负荷计算 ==========
                const waterFlow = SPECS.EVAPORATOR.WATER_FLOW; // m³/h
                const waterCp = 4.186; // kJ/(kg·K)
                const waterDensity = 1000; // kg/m³
                const waterMassFlow = waterFlow * waterDensity / 3600; // kg/s

                const heatLoad = loadPercent / 100 * SPECS.NOMINAL_CAPACITY; // kW

                // ========== 2. 压缩机转速控制 (CFD报告3.2节) ==========
                const waterOutError = state.waterOutTemp - waterOutletSetpoint;
                const speedCommand = compSpeedPID.current.update(waterOutError, safeDt);

                // 软启动限制 (CFD报告3.2节: ≤500 RPM/s)
                const maxSpeedChange = SPECS.COMPRESSOR.SPEED_RATE_LIMIT * safeDt;
                let newSpeed = state.compSpeed;
                if (speedCommand > state.compSpeed) {
                    newSpeed = Math.min(state.compSpeed + maxSpeedChange, speedCommand);
                } else {
                    newSpeed = Math.max(state.compSpeed - maxSpeedChange, speedCommand);
                }
                state.compSpeed = Math.max(SPECS.COMPRESSOR.MIN_SPEED,
                    Math.min(SPECS.COMPRESSOR.MAX_SPEED, newSpeed));

                // ========== 3. 压缩过程计算 ==========
                // 制冷剂质量流量 (基于负荷和焓差)
                const latentHeat = SPECS.REFRIGERANT_PROPS.LATENT_HEAT; // kJ/kg
                const massFlow = heatLoad / latentHeat; // kg/s

                // 压比计算 (CFD报告3.1.1节)
                const pressureRatio = calculateCompressionRatio(state.compSpeed, massFlow);

                // 高压/低压计算
                const evapTemp = waterOutletSetpoint - 5; // 蒸发温度比出水低5°C
                state.lowPressure = 200 + evapTemp * 20; // 简化的压力-温度关系
                state.highPressure = state.lowPressure * pressureRatio;

                // 中间压力 (CFD报告4.2.2节: Pm = √(Pc·Pe))
                state.midPressure = Math.sqrt(state.highPressure * state.lowPressure);

                // 温度计算
                const r134aProps = getR134aProperties(state.lowPressure, evapTemp);
                state.evapTemp = r134aProps.satTemp;
                state.condTemp = 15 + 15 * Math.log10(state.highPressure / 400);
                state.ecoTemp = 15 + 15 * Math.log10(state.midPressure / 400);

                // 排气温度 (压缩后过热)
                const dischargeTemp = state.condTemp + 30 + 0.3 * (pressureRatio - 3);

                // 过热度/过冷度
                const superheat = Math.max(1, 5 + (state.te1Opening - 50) * 0.1);
                const subcool = Math.max(1, 5 - (state.condTemp - 40) * 0.2);

                // ========== 4. 防喘振控制 (CFD报告4.1节) ==========
                const surgeMargin = calculateSurgeMargin(massFlow, pressureRatio);
                let te5Opening = state.te5Opening;
                let surgeStatus = 'normal';

                if (surgeMargin > 1.1) {
                    // 正常区域: S > 1.1
                    te5Opening = 0;
                    surgeStatus = 'normal';
                    antiSurgePID.current.reset();
                } else if (surgeMargin > 1.0) {
                    // 控制区域: 1.0 < S < 1.1
                    const surgeError = 1.1 - surgeMargin;
                    te5Opening = antiSurgePID.current.update(surgeError, safeDt);
                    surgeStatus = 'control';
                } else {
                    // 紧急区域: S < 1.0
                    te5Opening = 100;
                    surgeStatus = 'emergency';
                }
                state.te5Opening = te5Opening;

                // ========== 5. 经济器控制 (CFD报告4.2节) ==========
                const ecoLevelError = SPECS.ECONOMIZER.LEVEL.SET_POINT - state.ecoLevel;
                const ecoValveCommand = ecoLevelPID.current.update(ecoLevelError, safeDt);
                state.te3Opening = Math.max(0, Math.min(100, 30 + ecoValveCommand));
                state.te4Opening = state.te3Opening;

                // 经济器液位动态
                const ecoInFlow = state.te3Opening / 100 * 2; // 归一化流量
                const ecoOutFlow = 1.8; // 稳态流出
                state.ecoLevel += (ecoInFlow - ecoOutFlow) * safeDt * 2;
                state.ecoLevel = Math.max(20, Math.min(80, state.ecoLevel));

                // ========== 6. 蒸发器控制 (CFD报告4.3节) ==========
                const evaLevelError = SPECS.EVAPORATOR.LEVEL.SET_POINT - state.evaLevel;
                const mainValveCommand = evaLevelPID.current.update(evaLevelError, safeDt);

                // 排气过热度保护 (CFD报告4.3.1节)
                let valveOverride = 0;
                if (superheat < 3) {
                    valveOverride = -20; // 强制关小
                }

                state.te1Opening = Math.max(0, Math.min(100, 50 + mainValveCommand + valveOverride));
                state.te2Opening = state.te1Opening;

                // 蒸发器液位动态
                const evaInFlow = (state.te1Opening + state.te2Opening) / 200 * 3;
                const evaOutFlow = massFlow / 2;
                state.evaLevel += (evaInFlow - evaOutFlow) * safeDt * 5;
                state.evaLevel = Math.max(50, Math.min(95, state.evaLevel));

                // ========== 7. 冷凝风机控制 ==========
                const subcoolError = PID_PARAMS.CONDENSER_FAN.TARGET_SUBCOOL - subcool;
                const baseFanSpeed = 60 + ambientTemp * 0.8 - subcoolError * 5;
                const fanSpeeds = state.fanSpeeds.map((_, i) => {
                    return Math.max(20, Math.min(100, baseFanSpeed + Math.random() * 2));
                });
                state.fanSpeeds = fanSpeeds;

                // ========== 8. 性能计算 ==========
                // 压缩机功率 (等熵效率 ~0.75)
                const isentropicEfficiency = 0.75;
                const compPower = massFlow * (state.highPressure - state.lowPressure) /
                    (SPECS.REFRIGERANT_PROPS.GAS_DENSITY * isentropicEfficiency) / 1000;

                // 风机功率
                const avgFanSpeed = fanSpeeds.reduce((a, b) => a + b, 0) / fanSpeeds.length;
                const fanPower = SPECS.CONDENSER.FAN_COUNT * SPECS.CONDENSER.FAN_POWER *
                    Math.pow(avgFanSpeed / 100, 3);

                const totalPower = compPower + fanPower;
                const cop = heatLoad > 0 && totalPower > 0 ? heatLoad / totalPower : 0;

                // 经济器效率提升
                const actualCop = cop * (1 + SPECS.ECONOMIZER.EFFICIENCY_BOOST);

                // ========== 9. 热惯性更新 ==========
                const tau = 3.0; // 热时间常数
                const alpha = Math.min(safeDt / tau, 1);

                // 出水温度动态
                const targetWaterOutTemp = waterInletTemp - heatLoad / (waterMassFlow * waterCp);
                state.waterOutTemp = state.waterOutTemp * (1 - alpha) + targetWaterOutTemp * alpha;
                state.waterOutTemp = Math.max(4, Math.min(15, state.waterOutTemp));

                // 电机温度
                const motorHeat = compPower * 0.05 * 10; // 5%功率转为热量
                const motorCooling = (state.motorTemp - ambientTemp) * 0.3;
                state.motorTemp += (motorHeat - motorCooling) * safeDt * 0.1;
                state.motorTemp = Math.max(30, Math.min(90, state.motorTemp));

                // ========== 10. 磁悬浮轴承模拟 ==========
                const axialPosition = Math.sin(now / 200) * 0.5 + Math.random() * 0.2;
                const radialPosition = Math.cos(now / 300) * 0.3 + Math.random() * 0.15;
                const bearingCurrent = 2 + (state.compSpeed - 18000) / 30000 * 1.5 + Math.random() * 0.1;

                // ========== 更新UI状态 ==========
                setStats({
                    // 压缩机
                    compSpeed: safeNumber(state.compSpeed, 0),
                    compFreq: safeNumber(state.compSpeed / 400, 1),
                    compPower: safeNumber(compPower, 1),
                    motorTemp: safeNumber(state.motorTemp, 1),
                    igvAngle: safeNumber(state.igvAngle, 0),
                    massFlow: safeNumber(massFlow, 2),

                    // 磁悬浮轴承
                    axialPosition: safeNumber(axialPosition, 2),
                    radialPosition: safeNumber(radialPosition, 2),
                    bearingCurrent: safeNumber(bearingCurrent, 2),

                    // 三压力节点
                    highPressure: safeNumber(state.highPressure, 0),
                    midPressure: safeNumber(state.midPressure, 0),
                    lowPressure: safeNumber(state.lowPressure, 0),
                    pressureRatio: safeNumber(pressureRatio, 2),

                    // 温度
                    condTemp: safeNumber(state.condTemp, 1),
                    evapTemp: safeNumber(state.evapTemp, 1),
                    ecoTemp: safeNumber(state.ecoTemp, 1),
                    waterInTemp: safeNumber(waterInletTemp, 1),
                    waterOutTemp: safeNumber(state.waterOutTemp, 1),
                    superheat: safeNumber(superheat, 1),
                    subcool: safeNumber(subcool, 1),
                    dischargeTemp: safeNumber(dischargeTemp, 1),

                    // 膨胀阀
                    te1Opening: safeNumber(state.te1Opening, 0),
                    te2Opening: safeNumber(state.te2Opening, 0),
                    te3Opening: safeNumber(state.te3Opening, 0),
                    te4Opening: safeNumber(state.te4Opening, 0),
                    te5Opening: safeNumber(state.te5Opening, 0),

                    // 液位
                    evaLevel: safeNumber(state.evaLevel, 0),
                    ecoLevel: safeNumber(state.ecoLevel, 0),

                    // 风机
                    fanSpeeds: fanSpeeds.map(s => safeNumber(s, 0)),
                    fanPower: safeNumber(fanPower, 1),

                    // 性能
                    capacity: safeNumber(heatLoad, 1),
                    cop: safeNumber(actualCop, 2),
                    iplv: safeNumber(actualCop * 1.15, 2),
                    loadPercent: safeNumber(loadPercent, 0),

                    // 防喘振
                    surgeMargin: safeNumber((surgeMargin - 1) * 100, 0), // 转为百分比裕度
                    surgeStatus,

                    // 系统状态
                    running: true,
                    economizer: true,
                    ecoInjection: state.te3Opening > 5,

                    error: null
                });

            } catch (error) {
                console.error('❌ 物理仿真错误:', error);
                setStats(prev => ({ ...prev, error: error.message }));
            }

        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);

    }, [params, ambientTemp, waterInletTemp, waterOutletSetpoint, loadPercent, mode, SPECS]);

    return stats;
};
