// 磁悬浮冷水机组系统配置
// 基于 CFD仿真报告 和 TECS2/SL-CA-E 0853-S 技术规格

export const SYSTEM_SPECS = {
    // 机组基本信息
    MODEL: 'TECS2/SL-CA-E 0853-S',
    REFRIGERANT: 'R134a',
    NOMINAL_CAPACITY: 850, // kW

    // 压缩机参数 (Danfoss Turbocor TT/TG系列)
    COMPRESSOR: {
        MODEL: 'Turbocor TG310',
        MIN_SPEED: 18000,      // RPM
        MAX_SPEED: 48000,      // RPM
        MIN_FREQ: 30,          // Hz
        MAX_FREQ: 90,          // Hz
        RATED_POWER: 145,      // kW
        SPEED_RATE_LIMIT: 500, // RPM/s (软启动限制)

        // 压比方程系数: Π(N, ṁ) = C1·N² + C2·ṁ·N + C3·ṁ² + C4
        MAP_COEFFICIENTS: {
            C1: 1.2e-8,
            C2: 3.5e-6,
            C3: -0.15,
            C4: 2.0
        },

        // 喘振线系数: ṁ_surge = k1·Π² + k2·Π + k3
        SURGE_LINE: {
            K1: 0.8,
            K2: -2.5,
            K3: 3.0
        },

        // IGV (入口导叶) 参数
        IGV: {
            MIN_ANGLE: 0,      // 度 (全开)
            MAX_ANGLE: 80,     // 度 (全关)
            RESPONSE_TIME: 2   // 秒
        }
    },

    // 冷凝器参数 (V型翅片式风冷)
    CONDENSER: {
        TYPE: 'V-Shape Fin & Coil',
        HEAT_TRANSFER_AREA: 285,  // m²
        FAN_COUNT: 6,
        RATED_AIRFLOW: 156000,    // m³/h
        FAN_POWER: 3.0,           // kW/台

        // 风机参数
        FAN: {
            MIN_SPEED: 20,        // %
            MAX_SPEED: 100,       // %
            STAGES: 6             // 6台变频风机
        }
    },

    // 蒸发器参数 (壳管式满液)
    EVAPORATOR: {
        TYPE: 'Shell & Tube (Flooded)',
        WATER_FLOW: 120,         // m³/h
        DESIGN_INLET_TEMP: 12,   // °C
        DESIGN_OUTLET_TEMP: 7,   // °C
        DESIGN_DT: 5,            // °C 设计温差

        // 液位控制
        LEVEL: {
            SET_POINT: 75,       // % 目标液位
            MIN_LEVEL: 60,       // %
            MAX_LEVEL: 90        // %
        }
    },

    // 经济器参数 (闪蒸罐)
    ECONOMIZER: {
        TYPE: 'Flash Tank',
        EFFICIENCY_BOOST: 0.18,  // COP提升 15-20%

        // 液位控制
        LEVEL: {
            SET_POINT: 50,       // %
            MIN_LEVEL: 30,       // %
            MAX_LEVEL: 70        // %
        }
    },

    // 电子膨胀阀 (EKS驱动)
    EXPANSION_VALVES: {
        TE1: { TYPE: 'Main EEV', MAX_CV: 12, STEPS: 2000 },
        TE2: { TYPE: 'Main EEV', MAX_CV: 12, STEPS: 2000 },
        TE3: { TYPE: 'Economizer EEV', MAX_CV: 6, STEPS: 1500 },
        TE4: { TYPE: 'Economizer EEV', MAX_CV: 6, STEPS: 1500 },
        TE5: { TYPE: 'Anti-Surge EEV', MAX_CV: 8, STEPS: 1000 }
    },

    // R134a 物性参数 (CFD报告5.2节)
    REFRIGERANT_PROPS: {
        LIQUID_DENSITY: 1180,    // kg/m³ @25°C
        GAS_DENSITY: 14,         // kg/m³ @3.5 bar
        SURFACE_TENSION: 0.008,  // N/m
        LATENT_HEAT: 215,        // kJ/kg
        CP_LIQUID: 1.43,         // kJ/(kg·K)
        CP_GAS: 0.89             // kJ/(kg·K)
    }
};

// PID 控制参数
export const PID_PARAMS = {
    // 压缩机转速控制 (目标: 出水温度)
    COMPRESSOR_SPEED: {
        KP: 5.0,
        KI: 0.5,
        KD: 1.0,
        OUTPUT_MIN: 18000, // RPM
        OUTPUT_MAX: 48000  // RPM
    },

    // 防喘振控制 (TE5)
    ANTI_SURGE: {
        KP: 50,
        KI: 10,
        KD: 0,
        SAFETY_MARGIN: 0.1,      // 10% 安全裕度
        EMERGENCY_THRESHOLD: 1.0  // S < 1.0 触发紧急开阀
    },

    // 经济器液位控制 (TE3/TE4)
    ECONOMIZER_LEVEL: {
        KP: 3.0,
        KI: 0.3,
        KD: 0.5,
        OUTPUT_MIN: 0,
        OUTPUT_MAX: 100
    },

    // 蒸发器液位控制 (TE1/TE2)
    EVAPORATOR_LEVEL: {
        KP: 4.0,
        KI: 0.4,
        KD: 0.8,
        OUTPUT_MIN: 0,
        OUTPUT_MAX: 100
    },

    // 冷凝风机控制
    CONDENSER_FAN: {
        KP: 2.0,
        KI: 0.2,
        KD: 0.3,
        TARGET_SUBCOOL: 5  // °C 目标过冷度
    }
};

// 告警阈值
export const ALARM_THRESHOLDS = {
    HIGH_PRESSURE: {
        WARNING: 1800,   // kPa
        ALARM: 2000,     // kPa
        TRIP: 2200       // kPa
    },
    LOW_PRESSURE: {
        WARNING: 250,    // kPa
        ALARM: 200,      // kPa
        TRIP: 150        // kPa
    },
    SUPERHEAT: {
        LOW_WARNING: 3,   // °C
        LOW_ALARM: 1,     // °C (液击风险)
        HIGH_WARNING: 12, // °C
        HIGH_ALARM: 15    // °C
    },
    MOTOR_TEMP: {
        WARNING: 70,      // °C
        ALARM: 80,        // °C
        TRIP: 90          // °C
    },
    SURGE_MARGIN: {
        WARNING: 0.15,    // 15%
        ALARM: 0.10,      // 10%
        CRITICAL: 0.05    // 5%
    }
};

// 工况点预设
export const OPERATING_CONDITIONS = {
    RATED: {
        name: '额定工况',
        ambientTemp: 35,
        waterInletTemp: 12,
        waterOutletTemp: 7,
        capacity: 852
    },
    PART_LOAD_75: {
        name: '75%部分负荷',
        ambientTemp: 28,
        waterInletTemp: 12,
        waterOutletTemp: 7,
        capacity: 639
    },
    PART_LOAD_50: {
        name: '50%部分负荷',
        ambientTemp: 22,
        waterInletTemp: 12,
        waterOutletTemp: 7,
        capacity: 426
    },
    PART_LOAD_25: {
        name: '25%部分负荷',
        ambientTemp: 15,
        waterInletTemp: 12,
        waterOutletTemp: 7,
        capacity: 213
    }
};
