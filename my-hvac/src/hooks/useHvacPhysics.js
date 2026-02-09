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
        MIN_FREQ: 20,  // 动态降低到20Hz以便柔性调节
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
export const useHvacPhysics = (params, mode, systemSpecs = null) => {
    const SPECS = systemSpecs || SYSTEM_SPECS;
    // 解构参数
    const { oaTemp = 35, oaRh = 45, saSet = 25, qLoad = 50000, fanSpeed = 80 } = params;

    // 持久化状态引用
    const stateRef = useRef({
        raTemp: saSet + 12,
        saTemp: saSet,
        coreOut: saSet + 5,
        roomTemp: saSet + 2,       // 冷通道温度（平滑）
        compHz: 0,
        dxOn: false,
        eevOpening: 240,
        lastTime: Date.now(),
        dxLastChangeTime: Date.now(),
        cfcIntegral: 0,
        oaNoise: 0, // 室外温度扰动
        // CFC变化率追踪
        prevCfc: 35,                // 上一次CFC值
        cfcRate: 0,                 // CFC变化率 (%/秒)
        fanSpeedTarget: 50,         // 目标风速（平滑过渡用）
        // 新增：平滑与计时状态
        cfcAvg: 35,                 // CFC低通滤波值
        overcoolSince: null,        // 过冷开始时间
        minOnTimer: 0,              // 最小开机计时
        minOffTimer: 0,             // 最小关机计时
        dxLockReason: null          // 锁定原因: 'min_on' | 'min_off' | 'overcool' | null
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
                // 目标：维持回风与送风温差
                // 参数化目标温差：适配低送风设定
                const targetDt = Math.max(10, saSet * 0.4);
                const raTarget = saSet + targetDt;

                // 计算瞬时误差
                const saError = stateRef.current.saTemp - saSet;

                // 积分修正 (优化): 增大积分限幅到±10避免抖动
                const integralRate = Math.abs(raTemp - raTarget) < 3 ? 0.1 : 0.01;
                stateRef.current.cfcIntegral += saError * safedt * integralRate;
                stateRef.current.cfcIntegral = Math.max(-10, Math.min(10, stateRef.current.cfcIntegral));

                // 计算总误差 (权重调整: RA 70% / SA 30%)
                const tempError = 0.7 * (raTemp - raTarget) + 0.3 * saError + stateRef.current.cfcIntegral;

                // 将误差映射到 0-100% 的 CFC (基础值40, 增益6)
                let cfc = Math.max(0, Math.min(100, 40 + tempError * 6));

                // CFC低通滤波 (~5-7s 时间常数)
                const CFC_ALPHA = 0.15;
                stateRef.current.cfcAvg = stateRef.current.cfcAvg + CFC_ALPHA * (cfc - stateRef.current.cfcAvg);
                const cfcSmooth = stateRef.current.cfcAvg;

                // CFC底线保护：回风高于设定8°C时至少20%
                if (raTemp > saSet + 8) cfc = Math.max(cfc, 20);

                // === CFC变化率计算 ===
                const cfcDelta = cfc - stateRef.current.prevCfc;
                const cfcRate = cfcDelta / safedt;  // %/秒
                stateRef.current.cfcRate = cfcRate;
                stateRef.current.prevCfc = cfc;

                // 2. 智能送风温度调节
                // 始终精确跟踪用户设定值，移除不稳定的动态设定点逻辑
                let saSet_actual = saSet;

                // 3. 风速控制 —— 以热通道为一号目标
                // 基础风速由热通道误差驱动：回风高于 (saSet+6) 每升高1°C，风速提 5%
                const hotError = raTemp - (saSet + 6);
                let fanSpeedTarget = 50 + hotError * 5;

                // CFC 仅做微调，避免“需求低→风机骤降”
                fanSpeedTarget += (cfcSmooth - 60) * 0.2; // ±8% 以内

                // 送风温度补偿：过冷→降速，过热→升速
                if (saError < -1) {
                    fanSpeedTarget -= Math.abs(saError) * 4;
                } else if (saError > 1.5) {
                    fanSpeedTarget += saError * 5;
                }

                // 最低风速提升，防止压缩机开启时风量过小导致送风暴冷
                const minFan = hotError > 2 ? 55 : 45;
                fanSpeedTarget = Math.max(minFan, Math.min(90, fanSpeedTarget));

                // === 风机PID控制：平滑过渡，限制上涨速度 ===
                const prevFanSpeed = stateRef.current.fanSpeedTarget;
                const fanDelta = fanSpeedTarget - prevFanSpeed;

                // 限制风速变化率
                let maxRiseRate = 8;   // 最大上涨速率 8%/秒
                let maxFallRate = 15;  // 最大下降速率 15%/秒

                // 应用限速
                let limitedDelta;
                if (fanDelta > 0) {
                    limitedDelta = Math.min(fanDelta, maxRiseRate * safedt);  // 限制上涨
                } else {
                    limitedDelta = Math.max(fanDelta, -maxFallRate * safedt); // 限制下降
                }

                let fanSpeed_actual = prevFanSpeed + limitedDelta;
                stateRef.current.fanSpeedTarget = fanSpeed_actual;

                fanSpeed_actual = Math.max(20, Math.min(100, fanSpeed_actual));  // 最低20%

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
                    if (saError > 3) dxWanted = true; // 新增: 送风偏差>3度强制开启DX

                } else if (mode === 'dx') {
                    sprayOn = false;
                    dxWanted = true;

                } else if (mode === 'auto') {
                    // === 自动模式：智能控制所有设备 ===

                    // 1. 智能喷淋控制：根据室外温度和湿球优势决定
                    const oaTempThreshold = 25;
                    const wbAdvantage = effectiveOaTemp - wb;  // 湿球优势（越大越适合喷淋）

                    if (effectiveOaTemp > oaTempThreshold && wbAdvantage > 5) {
                        sprayOn = true;  // 高温且湿球优势明显，开启喷淋
                    } else {
                        sprayOn = false;  // 低温或湿球优势不明显，干模式
                    }

                    // 2. 智能DX控制：基于CFC和温度偏差
                    if (stateRef.current.dxOn) {
                        // DX已开启，检查是否可以关闭
                        if (cfc < 25 && saError < 0) {
                            dxWanted = false;  // 制冷需求低且送风已达标
                        } else {
                            dxWanted = true;
                        }
                    } else {
                        // DX关闭，检查是否需要开启
                        if (cfc > 40 || saError > 2) {
                            dxWanted = true;  // CFC>40%或送风偏差>2度
                        } else {
                            dxWanted = false;
                        }
                    }

                    // 紧急保护
                    if (raTemp > saSet + 12) dxWanted = true;  // 回风过高
                    if (saError < -3) dxWanted = false;  // 送风过冷，停DX
                }

                // === 压缩机启停控制 (cfcSmooth驱动) ===
                const MIN_ON = 90;   // 最小开机时间 (s)
                const MIN_OFF = 45;  // 最小关机时间 (s) — 允许更快重启避免热通道过热
                const timeSinceChange = (now - stateRef.current.dxLastChangeTime) / 1000;

                // 更新计时器
                if (stateRef.current.dxOn) {
                    stateRef.current.minOnTimer = timeSinceChange;
                } else {
                    stateRef.current.minOffTimer = timeSinceChange;
                }

                let dxLockReason = null;

                // 滞回控制 + 最小开/关时间
                if (stateRef.current.dxOn) {
                    // DX已开启，检查是否可以关闭
                    if (cfcSmooth < 30 && saError < -0.5 && stateRef.current.minOnTimer > MIN_ON) {
                        dxWanted = false;
                    } else {
                        dxWanted = true;
                        if (stateRef.current.minOnTimer < MIN_ON) dxLockReason = 'min_on';
                    }
                } else {
                    // DX关闭，检查是否需要开启
                    const hotBypass = raTemp > saSet + 12;           // 热通道极高，直接绕过最小关机
                    const needCool = (cfcSmooth > 45 || raTemp > saSet + 8);

                    if (needCool) {
                        if (stateRef.current.minOffTimer > MIN_OFF || hotBypass) {
                            dxWanted = true;
                        } else {
                            dxWanted = false;
                            dxLockReason = 'min_off';
                        }
                    } else {
                        dxWanted = false;
                    }
                }

                // 过冷保护：只做软降频，不强制关机
                const currentSaTemp = stateRef.current.saTemp;
                stateRef.current.overCoolActive = false;
                if (currentSaTemp < saSet - 1.0) {
                    stateRef.current.overcoolSince = stateRef.current.overcoolSince || now;
                    const ocDuration = (now - stateRef.current.overcoolSince) / 1000;
                    if (ocDuration > 5) {
                        stateRef.current.overCoolActive = true;
                        dxLockReason = dxLockReason || 'overcool';
                    }
                } else {
                    stateRef.current.overcoolSince = null;
                }

                stateRef.current.dxLockReason = dxLockReason;

                if (dxWanted !== stateRef.current.dxOn) {
                    stateRef.current.dxOn = dxWanted;
                    stateRef.current.dxLastChangeTime = now;
                }
                const dxOn = stateRef.current.dxOn;

                // === 风量计算 ===
                const flow_m3s = (MAX_AIRFLOW * (fanSpeed_actual / 100)) / 3600;
                const m_air = flow_m3s * rho;
                const airflow_m3h = MAX_AIRFLOW * (fanSpeed_actual / 100);

                // === IEC换热计算 ===
                const baseEff = sprayOn ? wetEff : dryEff;
                const degr = sprayOn ? wetDegr : dryDegr;
                const ratio = fanSpeed_actual / 100;
                const efficiency = baseEff - ratio * degr;

                const T_sink = sprayOn ? wb : effectiveOaTemp; // 使用扰动后的温度
                const coreOut_target = raTemp - efficiency * (raTemp - T_sink);

                const tau_thermal = 5.0;
                const alpha = Math.min(safedt / tau_thermal, 1);
                let coreOut = stateRef.current.coreOut * (1 - alpha) + coreOut_target * alpha;
                coreOut = Math.max(10, coreOut);
                stateRef.current.coreOut = coreOut;

                // === DX制冷计算 (去掉平台锁定，使用频率爬坡) ===
                let compHz = stateRef.current.compHz;
                let saTemp_target = coreOut;
                let Q_dx_actual = 0;
                const actualSaTemp = stateRef.current.saTemp;

                if (dxOn) {
                    // 频率目标与爬坡限速：热通道优先，其次需求，过冷时进一步削弱
                    const hotBoost = Math.max(0, raTemp - (saSet + 6)) * 2.0;  // 每高1°C加2Hz
                    const cfcBoost = (cfcSmooth - 50) * 0.6;                    // 需求微调
                    const overCoolScale = saError < 0 ? Math.max(0, 1 - Math.abs(saError) / 3) : 1; // 低于设定3°C线性降到0
                    let targetHz = (DX_MIN + hotBoost + cfcBoost) * overCoolScale;

                    // 过冷激活时进一步放宽下限到10Hz，避免暴冷但不断供
                    const dxMinSoft = stateRef.current.overCoolActive ? 10 : DX_MIN;
                    targetHz = Math.max(dxMinSoft, Math.min(DX_MAX, targetHz));

                    // 爬坡限速: 约2 Hz/s
                    const MAX_HZ_STEP = 2.0 * safedt;
                    compHz = compHz + Math.max(-MAX_HZ_STEP, Math.min(MAX_HZ_STEP, targetHz - compHz));

                    Q_dx_actual = DX_CAP * (compHz / DX_MAX);
                    // 限制DX降温幅度，防止低风量时温度骤降
                    const baseMaxDx = fanSpeed_actual < 50 ? 9 : 12;
                    let dxDeltaT = Q_dx_actual / (m_air * cp);
                    // 送风已低于设定时再削弱 40%，避免暴冷
                    if (saError < -0.5) dxDeltaT *= 0.6;
                    dxDeltaT = Math.min(dxDeltaT, baseMaxDx);
                    saTemp_target = coreOut - dxDeltaT;
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

                // === 冷通道温度（平滑到送风+2°C，避免瞬时剧烈波动）===
                const roomTempTarget = saTemp + 2;
                const tau_room = 6.0; // 冷通道等效时间常数（秒）
                const alphaRoom = Math.min(safedt / tau_room, 1);
                const roomTemp = stateRef.current.roomTemp * (1 - alphaRoom) + roomTempTarget * alphaRoom;
                stateRef.current.roomTemp = roomTemp;

                // === 其他温度 ===
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
                const fanPower_kw = Math.pow(fanSpeed_actual / 100, 3) * FAN_RATED_POWER;
                let compPower_kw = 0;
                if (dxOn && compHz > 0) {
                    const COP_actual = DX_COP * (0.9 + 0.1 * (compHz / DX_MAX));
                    compPower_kw = Q_dx_actual / (COP_actual * 1000);
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
                    console.log(`制冷需求(CFC): ${cfc.toFixed(1)}% (滑动平均: ${cfcAvg.toFixed(1)}%, 积分项: ${stateRef.current.cfcIntegral.toFixed(2)})`);
                    console.log(`风机转速: ${fanSpeed_actual.toFixed(1)}% (目标: ${fanSpeedTarget.toFixed(1)}%, 流量: ${airflow_m3h.toFixed(0)} m³/h)`);
                    console.log(`喷淋状态: ${sprayOn ? '开启' : '关闭'}`);
                    console.log(`压缩机状态: ${dxOn ? '开启' : '关闭'} (请求: ${dxWanted ? '是' : '否'}, 锁定: ${dxLockReason || '无'})`);
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
                    // 新增调试字段
                    dxWanted,
                    dxLockReason,
                    cfcSmooth: safeNumber(cfcSmooth, 1),
                    fanSpeedTarget: safeNumber(fanSpeedTarget, 0),
                    overcool: stateRef.current.overcoolSince ? 'active' : '',
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
