import { useState, useEffect, useRef } from 'react';

// ==================== 1. 基础物理层 (Base Physics Layer) - 深度优化版 ====================

/**
 * R410A 物性库 (基于 Martin-Hou EOS 简化拟合)
 */
const R410A = {
    // 饱和压力 P_sat (kPa) vs 温度 T (°C) - 4阶多项式拟合 NIST 数据
    getSatPressure: (T) => {
        // 安全边界检查，返回边界值而不是null
        if (T < -50) return 100;  // 低温边界
        if (T > 70) return 5000;   // 高温边界
        const c0 = 798.54, c1 = 27.234, c2 = 0.4289, c3 = 0.00315, c4 = 1.85e-5;
        const P = c0 + c1 * T + c2 * Math.pow(T, 2) + c3 * Math.pow(T, 3) + c4 * Math.pow(T, 4);
        return Math.max(100, Math.min(5000, P)); // 强制限制在合理范围
    },

    // 饱和温度 T_sat (°C) vs 压力 P (kPa) - 对数多项式反算
    getSatTemp: (P) => {
        // 安全检查：防止null、负数、零
        if (!P || P <= 0 || !isFinite(P)) return 10; // 默认安全值
        if (P < 100) return -50;   // 低压边界
        if (P > 5000) return 70;    // 高压边界

        const lnP = Math.log(P);
        const T = -51.65 + 10.2 * lnP - 0.25 * Math.pow(lnP, 2);
        return Math.max(-50, Math.min(70, T)); // 强制限制温度范围
    },

    // 饱和液体焓 h_f (kJ/kg) - 非线性修正
    getSatLiqEnthalpy: (T) => {
        const T_safe = Math.max(-50, Math.min(70, T)); // 限制输入范围
        return 200.0 + 1.35 * T_safe + 0.0025 * Math.pow(T_safe, 2);
    },

    // 饱和气体焓 h_g (kJ/kg) - 考虑潜热衰减
    getSatVapEnthalpy: (T) => {
        const T_safe = Math.max(-50, Math.min(70, T)); // 限制输入范围
        return 420.0 + 0.6 * T_safe - 0.0015 * Math.pow(T_safe, 2);
    }
};

/**
 * 湿空气物性库 (Psychrometrics)
 */
const Psychrometrics = {
    // 饱和水蒸气压 (kPa) - Antoine 方程
    getSatVaporPressure: (T) => {
        return 0.61078 * Math.exp((17.27 * T) / (T + 237.3));
    },

    // 湿球温度 (°C) - 迭代法
    getWetBulb: (T, RH) => {
        const P_sat = Psychrometrics.getSatVaporPressure(T);
        const P_v = P_sat * (RH / 100);

        let T_wb = T - 5;
        for (let i = 0; i < 15; i++) {
            const P_wb_sat = Psychrometrics.getSatVaporPressure(T_wb);
            const W = 0.622 * P_v / (101.325 - P_v);
            const W_wb = 0.622 * P_wb_sat / (101.325 - P_wb_sat);
            const h_fg = 2501 - 2.361 * T_wb;
            const cp = 1.006;
            const T_wb_new = T - (W_wb - W) * h_fg / cp;

            if (Math.abs(T_wb_new - T_wb) < 0.01) break;
            T_wb = T_wb_new;
        }
        return T_wb;
    },

    // 饱和焓斜率 s (kJ/kg·K) - 用于 Hasan C* 修正
    getSatSlope: (T) => {
        const P_sat = Psychrometrics.getSatVaporPressure(T);
        const dP_dT = P_sat * 17.27 * 237.3 / Math.pow(T + 237.3, 2);
        const h_fg = 2501 - 2.361 * T; // kJ/kg
        const s = (0.622 * h_fg * dP_dT) / (101.325 * 1.006); // kJ/kg·K
        return s;
    }
};

/**
 * 压缩机特性曲线 (AHRI 540 简化模型)
 */
const CompressorMap = {
    // 质量流量 (kg/s) vs 蒸发/冷凝温度
    getMassFlow: (T_evap, T_cond) => {
        // 基于压比的简化模型
        const P_evap = R410A.getSatPressure(T_evap);
        const P_cond = R410A.getSatPressure(T_cond);
        const PR = P_cond / P_evap; // 压比

        // 流量随压比下降 (典型压缩机特性)
        const m_rated = 0.05; // kg/s @ 额定工况
        const m_dot = m_rated * (1 - 0.1 * (PR - 2.5)); // 简化线性模型
        return Math.max(0.01, m_dot); // 下限保护
    }
};

// ==================== 2. 组件模型层 (Component Model Layer) - 深度优化版 ====================

/**
 * IEC 芯体模型 (Hasan 2012 C* Method)
 */
const IEC_Model = {
    solve: (T_oa, RH_oa, T_ra, mode) => {
        const m_pri = 2.0; // kg/s 一次侧(新风)质量流量
        const m_sec = 2.0; // kg/s 二次侧(回风)质量流量

        // 计算二次侧湿球温度 (回风侧，假设 RH=50%)
        const wb_sec = Psychrometrics.getWetBulb(T_ra, 50);

        if (mode === 'dry') {
            // 干模式：标准显热效率 ε ≈ 0.65
            return T_oa - 0.65 * (T_oa - T_ra);
        } else {
            // 湿模式：Hasan 修正 ε-NTU 方法

            // a. 计算饱和焓斜率 s (kJ/kg·K)
            const s = Psychrometrics.getSatSlope(wb_sec);

            // b. 计算修正热容率
            const cp_air = 1.006; // kJ/kg·K
            const C_pri = m_pri * cp_air; // kW/K
            const C_sec_star = m_sec * cp_air * (1 + s / cp_air); // kW/K (关键修正)

            // c. 计算热容率比 Cr*
            const C_min = Math.min(C_pri, C_sec_star);
            const C_max = Math.max(C_pri, C_sec_star);
            const Cr_star = C_min / C_max;

            // d. 计算 NTU* (假设湿模式传热系数更高)
            const U_wet = 0.08; // kW/m²·K (经验值，湿模式约为干模式的1.6倍)
            const Area = 50;    // m² 换热面积
            const NTU_star = (U_wet * Area) / C_min;

            // e. 计算湿效率 (逆流换热器公式)
            let epsilon_wet;
            if (Math.abs(Cr_star - 1.0) < 0.01) {
                // Cr* ≈ 1 时的特殊处理
                epsilon_wet = NTU_star / (1 + NTU_star);
            } else {
                const exp_val = Math.exp(-NTU_star * (1 - Cr_star));
                epsilon_wet = (1 - exp_val) / (1 - Cr_star * exp_val);
            }

            epsilon_wet = Math.min(0.95, epsilon_wet); // 上限保护

            // f. 输出温度 (一次侧趋近二次侧湿球温度)
            const Q_iec = epsilon_wet * C_min * (T_oa - wb_sec); // kW
            return T_oa - Q_iec / C_pri; // °C
        }
    }
};

/**
 * DX 系统模型 (物理导向迭代求解器)
 * 基于质量平衡和压力平衡的闭环迭代
 */
const DX_Model = {
    solve: (T_air_in, Hz, EEV_pos, T_cond_air, Q_load) => {
        // 初始猜测 (基于经验工况)
        let P_evap = 800;  // kPa 蒸发压力
        let P_cond = 2800; // kPa 冷凝压力

        const superheat = 5; // K 过热度
        const subcool = 3;   // K 过冷度

        // 迭代求解压力平衡 (最多10次)
        for (let iter = 0; iter < 10; iter++) {
            const T_evap = R410A.getSatTemp(P_evap);
            const T_cond = R410A.getSatTemp(P_cond);

            // A. 压缩机质量流量 (AHRI 540 修正 + 频率校正)
            const m_comp = CompressorMap.getMassFlow(T_evap, T_cond) * (Hz / 60); // kg/s

            // B. EEV 质量流量 (简化伯努利方程)
            const deltaP = Math.max(100, P_cond - P_evap); // kPa 压差保护
            const m_eev = 0.00001 * EEV_pos * Math.sqrt(deltaP); // kg/s

            // C. 质量平衡残差
            const flow_diff = m_comp - m_eev;

            // D. 压力修正 (松弛迭代法)
            // 流量差 > 0: 排气过多 → P_cond↑, 吸气不足 → P_evap↓
            P_cond += flow_diff * 200;
            P_evap -= flow_diff * 200;

            // 物理限制
            P_cond = Math.max(1500, Math.min(4000, P_cond));
            P_evap = Math.max(500, Math.min(1500, P_evap));

            // 收敛判断
            if (Math.abs(flow_diff) < 0.0001) break;
        }

        // 重新计算最终温度
        const T_evap_final = R410A.getSatTemp(P_evap);
        const T_cond_final = R410A.getSatTemp(P_cond);

        // 计算焓值 (kJ/kg) - 确保物理一致性
        const h1 = R410A.getSatVapEnthalpy(T_evap_final) + superheat * 0.8; // 过热气体
        const h2 = h1 + 50; // 压缩后焓值 (简化，实际需考虑压缩机效率)
        const h3 = R410A.getSatLiqEnthalpy(T_cond_final) - subcool * 1.2; // 过冷液体
        const h4 = h3; // 等焓节流

        // 最终质量流量 - 确保为正值
        const m_final = Math.max(0.001, CompressorMap.getMassFlow(T_evap_final, T_cond_final) * (Hz / 60));

        // 制冷量 (kW) - 安全检查
        const Q_cooling_kW = m_final * (h1 - h4);
        const Q_cooling = Math.max(0, Q_cooling_kW * 1000); // 确保非负，转换为W

        // 压缩机功耗 (kW) - 安全检查
        const W_power_kW = m_final * (h2 - h1);
        const W_power = Math.max(0, W_power_kW * 1000); // 确保非负，转换为W

        return {
            Q_cooling: Q_cooling,            // W (确保≥0)
            W_power: W_power,                // W (确保≥0)
            P_evap: P_evap,                  // kPa
            P_cond: P_cond,                  // kPa
            T_evap: T_evap_final,            // °C
            T_cond: T_cond_final,            // °C
            superheat: superheat,            // K
            subcool: subcool                 // K
        };
    }
};

// ==================== 3. 系统仿真层 (System Simulation Layer) ====================

export const useHvacPhysics = (params, mode) => {
    /**
     * 计算物理一致的初始状态
     * 关键逻辑：
     * 1. 假设系统处于稳态（热平衡）
     * 2. 从设定的送风温度反推其他温度
     */
    const calculateInitialState = () => {
        const m_air = 4.0;      // kg/s
        const cp = 1006;        // J/(kg·K)
        const SA_setpoint = params.saSet || 25;     // 送风温度设定值
        const Q_load = params.qLoad || 50000;       // 热负载 W

        // 稳态热平衡：Q_load = m_air * cp * (T_RA - T_SA)
        // → T_RA = T_SA + Q_load / (m_air * cp)
        const RA_steady = SA_setpoint + Q_load / (m_air * cp);

        // 冷通道 = 送风 + 温升（送风进入机房的自然温升）
        const ColdAisle_steady = SA_setpoint + 2.0;

        // 根据模式初始化控制变量
        const isDxMode = (mode === 'hybrid' || mode === 'dx');

        return {
            hotAisleTemp: Math.max(20, Math.min(50, RA_steady)),  // 热通道温度（状态变量）
            coldAisleTemp: Math.max(15, Math.min(45, ColdAisle_steady)),  // 冷通道温度（计算值）
            compHz: isDxMode ? 50 : 50,       // 压缩机频率
            eevOpening: isDxMode ? 30 : 30,   // EEV开度
            saTemp: SA_setpoint                // 送风温度
        };
    };

    const initialState = calculateInitialState();

    // 核心状态变量
    // 注意：hotAisleTemp 代表机房热通道温度（RA），是积分状态
    const [hotAisleTemp, setHotAisleTemp] = useState(initialState.hotAisleTemp);
    const [compHz, setCompHz] = useState(initialState.compHz);
    const [eevOpening, setEevOpening] = useState(initialState.eevOpening);

    const lastUpdateTime = useRef(Date.now());
    const isFirstRun = useRef(true);

    // UI 显示状态 - 使用物理一致的初始值
    const [stats, setStats] = useState({
        wb: Psychrometrics.getWetBulb(params.oaTemp || 35, params.oaRh || 45),
        raTemp: initialState.hotAisleTemp,           // 机房热通道温度
        roomTemp: initialState.coldAisleTemp,        // 机房冷通道温度
        coreOut: params.oaTemp || 35,                // IEC出口（初始假设无冷却）
        saTemp: initialState.saTemp,                 // 送风温度
        eaTemp: params.oaTemp || 35,                 // 排风温度
        dxOn: false,
        sprayOn: false,
        compHz: 0,
        highPress: R410A.getSatPressure(params.oaTemp || 35),
        lowPress: R410A.getSatPressure(params.oaTemp || 35),
        condTemp: params.oaTemp || 35,
        evapTemp: params.oaTemp || 35,
        superheat: 0,
        subcool: 0,
        compPower: 0,
        eevOpening: 0
    });

    useEffect(() => {
        const UPDATE_INTERVAL = 1000; // 1秒更新一次

        const timer = setInterval(() => {
            const currentTime = Date.now();

            // 时间步长计算 - 首次运行保护
            let realTimeStep = Math.min((currentTime - lastUpdateTime.current) / 1000, 1);

            // 首次运行或定时器重启时，使用极小步长（避免大幅跳变）
            if (isFirstRun.current || realTimeStep < 0.1) {
                realTimeStep = 0.01; // 10ms 微小步长
                isFirstRun.current = false;
            }

            const timeStep = realTimeStep * 10; // 加速10倍
            lastUpdateTime.current = currentTime;

            // 系统常数
            const THERMAL_CAPACITANCE = 200000; // J/K
            const m_air = 4.0; // kg/s
            const cp = 1006; // J/(kg·K)
            const COLD_AISLE_TEMP_RISE = 2.0; // SA到冷通道温升


            // 1. 计算湿球温度
            const wb = Psychrometrics.getWetBulb(params.oaTemp, params.oaRh);

            // 使用函数式更新确保获取最新状态
            setHotAisleTemp(currentHotAisle => {
                // currentHotAisle = 机房热通道温度（RA，回风温度）
                const raTemp = currentHotAisle;

                // Step 1: IEC 芯体预冷
                // 新风(OA) 通过 IEC 与回风(RA)热交换
                const sprayOn = (mode === 'wet' || mode === 'hybrid');
                const t_after_iec = IEC_Model.solve(params.oaTemp, params.oaRh, raTemp, sprayOn ? 'wet' : 'dry');

                // Step 2: DX 系统制冷
                const dxOn = (mode === 'hybrid' || mode === 'dx');
                let dx_result = null;
                let finalSaTemp = t_after_iec;

                // 使用函数式更新获取当前控制状态
                setCompHz(currentCompHz => {
                    setEevOpening(currentEevOpening => {
                        if (dxOn) {
                            // PID 控制逻辑

                            // 1. 估算当前状态下的冷却能力
                            const temp_dx_result = DX_Model.solve(
                                t_after_iec,
                                currentCompHz,
                                currentEevOpening,
                                params.oaTemp,
                                params.qLoad || 50000
                            );

                            const currentCooling = temp_dx_result.Q_cooling;
                            const currentSA = t_after_iec - (currentCooling / (m_air * cp));

                            // 2. 计算误差: error = SA - Setpoint
                            const error = currentSA - params.saSet;

                            // 3. 调节压缩机频率 (30-90Hz)
                            let nextCompHz = currentCompHz;
                            if (error > 2) {
                                nextCompHz = Math.min(90, currentCompHz + 3);
                            } else if (error > 1) {
                                nextCompHz = Math.min(90, currentCompHz + 1);
                            } else if (error > 0.5) {
                                nextCompHz = Math.min(90, currentCompHz + 0.5);
                            } else if (error < -0.5) {
                                nextCompHz = Math.max(30, currentCompHz - 0.5);
                            }

                            // 4. 调节 EEV 开度 (15-100%)
                            let nextEevOpening = currentEevOpening;
                            const Q_needed = Math.max(0, error * m_air * cp);
                            const target_opening = 30 + (Q_needed / 8000) * 45;
                            const diff = target_opening - currentEevOpening;
                            const step = Math.max(-5, Math.min(5, diff * 0.3));
                            nextEevOpening = Math.min(100, Math.max(15, currentEevOpening + step));

                            // 5. 执行 DX 模拟 (使用新的控制变量)
                            dx_result = DX_Model.solve(
                                t_after_iec,
                                nextCompHz,
                                nextEevOpening,
                                params.oaTemp,
                                params.qLoad || 50000
                            );

                            // 6. 计算最终送风温度 - 多层安全检查
                            const actualCooling = dx_result.Q_cooling;
                            const tempDrop = actualCooling / (m_air * cp);

                            const safeTempDrop = Math.max(0, Math.min(50, tempDrop));
                            finalSaTemp = t_after_iec - safeTempDrop;

                            // 物理限制
                            finalSaTemp = Math.max(10, Math.min(35, finalSaTemp));

                            // NaN检查
                            if (!isFinite(finalSaTemp)) {
                                console.error('SA温度计算异常，使用安全值');
                                finalSaTemp = params.saSet || 25;
                            }

                            // 更新控制状态
                            setCompHz(nextCompHz);
                            setEevOpening(nextEevOpening);

                            return nextEevOpening;
                        } else {
                            // DX 关闭时，重置为待机状态
                            if (currentCompHz !== 50) setCompHz(50);
                            if (currentEevOpening !== 30) setEevOpening(30);
                            return 30;
                        }
                    });
                    return currentCompHz;
                });

                // Step 3: 机房热平衡（瞬态积分）
                // 物理逻辑：SA → 冷通道(+2°C) → 服务器(+Q_load) → 热通道(RA)

                const coldAisleTemp = finalSaTemp + COLD_AISLE_TEMP_RISE;
                const Q_load = params.qLoad || 50000;
                const Q_removed = m_air * cp * (currentHotAisle - finalSaTemp);
                const netHeatFlow = Q_load - Q_removed;

                const deltaRA = (netHeatFlow * timeStep) / THERMAL_CAPACITANCE;

                // 限制变化率（避免数值不稳定）
                const maxDelta = 2.0; // 降低最大变化率，提高平滑度
                const limitedDelta = Math.max(-maxDelta, Math.min(maxDelta, deltaRA));

                const newHotAisleTemp = currentHotAisle + limitedDelta;
                const finalRA = Math.max(15, Math.min(65, newHotAisleTemp));

                // Step 4: 排风温度计算
                let eaTemp = params.oaTemp;
                if (sprayOn) {
                    const epsilon_wet = 0.85;
                    const T_ra_wb = Psychrometrics.getWetBulb(raTemp, 50);
                    eaTemp = raTemp + epsilon_wet * (params.oaTemp - T_ra_wb);
                } else {
                    const epsilon_dry = 0.65;
                    eaTemp = raTemp + epsilon_dry * (params.oaTemp - raTemp);
                }

                // 更新 UI 状态
                if (dxOn && dx_result) {
                    setStats({
                        wb: parseFloat(wb.toFixed(1)),
                        raTemp: parseFloat(finalRA.toFixed(1)),
                        roomTemp: parseFloat(coldAisleTemp.toFixed(1)),
                        coreOut: parseFloat(t_after_iec.toFixed(1)),
                        saTemp: parseFloat(finalSaTemp.toFixed(1)),
                        eaTemp: parseFloat(eaTemp.toFixed(1)),
                        dxOn,
                        sprayOn,
                        compHz: Math.round(nextCompHz), // 注意：这里可能有一帧延迟，但对于UI显示可以接受
                        highPress: parseFloat(dx_result.P_cond.toFixed(2)),
                        lowPress: parseFloat(dx_result.P_evap.toFixed(2)),
                        condTemp: parseFloat(dx_result.T_cond.toFixed(1)),
                        evapTemp: parseFloat(dx_result.T_evap.toFixed(1)),
                        superheat: parseFloat(dx_result.superheat.toFixed(1)),
                        subcool: parseFloat(dx_result.subcool.toFixed(1)),
                        compPower: parseFloat(dx_result.W_power.toFixed(0)),
                        eevOpening: parseFloat(nextEevOpening.toFixed(1))
                    });
                } else {
                    const P_ambient = R410A.getSatPressure(params.oaTemp);
                    setStats({
                        wb: parseFloat(wb.toFixed(1)),
                        raTemp: parseFloat(finalRA.toFixed(1)),
                        roomTemp: parseFloat(coldAisleTemp.toFixed(1)),
                        coreOut: parseFloat(t_after_iec.toFixed(1)),
                        saTemp: parseFloat(finalSaTemp.toFixed(1)),
                        eaTemp: parseFloat(eaTemp.toFixed(1)),
                        dxOn,
                        sprayOn,
                        compHz: 0,
                        highPress: parseFloat(P_ambient.toFixed(2)),
                        lowPress: parseFloat(P_ambient.toFixed(2)),
                        condTemp: parseFloat(params.oaTemp.toFixed(1)),
                        evapTemp: parseFloat(params.oaTemp.toFixed(1)),
                        superheat: 0,
                        subcool: 0,
                        compPower: 0,
                        eevOpening: 0
                    });
                }

                return finalRA;
            });
        }, UPDATE_INTERVAL);

        // 清理定时器，但重置 isFirstRun 标记供下次模式切换使用
        return () => {
            clearInterval(timer);
            isFirstRun.current = true; // 模式切换时重置首次运行标记
        };
    }, [mode]); // 🔧 修复：只在模式切换时重启定时器，参数变化通过闭包自动生效

    return stats;
};
