// src/hooks/useEquipmentFaults.js
import { useState, useEffect, useRef } from 'react';

/**
 * 设备故障定义
 */
const FAULT_TYPES = {
    WATER_PUMP: {
        id: 'WATER_PUMP',
        name: '水泵故障',
        description: '喷淋水泵无法启动',
        impact: '喷淋系统无法使用',
        solution: '检查水泵电源和控制器，必要时更换水泵',
        severity: 'P1',
        icon: '💧',
        color: '#3b82f6',
        probability: 0.005, // 每秒1%概率（约100秒出现一次）
        effect: (state) => ({
            ...state,
            sprayDisabled: true
        })
    },
    COMPRESSOR: {
        id: 'COMPRESSOR',
        name: '压缩机故障',
        description: '压缩机过载保护触发',
        impact: 'DX制冷系统停机，只能使用IEC制冷',
        solution: '检查压缩机电流和温度，冷却后手动复位',
        severity: 'P0',
        icon: '⚡',
        color: '#dc2626',
        probability: 0.009, // 每秒0.8%概率
        effect: (state) => ({
            ...state,
            compressorDisabled: true,
            dxOn: false
        })
    },
    EXPANSION_VALVE: {
        id: 'EXPANSION_VALVE',
        name: '膨胀阀故障',
        description: '电子膨胀阀卡死',
        impact: 'DX制冷效率降低50%',
        solution: '清洁或更换膨胀阀',
        severity: 'P1',
        icon: '🔧',
        color: '#f59e0b',
        probability: 0.005, // 每秒0.5%概率
        effect: (state) => ({
            ...state,
            dxEfficiencyPenalty: 0.7
        })
    },
    EVAPORATOR: {
        id: 'EVAPORATOR',
        name: '蒸发器故障',
        description: '蒸发器结霜严重',
        impact: 'DX制冷能力降低30%',
        solution: '除霜并检查制冷剂充注量',
        severity: 'P2',
        icon: '❄️',
        color: '#06b6d4',
        probability: 0.006, // 每秒0.6%概率
        effect: (state) => ({
            ...state,
            dxCapacityPenalty: 0.5
        })
    },
    CONDENSER: {
        id: 'CONDENSER',
        name: '冷凝器故障',
        description: '冷凝器堵塞',
        impact: 'DX系统COP降低40%，可能导致停机',
        solution: '清洗冷凝器翅片',
        severity: 'P1',
        icon: '🌡️',
        color: '#f97316',
        probability: 0.007, // 每秒0.4%概率
        effect: (state) => ({
            ...state,
            dxCOPPenalty: 0.6,
            compressorDisabled: Math.random() > 0.7 // 30%概率导致停机
        })
    },
    IEC_CORE: {
        id: 'IEC_CORE',
        name: 'IEC芯体故障',
        description: 'IEC换热芯体堵塞',
        impact: 'IEC换热效率降低60%',
        solution: '清洗或更换IEC芯体',
        severity: 'P1',
        icon: '🔲',
        color: '#8b5cf6',
        probability: 0.007, // 每秒0.7%概率
        effect: (state) => ({
            ...state,
            iecEfficiencyPenalty: 0.8
        })
    },
    FAN: {
        id: 'FAN',
        name: '风机故障',
        description: '风机轴承损坏',
        impact: '风量降低50%，噪音增大',
        solution: '更换风机轴承或整个风机',
        severity: 'P0',
        icon: '🌀',
        color: '#ec4899',
        probability: 0.005, // 每秒0.5%概率
        effect: (state) => ({
            ...state,
            fanCapacityPenalty: 0.6
        })
    }
};

/**
 * 设备故障管理Hook
 */
export const useEquipmentFaults = () => {
    const [activeFaults, setActiveFaults] = useState([]);
    const [isPaused, setIsPaused] = useState(false); // 暂停状态
    const lastCheckRef = useRef(Date.now());

    // 随机触发故障
    useEffect(() => {
        const interval = setInterval(() => {
            // 如果暂停，不触发新故障
            if (isPaused) return;

            const now = Date.now();
            const dt = (now - lastCheckRef.current) / 1000;
            lastCheckRef.current = now;

            // 检查每种故障类型
            Object.values(FAULT_TYPES).forEach(faultType => {
                // 如果该故障已存在，跳过
                if (activeFaults.some(f => f.id === faultType.id)) return;

                // 随机触发
                if (Math.random() < faultType.probability * dt) {
                    const newFault = {
                        ...faultType,
                        triggeredAt: now,
                        canClear: true
                    };
                    setActiveFaults(prev => [...prev, newFault]);
                }
            });
        }, 1000); // 每秒检查一次

        return () => clearInterval(interval);
    }, [activeFaults, isPaused]);

    // 手动消除故障
    const clearFault = (faultId) => {
        setActiveFaults(prev => prev.filter(f => f.id !== faultId));
    };

    // 消除所有故障
    const clearAllFaults = () => {
        setActiveFaults([]);
    };

    // 暂停故障触发
    const pauseFaults = () => {
        setIsPaused(true);
    };

    // 恢复故障触发
    const resumeFaults = () => {
        setIsPaused(false);
        lastCheckRef.current = Date.now();
    };

    // 切换暂停状态
    const togglePause = () => {
        if (isPaused) {
            resumeFaults();
        } else {
            pauseFaults();
        }
    };

    // 计算故障影响
    const getFaultEffects = () => {
        let effects = {
            sprayDisabled: false,
            compressorDisabled: false,
            dxEfficiencyPenalty: 0,
            dxCapacityPenalty: 0,
            dxCOPPenalty: 0,
            iecEfficiencyPenalty: 0,
            fanCapacityPenalty: 0
        };

        activeFaults.forEach(fault => {
            const faultEffect = fault.effect(effects);
            effects = { ...effects, ...faultEffect };
        });

        return effects;
    };

    return {
        activeFaults,
        isPaused,
        clearFault,
        clearAllFaults,
        pauseFaults,
        resumeFaults,
        togglePause,
        getFaultEffects,
        faultTypes: FAULT_TYPES
    };
};

export default useEquipmentFaults;
