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
 * 主Hook: HVAC系统物理仿真
 */
export const useHvacPhysics = (params, mode, systemSpecs = null) => {
    const SPECS = systemSpecs || SYSTEM_SPECS;

    // 解构参数
    const { oaTemp = 35, oaRh = 45, saSet = 25, qLoad = 50000, fanSpeed = 80 } = params;

    // 持久化状态引用
    const stateRef = useRef({
        raTemp: saSet + 12,
        saTemp: saSet,
        coreOut: saSet + 5,
        compHz: 0,
        lastTime: Date.now()
    });

    const pidRef = useRef(new SimplePID(5, 0.1, 0.5));

    // UI显示状态
    const [stats, setStats] = useState({
        wb: 20, raTemp: 37, roomTemp: 27, saTemp: 25, coreOut: 30, eaTemp: 33,
        dxOn: false, sprayOn: false, compHz: 0, eevOpening: 30,
        fanSpeed_actual: 80, cfc: 0,  // 智能控制参数
        airflow_kgs: 4.0, airflow_m3h: 3400,
        capacity_kw: 0, Q_iec_kw: 0, Q_dx_kw: 0,  // 制冷量
        power_kw: 0, cop: 0,
        highPress: 2800, lowPress: 800, condTemp: 40, evapTemp: 10,
        superheat: 5, subcool: 3, compPower: 0, error: null,
    });

    useEffect(() => {
        const UPDATE_INTERVAL = 700;  // 更新间隔 (ms)

        // 切换模式时重置PID和时间
        pidRef.current.reset();
        stateRef.current.lastTime = Date.now();

        const timer = setInterval(() => {
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

            // === 湿球温度计算 (Stull公式) ===
            const RH = oaRh;
            const T = oaTemp;
            const wb = T * Math.atan(0.151977 * Math.sqrt(RH + 8.313659))
                + Math.atan(T + RH) - Math.atan(RH - 1.676331)
                + 0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) - 4.686035;

            const raTemp = stateRef.current.raTemp;

            // === 智能控制系统 ===

            // 1. 制冷需求计算 (CFC)
            const T_target = 45;  // 目标温度
            const T_critical = 55;  // 临界温度
            let cfc = 0;
            if (raTemp > T_target) {
                cfc = Math.min(100, ((raTemp - T_target) / (T_critical - T_target)) * 100);
            }

            // 2. 智能送风温度调节
            let saSet_actual = saSet;
            if (raTemp > T_critical) {
                saSet_actual = saSet - 5;  // 机房过热，降低送风温度
            } else if (raTemp < T_target) {
                saSet_actual = saSet;  // 正常
            } else {
                // 线性插值
                const ratio = (raTemp - T_target) / (T_critical - T_target);
                saSet_actual = saSet - 5 * ratio;
            }

            // 3. 动态风速调节
            let fanSpeed_actual = fanSpeed;
            if (mode === 'wet' || mode === 'hybrid') {
                if (cfc < 30) {
                    fanSpeed_actual = Math.max(40, fanSpeed * 0.6);  // 低负载降速
                } else if (cfc < 70) {
                    fanSpeed_actual = fanSpeed;  // 正常
                } else {
                    fanSpeed_actual = Math.min(150, fanSpeed * 1.5);  // 高负载提速（允许超频到150%）
                }
            }

            // === 模式判定 & 设备控制 ===
            let sprayOn = false;
            let dxOn = false;

            if (mode === 'dry') {
                sprayOn = false;
                dxOn = false;
            } else if (mode === 'wet') {
                sprayOn = true;
                dxOn = false;
            } else if (mode === 'hybrid') {
                sprayOn = true;
                // 智能开启压缩机
                if (cfc > 60 || raTemp > T_critical) {
                    dxOn = true;
                } else if (cfc < 40 && raTemp < T_target) {
                    dxOn = false;
                } else {
                    dxOn = stateRef.current.dxOn || false;  // 滞环保持
                }
            } else if (mode === 'dx') {
                sprayOn = false;
                dxOn = true;
            }

            // === 风量计算 ===
            const flow_m3s = (MAX_AIRFLOW * (fanSpeed_actual / 100)) / 3600;
            const m_air = flow_m3s * rho;
            const airflow_m3h = MAX_AIRFLOW * (fanSpeed_actual / 100);

            // === IEC换热计算 ===
            const baseEff = sprayOn ? wetEff : dryEff;
            const degr = sprayOn ? wetDegr : dryDegr;
            const ratio = fanSpeed_actual / 100;
            const efficiency = baseEff - ratio * degr;

            const T_sink = sprayOn ? wb : oaTemp;
            const coreOut_target = raTemp - efficiency * (raTemp - T_sink);

            // 热惯性 (指数平滑)
            const tau_thermal = 1.0;  // 时间常数 (秒)
            const alpha = Math.min(safedt / tau_thermal, 1);
            let coreOut = stateRef.current.coreOut * (1 - alpha) + coreOut_target * alpha;
            coreOut = Math.max(10, coreOut);  // 最低温度限制
            stateRef.current.coreOut = coreOut;

            // === DX制冷计算 ===
            let compHz = stateRef.current.compHz;
            let saTemp_target = coreOut;
            let Q_dx = 0;

            if (dxOn) {
                // PID控制送风温度
                const error = stateRef.current.saTemp - saSet_actual;
                const control = pidRef.current.update(error, safedt);
                compHz = compHz + control * 2;
                compHz = Math.max(DX_MIN, Math.min(DX_MAX, compHz));

                Q_dx = DX_CAP * (compHz / DX_MAX);
                saTemp_target = coreOut - Q_dx / (m_air * cp);
            } else {
                compHz = 0;
                saTemp_target = coreOut;
                pidRef.current.reset();
            }

            stateRef.current.compHz = compHz;

            // 送风温度热惯性
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
            const eaTemp = Math.max(oaTemp, oaTemp + deltaT_primary);

            // === 性能指标 ===
            const Q_iec = m_air * cp * (raTemp - coreOut);
            const Q_total = Q_iec + Q_dx;
            const capacity_kw = Q_total / 1000;

            // 功率计算
            const fanPower = Math.pow(fanSpeed_actual / 100, 3) * FAN_RATED_POWER;
            const compPower = dxOn ? (Q_dx / (DX_COP * 1000)) : 0;
            const power_kw = fanPower + compPower;
            const cop = power_kw > 0 ? (capacity_kw / power_kw) : 0;

            // === 制冷剂状态 (简化模型) ===
            const condTemp = oaTemp + 15 + 0.1 * capacity_kw;
            const evapTemp = saTemp - 10;
            const highPress = 50 * condTemp;
            const lowPress = 25 * evapTemp + 600;
            const superheat = 5 + (raTemp - 45) * 0.1;
            const subcool = 3 + (condTemp - 40) * 0.05;
            const eevOpening = dxOn ? 50 : 0;

            // === 更新UI状态 ===
            setStats({
                wb: Number(wb.toFixed(1)),
                raTemp: Number(stateRef.current.raTemp.toFixed(1)),
                roomTemp: Number(roomTemp.toFixed(1)),
                saTemp: Number(saTemp.toFixed(1)),
                coreOut: Number(coreOut.toFixed(1)),
                eaTemp: Number(eaTemp.toFixed(1)),
                sprayOn,
                dxOn,
                compHz: Number(compHz.toFixed(0)),
                eevOpening,
                fanSpeed_actual: Number(fanSpeed_actual.toFixed(0)),  // 实际风速
                cfc: Number(cfc.toFixed(0)),  // 制冷需求
                airflow_kgs: Number(m_air.toFixed(2)),
                airflow_m3h: Number(airflow_m3h.toFixed(0)),
                capacity_kw: Number(capacity_kw.toFixed(1)),
                Q_iec_kw: Number((Q_iec / 1000).toFixed(1)),
                Q_dx_kw: Number((Q_dx / 1000).toFixed(1)),
                power_kw: Number(power_kw.toFixed(1)),
                cop: Number(cop.toFixed(2)),
                condTemp: Number(condTemp.toFixed(1)),
                evapTemp: Number(evapTemp.toFixed(1)),
                highPress: Number(highPress.toFixed(0)),
                lowPress: Number(lowPress.toFixed(0)),
                superheat: Number(superheat.toFixed(1)),
                subcool: Number(subcool.toFixed(1)),
                compPower: Number((compPower * 1000).toFixed(0)),
                error: null
            });

        }, UPDATE_INTERVAL);

        return () => clearInterval(timer);

    }, [mode, oaTemp, oaRh, saSet, qLoad, fanSpeed, SPECS]);

    return stats;
};