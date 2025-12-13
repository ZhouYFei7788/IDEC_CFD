// src/hooks/useCopAnalysis.js
import { useState, useEffect, useRef } from 'react';

/**
 * COP分析Hook - 记录和分析各送风温度设定点的COP和PUE
 */
export const useCopAnalysis = (stats, params) => {
    // 是否正在记录
    const [isRecording, setIsRecording] = useState(false);

    // 存储每个温度设定点的统计数据
    const [tempStats, setTempStats] = useState({});
    const [overallAvgCop, setOverallAvgCop] = useState(0);
    const [overallAvgPue, setOverallAvgPue] = useState(0);
    const lastUpdateRef = useRef(Date.now());
    const recordStartTimeRef = useRef(null);

    useEffect(() => {
        // 只有在记录状态下才更新数据
        if (!isRecording) return;
        if (!stats || !params || !stats.cop || stats.cop <= 0) return;

        const now = Date.now();
        const dt = (now - lastUpdateRef.current) / 1000; // 秒
        lastUpdateRef.current = now;

        // 获取当前送风温度设定值
        const saSet = params.saSet;
        const currentCop = stats.cop;

        // 计算PUE (简化计算: PUE = 1 + 制冷功率/IT负载功率)
        // IT负载功率 = qLoad (W), 制冷功率 = power_kw * 1000 (W)
        const itPower = params.qLoad || 50000;
        const coolingPower = (stats.power_kw || 0) * 1000;
        const currentPue = coolingPower > 0 ? 1 + (coolingPower / itPower) : 1;

        // 更新统计数据
        setTempStats(prev => {
            const key = saSet.toString();
            const existing = prev[key] || {
                totalCop: 0,
                totalPue: 0,
                count: 0,
                runTime: 0,
                minCop: Infinity,
                maxCop: 0,
                minPue: Infinity,
                maxPue: 0,
                samples: []
            };

            const newSample = {
                time: now,
                cop: currentCop,
                pue: currentPue,
                power: stats.power_kw || 0,
                capacity: stats.capacity_kw || 0
            };

            // 只保留最近100个样本用于图表
            const samples = [...existing.samples, newSample].slice(-100);

            const updated = {
                ...prev,
                [key]: {
                    totalCop: existing.totalCop + currentCop,
                    totalPue: existing.totalPue + currentPue,
                    count: existing.count + 1,
                    runTime: existing.runTime + dt,
                    avgCop: (existing.totalCop + currentCop) / (existing.count + 1),
                    avgPue: (existing.totalPue + currentPue) / (existing.count + 1),
                    minCop: Math.min(existing.minCop, currentCop),
                    maxCop: Math.max(existing.maxCop, currentCop),
                    minPue: Math.min(existing.minPue, currentPue),
                    maxPue: Math.max(existing.maxPue, currentPue),
                    samples,
                    lastUpdate: now
                }
            };

            // 计算总体平均
            let totalCopSum = 0;
            let totalPueSum = 0;
            let totalCount = 0;
            Object.values(updated).forEach(stat => {
                totalCopSum += stat.totalCop;
                totalPueSum += stat.totalPue;
                totalCount += stat.count;
            });
            setOverallAvgCop(totalCount > 0 ? totalCopSum / totalCount : 0);
            setOverallAvgPue(totalCount > 0 ? totalPueSum / totalCount : 0);

            return updated;
        });

    }, [stats?.cop, stats?.power_kw, params?.saSet, isRecording]);

    // 开始记录
    const startRecording = () => {
        setIsRecording(true);
        recordStartTimeRef.current = Date.now();
        lastUpdateRef.current = Date.now();
    };

    // 暂停记录
    const pauseRecording = () => {
        setIsRecording(false);
    };

    // 获取排行榜（按平均COP降序）
    const getRanking = () => {
        return Object.entries(tempStats)
            .map(([temp, stat]) => ({
                temp: parseFloat(temp),
                avgCop: stat.avgCop,
                avgPue: stat.avgPue,
                minCop: stat.minCop === Infinity ? 0 : stat.minCop,
                maxCop: stat.maxCop,
                minPue: stat.minPue === Infinity ? 0 : stat.minPue,
                maxPue: stat.maxPue,
                runTime: stat.runTime,
                count: stat.count,
                samples: stat.samples
            }))
            .sort((a, b) => b.avgCop - a.avgCop);
    };

    // 格式化运行时间
    const formatRunTime = (seconds) => {
        if (seconds < 60) return `${Math.floor(seconds)}秒`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}分${Math.floor(seconds % 60)}秒`;
        return `${Math.floor(seconds / 3600)}时${Math.floor((seconds % 3600) / 60)}分`;
    };

    // 清除统计数据
    const clearStats = () => {
        setTempStats({});
        setOverallAvgCop(0);
        setOverallAvgPue(0);
    };

    // 获取当前记录时长
    const getRecordingDuration = () => {
        if (!recordStartTimeRef.current) return 0;
        return (Date.now() - recordStartTimeRef.current) / 1000;
    };

    return {
        isRecording,
        tempStats,
        overallAvgCop,
        overallAvgPue,
        startRecording,
        pauseRecording,
        getRanking,
        formatRunTime,
        clearStats,
        getRecordingDuration
    };
};

export default useCopAnalysis;
