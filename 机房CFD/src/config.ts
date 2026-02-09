/**
 * 数据中心可视化配置文件
 * 修改此文件可快速调整场景参数
 */

export const CONFIG = {
    // 场景配置
    scene: {
        numZones: 6,           // HAC 区域数量
        racksPerRow: 8,        // 每排机柜数量
        backgroundColor: '#2a2a2a',
        gridSize: 200,
        gridDivisions: 100,
    },

    // 相机配置
    camera: {
        position: [50, 50, 50] as [number, number, number],
        zoom: 20,
        minZoom: 10,
        maxZoom: 100,
        minPolarAngle: 0,
        maxPolarAngle: Math.PI / 2.5,
    },

    // 尺寸配置
    dimensions: {
        rackWidth: 1.2,
        rackHeight: 3.5,
        rackDepth: 1.5,
        aisleWidth: 2.5,
        rowSpacing: 2.0,
        cabinetHeadWidth: 1.5,
    },

    // 颜色配置
    colors: {
        floor: '#2a2a2a',
        rackBody: '#1e293b',
        rackDoor: '#334155',
        hacGlass: '#0ea5e9',
        stateNormal: '#10b981',
        stateWarning: '#f59e0b',
        stateAlarm: '#ef4444',
        phaseL1: '#ef4444',
        phaseL2: '#eab308',
        phaseL3: '#3b82f6',
    },

    // 告警阈值
    thresholds: {
        // 负载不平衡阈值
        imbalanceWarning: 0.15,  // 15% 不平衡触发警告
        imbalanceAlarm: 0.30,    // 30% 不平衡触发告警

        // 模拟数据生成概率
        alarmProbability: 0.05,   // 5% 机柜处于告警状态
        warningProbability: 0.15, // 15% 机柜处于警告状态
    },

    // 性能配置
    performance: {
        dpr: [1, 2] as [number, number],  // 设备像素比范围
        antialias: true,
        shadowsEnabled: false,  // 关闭阴影以提升性能
        instanceLimit: 20,      // 每个 Instances 的最大数量
    },

    // 动画配置
    animation: {
        airflowSpeed: 3.0,      // 气流动画速度
        pulseSpeed: 2.0,        // 状态灯呼吸速度
        dampingFactor: 0.1,     // 相机阻尼系数
    },

    // UI 配置
    ui: {
        showLegend: true,
        showControls: true,
        showTimestamp: true,
        fontSize: {
            title: '1.25rem',
            normal: '0.875rem',
            small: '0.75rem',
        },
    },

    // 字体配置
    fonts: {
        chinese: 'https://fonts.gstatic.com/s/notosanssc/v36/k3kXo84MPvpLmixcA63oeALhLOCT-xWtmh1s.woff2',
        english: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },

    // 开发配置
    dev: {
        showStats: false,       // 显示性能统计
        showAxes: false,        // 显示坐标轴
        enableDebugLogs: false, // 启用调试日志
    },
};

// 导出类型以供 TypeScript 使用
export type Config = typeof CONFIG;

// 辅助函数：获取状态颜色
export const getStateColor = (state: 'NORMAL' | 'WARNING' | 'ALARM') => {
    switch (state) {
        case 'ALARM': return CONFIG.colors.stateAlarm;
        case 'WARNING': return CONFIG.colors.stateWarning;
        case 'NORMAL':
        default: return CONFIG.colors.stateNormal;
    }
};

// 辅助函数：获取相位颜色
export const getPhaseColor = (phase: 'L1' | 'L2' | 'L3') => {
    switch (phase) {
        case 'L1': return CONFIG.colors.phaseL1;
        case 'L2': return CONFIG.colors.phaseL2;
        case 'L3': return CONFIG.colors.phaseL3;
    }
};

// 辅助函数：计算负载不平衡状态
export const calculateImbalanceState = (l1: number, l2: number, l3: number): 'NORMAL' | 'WARNING' | 'ALARM' => {
    const max = Math.max(l1, l2, l3);
    const min = Math.min(l1, l2, l3);
    const imbalance = (max - min) / (max || 1);

    if (imbalance > CONFIG.thresholds.imbalanceAlarm) return 'ALARM';
    if (imbalance > CONFIG.thresholds.imbalanceWarning) return 'WARNING';
    return 'NORMAL';
};

// 辅助函数：生成随机状态
export const generateRandomState = (): 'NORMAL' | 'WARNING' | 'ALARM' => {
    const rand = Math.random();
    if (rand > (1 - CONFIG.thresholds.alarmProbability)) return 'ALARM';
    if (rand > (1 - CONFIG.thresholds.alarmProbability - CONFIG.thresholds.warningProbability)) return 'WARNING';
    return 'NORMAL';
};

export default CONFIG;
