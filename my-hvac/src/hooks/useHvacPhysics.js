import { useState, useEffect, useRef } from 'react';

// 默认系统规格
const SYSTEM_SPECS = {
    AIR: {
        DENSITY: 1.2,
        CP: 1005,
        ALTITUDE_CORRECTION: 1.0
    },
    IEC: {
        MAX_AIRFLOW: 15000,
        FAN_RATED_POWER: 3.5,
        DRY_MODE: {
            BASE_EFF: 0.75,
            DEGRADATION: 0.15
        },
        WET_MODE: {
            BASE_EFF: 0.95,
            DEGRADATION: 0.10
        }
    },
    DX: {
        RATED_CAPACITY: 60000,
        RATED_COP: 3.2,
        MIN_FREQ: 30,
        MAX_FREQ: 90
    },
    THERMAL: {
        MASS: 100000
    }
};

// SimplePID控制器
class SimplePID {
    constructor(kp, ki, kd) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.integral = 0;
        this.prevError = 0;
    }

    update(error, dt) {
        this.integral += error * dt;
        const derivative = (error - this.prevError) / dt;
        this.prevError = error;
        return this.kp * error + this.ki * this.integral + this.kd * derivative;
    }

    reset() {
        this.integral = 0;
        this.prevError = 0;
    }
}

/**
 * 安全地格式化数字，防止 NaN 和 Infinity
 * @param {number} value - 要格式化的数值
 * @param {number} decimals - 小数位数
 * @param {number} fallback - 当值无效时的默认值
 * @returns {number} 格式化后的数字
 */
function safeNumber(value, decimals = 1, fallback = 0) {
    if (!isFinite(value)) {
        return fallback;
    }
    return Number(value.toFixed(decimals));
}


/**
 * 主Hook: HVAC系统物理仿真
 */
export const useHvacPhysics = (params, mode, systemSpecs = null, faultEffects = null) => {
    const SPECS = systemSpecs || SYSTEM_SPECS;

    // 解构参数
    const { oaTemp = 35, oaRh = 45, saSet = 25, qLoad = 50000, fanSpeed = 80 } = params;

    // 持久化状态引用
    const stateRef = useRef({
        raTemp: saSet + 12,
        saTemp: saSet,
        coreOut: saSet + 5,
        compHz: 0,
        dxOn: false,
        eevOpening: 240,
        lastTime: Date.now(),
        dxLastChangeTime: Date.now(),
        cfcIntegral: 0,
        oaNoise: 0 // 室外温度扰动
    });

    const pidRef = useRef(new SimplePID(5, 0.1, 0.5));
    const eevPidRef = useRef(new SimplePID(2, 0.01, 0.1));
    const fanPidRef = useRef(new SimplePID(5, 0.5, 2)); // Kp=5, Ki=0.5, Kd=2

    // UI显示状态
    const [stats, setStats] = useState({
        wb: 20, raTemp: 37, roomTemp: 27, saTemp: 25, coreOut: 30, eaTemp: 33,
        dxOn: false, sprayOn: false, compHz: 0, eevOpening: 240,
        fanSpeed_actual: 80, cfc: 0,  // 智能控制参数
        airflow_kgs: 4.0, airflow_m3h: 3400,
        capacity_kw: 0, Q_iec_kw: 0, Q_dx_kw: 0,  // 制冷量
        power_kw: 0, cop: 0,
        highPress: 2800, lowPress: 800, condTemp: 40, evapTemp: 10,
        superheat: 5, subcool: 3, compPower: 0, error: null,
    });

    useEffect(() => {
        const UPDATE_INTERVAL = 700;  // 更新间隔 (ms)

        // 切换模式/参数时重置
        pidRef.current.reset();
        eevPidRef.current.reset();
        fanPidRef.current.reset();
        const now0 = Date.now();
        stateRef.current.lastTime = now0;
        stateRef.current.dxLastChangeTime = now0;
        stateRef.current.cfcIntegral = 0;
        // 注意：不重置 oaNoise，保持扰动连续性

        const timer = setInterval(() => {
            try {
                const now = Date.now();
                const dt = (now - stateRef.current.lastTime) / 1000;  // 秒
                stateRef.current.lastTime = now;
                const safedt = Math.min(dt, 1.5);  // 限制最大时间步长



                // === 常数提取 ===
                const { DENSITY: rho, CP: cp } = SPECS.AIR;
                const { MAX_AIRFLOW, FAN_RATED_POWER } = SPECS.IEC;
                const { BASE_EFF: dryEff, DEGRADATION: dryDegr } = SPECS.IEC.DRY_MODE;
                const { BASE_EFF: wetEff, DEGRADATION: wetDegr } = SPECS.IEC.WET_MODE;
                const { RATED_CAPACITY: DX_CAP, RATED_COP: DX_COP, MIN_FREQ: DX_MIN, MAX_FREQ: DX_MAX } = SPECS.DX;
                const THERMAL_MASS = SPECS.THERMAL.MASS;

                // === 室外温度扰动计算 ===
                // 每秒变化最大1度以内随机
                const noiseChange = (Math.random() - 0.5) * 2 * safedt;
                stateRef.current.oaNoise += noiseChange;
                // 限制累计扰动范围 +/- 0.5度 (用户要求)
                stateRef.current.oaNoise = Math.max(-0.5, Math.min(0.5, stateRef.current.oaNoise));

                const effectiveOaTemp = oaTemp + stateRef.current.oaNoise;

                // === 湿球温度计算 (Stull公式) ===
                const RH = oaRh;
                const T = effectiveOaTemp; // 使用扰动后的温度
                const wb = T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659))
                    + Math.atan(T + RH) - Math.atan(RH - 1.676331)
                    + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;

                const raTemp = stateRef.current.raTemp;


                // === 智能控制系统 ===

                // 1. 制冷需求计算 (CFC)
                // 目标：维持回风与送风温差在 13°C 左右
                const targetDt = 13;
                const raTarget = saSet + targetDt;

                // 计算瞬时误差
                const saError = stateRef.current.saTemp - saSet;

                // 积分修正 (优化): 全局启用积分，但限制积分速度
                // 只有当偏差较小时积分生效快，偏差大时主要靠比例控制
                const integralRate = Math.abs(raTemp - raTarget) < 3 ? 0.1 : 0.01;
                stateRef.current.cfcIntegral += saError * safedt * integralRate;
                stateRef.current.cfcIntegral = Math.max(-5, Math.min(5, stateRef.current.cfcIntegral));

                // 计算总误差 (权重调整: 提高送风温度权重要求)
                // 原: 0.8 RA / 0.2 SA -> 现: 0.4 RA / 0.6 SA
                // 目的: 当用户设定极低送风温度时，即使回风温度不高，也要强制制冷
                const tempError = 0.4 * (raTemp - raTarget) + 0.6 * saError + stateRef.current.cfcIntegral;

                // 将误差映射到 0-100% 的 CFC
                let cfc = Math.max(0, Math.min(100, (tempError + 5) * 10));

                // 2. 智能送风温度调节
                // 始终精确跟踪用户设定值，移除不稳定的动态设定点逻辑
                let saSet_actual = saSet;

                // 3. 动态风速调节 (分程控制 + 温度补偿 + 平滑过渡)
                // 基础风速：由CFC驱动
                let fanSpeed_target = 1 + cfc * 1.19;

                // === 送风温度控制逻辑（降低增益，避免过度调节）===
                // saError > 0: 送风温度高于设定值，需要增加制冷
                // saError < 0: 送风温度低于设定值，需要减少制冷

                if (saError > 2) {
                    // 送风温度严重过高：增加风速
                    const tempBoost = saError * 6;  // 从15降到6
                    fanSpeed_target += tempBoost;
                } else if (saError > 0) {
                    // 送风温度略高：适度增加风速
                    const tempBoost = saError * 4;  // 从8降到4
                    fanSpeed_target += tempBoost;
                } else if (saError < -2) {
                    // 送风温度严重过低：降低风速
                    const tempReduction = Math.abs(saError) * 6;  // 从15降到6
                    fanSpeed_target = Math.max(fanSpeed_target - tempReduction, 20);
                } else if (saError < 0) {
                    // 送风温度略低：适度降低风速
                    const tempReduction = Math.abs(saError) * 4;  // 从8降到4
                    fanSpeed_target = Math.max(fanSpeed_target - tempReduction, 30);
                }

                fanSpeed_target = Math.max(20, Math.min(120, fanSpeed_target));

                // 平滑过渡：使用一阶滤波，避免风速突变
                // alpha = 0.3: 快速响应但不会太激进
                const fanAlpha = 0.3;
                const prevFanSpeed = stateRef.current.prevFanSpeed || fanSpeed_target;
                let fanSpeed_actual = prevFanSpeed * (1 - fanAlpha) + fanSpeed_target * fanAlpha;
                stateRef.current.prevFanSpeed = fanSpeed_actual;

                // === 模式判定 & 设备控制 ===
                let sprayOn = false;
                let dxWanted = false;

                if (mode === 'dry') {
                    sprayOn = false;
                    dxWanted = false;
                } else if (mode === 'wet') {
                    sprayOn = true;
                    dxWanted = false;
                } else if (mode === 'hybrid') {
                    sprayOn = true;
                    // 智能开启压缩机 (基于CFC的分程控制)
                    // 滞环控制: >45%开启, <35%关闭
                    if (stateRef.current.dxOn) {
                        if (cfc < 35) dxWanted = false;
                        else dxWanted = true;
                    } else {
                        if (cfc > 45) dxWanted = true;
                        else dxWanted = false;
                    }

                    // 紧急保护: 如果回风温度过高 (且送风没有过冷)，强制开启
                    // 只有当送风偏差 > -1 (即送风没有比设定低1度以上) 时才允许因为回风高而强启
                    if (raTemp > saSet + 10 && saError > -1) dxWanted = true;
                    if (saError > 2) dxWanted = true; // 送风偏差>2度强制开启DX（从3度降到2度）

                } else if (mode === 'dx') {
                    sprayOn = false;
                    dxWanted = true;

                } else if (mode === 'auto') {
                    // === 自动模式：智能控制所有设备 ===

                    // 1. 智能喷淋控制
                    const oaTempThreshold = 25;
                    const wbAdvantage = effectiveOaTemp - wb;

                    if (effectiveOaTemp > oaTempThreshold && wbAdvantage > 5) {
                        sprayOn = true; // 高温且湿球优势明显，开启喷淋
                    } else {
                        sprayOn = false; // 低温或湿球优势不明显，干模式
                    }

                    // 2. 智能DX控制
                    if (stateRef.current.dxOn) {
                        // DX已开启，检查是否可以关闭
                        if (cfc < 25 && saError < 0) {
                            dxWanted = false;
                        } else {
                            dxWanted = true;
                        }
                    } else {
                        // DX关闭，检查是否需要开启
                        if (cfc > 40 || saError > 2) {  // 从3度降到2度
                            dxWanted = true;
                        } else {
                            dxWanted = false;
                        }
                    }

                    // 紧急保护
                    if (raTemp > saSet + 12) dxWanted = true;
                    if (saError < -3) dxWanted = false;
                }

                // === 应用设备故障影响 ===
                if (faultEffects) {
                    // 水泵故障：禁用喷淋
                    if (faultEffects.sprayDisabled) {
                        sprayOn = false;
                    }

                    // 压缩机故障：禁用DX
                    if (faultEffects.compressorDisabled) {
                        dxWanted = false;
                    }
                }

                // 最小启停时间保护
                if (stateRef.current.dxOn) {
                    if (!dxWanted && (now - stateRef.current.dxLastChangeTime) / 1000 < 180) {
                        dxWanted = true;
                    }
                } else {
                    const offTime = (now - stateRef.current.dxLastChangeTime) / 1000;
                    if (dxWanted && offTime < 300) {
                        // 紧急情况：CFC>80% 允许提前启动
                        if (cfc > 80) {
                            dxWanted = true;
                        } else {
                            dxWanted = false;
                        }
                    }
                }

                // 送风温度过低保护：避免过冷
                if (saError < -3) {  // 从-5改为-3，更快关闭DX
                    dxWanted = false;
                }

                if (dxWanted !== stateRef.current.dxOn) {
                    stateRef.current.dxOn = dxWanted;
                    stateRef.current.dxLastChangeTime = now;
                }
                const dxOn = stateRef.current.dxOn;

                // === 风量计算 ===
                let flow_m3s = (MAX_AIRFLOW * (fanSpeed_actual / 100)) / 3600;

                // 应用风机故障影响
                if (faultEffects && faultEffects.fanCapacityPenalty > 0) {
                    flow_m3s = flow_m3s * (1 - faultEffects.fanCapacityPenalty);
                }

                const m_air = flow_m3s * rho;
                const airflow_m3h = flow_m3s * 3600;

                // === IEC换热计算 ===
                const baseEff = sprayOn ? wetEff : dryEff;
                const degr = sprayOn ? wetDegr : dryDegr;
                const ratio = fanSpeed_actual / 100;
                let efficiency = baseEff - ratio * degr;

                // 应用IEC芯体故障影响
                if (faultEffects && faultEffects.iecEfficiencyPenalty > 0) {
                    efficiency = efficiency * (1 - faultEffects.iecEfficiencyPenalty);
                }

                const T_sink = sprayOn ? wb : effectiveOaTemp; // 使用扰动后的温度
                const coreOut_target = raTemp - efficiency * (raTemp - T_sink);

                // 热惯性：减小时间常数以加快响应
                const tau_thermal = 2.0; // 从5.0降到2.0，加快响应
                const alpha = Math.min(safedt / tau_thermal, 1);
                let coreOut = stateRef.current.coreOut * (1 - alpha) + coreOut_target * alpha;
                coreOut = Math.max(10, coreOut);
                stateRef.current.coreOut = coreOut;

                // === DX制冷计算 (分程控制) ===
                let compHz = stateRef.current.compHz;
                let saTemp_target = coreOut;
                let Q_dx_actual = 0;
                const actualSaTemp = stateRef.current.saTemp;

                if (dxOn) {
                    // 策略：CFC直接驱动压缩机频率
                    // CFC 40-100% -> 频率 30-90Hz (线性映射)
                    // 确保每一级CFC都有对应的频率输出

                    let targetHz = 30;
                    if (cfc > 40) {
                        // (CFC-40) / 60 * 60 + 30
                        targetHz = 30 + (cfc - 40) * 1.0;
                    }

                    // 限制范围
                    targetHz = Math.max(DX_MIN, Math.min(DX_MAX, targetHz));

                    // 平滑过渡：加快变频器响应
                    const hzAlpha = 0.2; // 从0.1提高到0.2
                    compHz = compHz * (1 - hzAlpha) + targetHz * hzAlpha;

                    if (stateRef.current.dxOn) {
                        let dxCapacity = DX_CAP * (compHz / DX_MAX);

                        // 应用DX相关故障影响
                        if (faultEffects) {
                            // 膨胀阀故障：效率降低
                            if (faultEffects.dxEfficiencyPenalty > 0) {
                                dxCapacity = dxCapacity * (1 - faultEffects.dxEfficiencyPenalty);
                            }

                            // 蒸发器故障：容量降低
                            if (faultEffects.dxCapacityPenalty > 0) {
                                dxCapacity = dxCapacity * (1 - faultEffects.dxCapacityPenalty);
                            }

                            // 冷凝器故障：COP降低（通过功耗增加体现）
                            // 这里简化为容量降低
                            if (faultEffects.dxCOPPenalty > 0) {
                                dxCapacity = dxCapacity * (1 - faultEffects.dxCOPPenalty * 0.5);
                            }
                        }

                        Q_dx_actual = dxCapacity;
                        saTemp_target = coreOut - Q_dx_actual / (m_air * cp);
                    }
                } else {
                    compHz = 0;
                    saTemp_target = coreOut;
                    pidRef.current.reset();
                }

                stateRef.current.compHz = compHz;

                // 送风温度热惯性：加快响应
                let saTemp = stateRef.current.saTemp * (1 - alpha) + saTemp_target * alpha;
                saTemp = Math.max(10, saTemp);
                stateRef.current.saTemp = saTemp;

                // === 机房热平衡 ===
                const Q_removed = m_air * cp * (raTemp - saTemp);
                const Q_net = qLoad - Q_removed;
                const dT_dt = Q_net / THERMAL_MASS;
                const newRaTemp = raTemp + dT_dt * safedt;
                stateRef.current.raTemp = Math.max(15, newRaTemp);

                // === 其他温度 ===
                const roomTemp = saTemp + 2;  // 冷通道比送风高2度
                const deltaT_primary = raTemp - coreOut;
                const eaTemp = Math.max(effectiveOaTemp, effectiveOaTemp + deltaT_primary); // 使用扰动后的温度

                // === 性能指标 ===
                // 限制IEC最大换热能力 (模拟物理极限，如100kW)
                const MAX_IEC_CAPACITY = 100000; // 100kW
                let Q_iec = m_air * cp * (raTemp - coreOut);
                Q_iec = Math.min(Q_iec, MAX_IEC_CAPACITY);

                const Q_total = Q_iec + Q_dx_actual;
                const capacity_kw = Q_total / 1000;

                // 功率计算 (风机+压缩机) 和 COP
                // === 功率计算 ===
                // EC风机：阶梯加载，转速越小越省电，超载非常耗电
                let fanPowerRatio = fanSpeed_actual / 100;
                let fanPower_kw;
                if (fanPowerRatio <= 0.5) {
                    // 低速运行(0-50%)：立方关系，非常省电
                    fanPower_kw = Math.pow(fanPowerRatio, 3) * FAN_RATED_POWER;
                } else if (fanPowerRatio <= 0.8) {
                    // 中速运行(50-80%)：立方关系
                    fanPower_kw = Math.pow(fanPowerRatio, 3) * FAN_RATED_POWER;
                } else if (fanPowerRatio <= 1.0) {
                    // 高速运行(80-100%)：功率快速上升
                    fanPower_kw = Math.pow(fanPowerRatio, 3) * FAN_RATED_POWER * 1.1;
                } else if (fanPowerRatio <= 1.1) {
                    // 轻微超载(100-110%)：功率显著上升
                    fanPower_kw = FAN_RATED_POWER * (1.1 + (fanPowerRatio - 1.0) * 5);
                } else {
                    // 严重超载(110%+)：功率急剧上升
                    // 120%时约为额定的2.5倍 (1.1 + 0.2*7 + 0.04*10 = 2.9)
                    const overload = fanPowerRatio - 1.0;
                    fanPower_kw = FAN_RATED_POWER * (1.1 + overload * 7 + Math.pow(overload, 2) * 10);
                }

                // 压缩机功耗：制冷量/COP + 损耗（电机损耗、变频器损耗等）
                let compPower_kw = 0;
                if (dxOn && compHz > 0) {
                    const COP_actual = DX_COP * (0.9 + 0.1 * (compHz / DX_MAX));
                    // 基础制冷功耗
                    const basePower_kw = (Q_dx_actual / COP_actual) / 1000;
                    // 损耗系数：低频损耗大（变频器效率低），高频损耗也大（电机发热）
                    const freqRatio = compHz / DX_MAX;
                    const lossCoeff = 1.15 + 0.1 * Math.abs(freqRatio - 0.6); // 60%频率时效率最高
                    compPower_kw = basePower_kw * lossCoeff;
                }
                const power_kw = fanPower_kw + compPower_kw;
                const cop = power_kw > 0 ? (capacity_kw / power_kw) : 0;

                // EEV 过热度控制 (目标5°C)
                let eevOpening = stateRef.current.eevOpening;
                if (dxOn) {
                    const targetSH = 5;
                    const actualSH = 10;  // 简化假设
                    const shError = actualSH - targetSH;
                    const eevControl = eevPidRef.current.update(shError, safedt);
                    eevOpening += eevControl * 10;
                    eevOpening = Math.max(0, Math.min(480, eevOpening));
                } else {
                    eevOpening = 0;
                    eevPidRef.current.reset();
                }
                stateRef.current.eevOpening = eevOpening;

                // 冷媒状态 (简化)
                const condTemp = effectiveOaTemp + 15 + 0.1 * capacity_kw; // 使用扰动后的温度
                const evapTemp = saTemp - 10;
                const highPress = 50 * condTemp;
                const lowPress = 25 * evapTemp + 600;

                // === 调试日志 (每3秒一次) ===
                stateRef.current.logCounter = (stateRef.current.logCounter || 0) + 1;
                if (stateRef.current.logCounter % 4 === 0) {
                    console.group('🌡️ HVAC 全局状态监控');
                    console.log(`⏱️ 时间步长: ${safedt.toFixed(3)}s | 模式: ${mode}`);

                    console.groupCollapsed('1. 温度概览 (Temperatures)');
                    console.log(`室外(OA): ${effectiveOaTemp.toFixed(2)}°C (基准${oaTemp}+扰动${stateRef.current.oaNoise.toFixed(2)})`);
                    console.log(`湿球(WB): ${wb.toFixed(2)}°C | 露点(DP): --`);

                    // 物理极限警告
                    if ((mode === 'wet' || (mode === 'hybrid' && !dxOn)) && saSet < wb) {
                        console.warn(`⚠️ 物理极限: 目标送风(${saSet.toFixed(1)}°C) < 湿球温度(${wb.toFixed(1)}°C)。仅靠蒸发冷却无法达成，必须开启压缩机!`);
                    }

                    console.log(`回风(RA): ${raTemp.toFixed(2)}°C (目标: ${raTarget.toFixed(1)}°C)`);
                    console.log(`芯体出风(CoreOut): ${coreOut.toFixed(2)}°C`);
                    console.log(`送风(SA): ${saTemp.toFixed(2)}°C (设定: ${saSet.toFixed(1)}°C, 偏差: ${saError.toFixed(2)}°C)`);
                    console.log(`机房冷通道(Room): ${roomTemp.toFixed(2)}°C`);
                    console.log(`排风(EA): ${eaTemp.toFixed(2)}°C`);
                    console.groupEnd();

                    console.groupCollapsed('2. 控制信号 (Control Signals)');
                    console.log(`制冷需求(CFC): ${cfc.toFixed(1)}% (积分项: ${stateRef.current.cfcIntegral.toFixed(2)})`);
                    console.log(`风机转速: ${fanSpeed_actual.toFixed(1)}% (流量: ${airflow_m3h.toFixed(0)} m³/h)`);
                    console.log(`喷淋状态: ${sprayOn ? '开启' : '关闭'}`);
                    console.log(`压缩机状态: ${dxOn ? '开启' : '关闭'} (请求: ${dxWanted ? '是' : '否'})`);
                    console.log(`压缩机频率: ${compHz.toFixed(1)} Hz`);
                    console.log(`电子膨胀阀(EEV): ${eevOpening.toFixed(0)} step`);
                    console.groupEnd();

                    console.groupCollapsed('3. 能量与功率 (Energy & Power)');
                    console.log(`机房热负载: ${(qLoad / 1000).toFixed(1)} kW`);
                    console.log(`实际移除热量: ${(Q_removed / 1000).toFixed(1)} kW`);
                    console.log(`IEC换热量: ${(Q_iec / 1000).toFixed(1)} kW`);
                    console.log(`DX制冷量: ${(Q_dx_actual / 1000).toFixed(1)} kW`);
                    console.log(`总制冷量: ${capacity_kw.toFixed(1)} kW`);
                    console.log(`风机功率: ${fanPower_kw.toFixed(2)} kW`);
                    console.log(`压缩机功率: ${compPower_kw.toFixed(2)} kW`);
                    console.log(`系统COP: ${cop.toFixed(2)}`);
                    console.groupEnd();

                    console.groupCollapsed('4. 冷媒循环 (Refrigerant Cycle)');
                    console.log(`冷凝温度: ${condTemp.toFixed(1)}°C | 压力: ${highPress.toFixed(0)} kPa`);
                    console.log(`蒸发温度: ${evapTemp.toFixed(1)}°C | 压力: ${lowPress.toFixed(0)} kPa`);
                    console.log(`过热度: ${(actualSaTemp - evapTemp).toFixed(1)}°C`);
                    console.log(`过冷度: ${(condTemp - (effectiveOaTemp + 15)).toFixed(1)}°C`);
                    console.groupEnd();

                    console.groupEnd();
                }

                // === 更新UI状态 ===
                setStats({
                    oaTemp: safeNumber(effectiveOaTemp, 1), // 显示扰动后的室外温度
                    wb: safeNumber(wb, 1),
                    raTemp: safeNumber(stateRef.current.raTemp, 1),
                    roomTemp: safeNumber(roomTemp, 1),
                    saTemp: safeNumber(saTemp, 1),
                    coreOut: safeNumber(coreOut, 1),
                    eaTemp: safeNumber(eaTemp, 1),
                    sprayOn,
                    dxOn,
                    compHz: safeNumber(compHz, 0),
                    eevOpening: safeNumber(eevOpening, 0),
                    fanSpeed_actual: safeNumber(fanSpeed_actual, 0),  // 实际风速
                    cfc: safeNumber(cfc, 0),  // 制冷需求
                    airflow_kgs: safeNumber(m_air, 2),
                    airflow_m3h: safeNumber(airflow_m3h, 0),
                    capacity_kw: safeNumber(capacity_kw, 1),
                    Q_iec_kw: safeNumber(Q_iec / 1000, 1),
                    Q_dx_kw: safeNumber(Q_dx_actual / 1000, 1),
                    power_kw: safeNumber(power_kw, 1),
                    cop: safeNumber(cop, 2),
                    condTemp: safeNumber(condTemp, 1),
                    evapTemp: safeNumber(evapTemp, 1),
                    highPress: safeNumber(highPress, 0),
                    lowPress: safeNumber(lowPress, 0),
                    superheat: safeNumber(actualSaTemp - evapTemp, 1),
                    subcool: safeNumber(condTemp - (effectiveOaTemp + 15), 1), // 使用扰动后的温度
                    compPower: safeNumber(compPower_kw * 1000, 0),
                    error: null
                });


            } catch (error) {
                console.error('❌ HVAC 物理计算错误:', error);
                // 发生错误时，保持上一次的有效状态，只更新错误信息
                setStats(prev => ({ ...prev, error: error.message }));
            }

        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);

    }, [mode, oaTemp, oaRh, saSet, qLoad, fanSpeed, SPECS]);

    return stats;
};