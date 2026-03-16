import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, CheckCircle, XCircle, Bell } from 'lucide-react';
import { ALARM_THRESHOLDS } from '../config';

/**
 * 告警面板组件
 * 基于 CFD仿真报告 的告警阈值
 */
export default function AlertPanel({ stats }) {
    // 生成告警列表
    const generateAlerts = () => {
        const alerts = [];

        // 高压告警
        if (stats?.highPressure > ALARM_THRESHOLDS.HIGH_PRESSURE.TRIP) {
            alerts.push({
                id: 'hp-trip',
                level: 'critical',
                title: '高压停机保护',
                message: `高压 ${stats.highPressure} kPa 超过停机阈值 ${ALARM_THRESHOLDS.HIGH_PRESSURE.TRIP} kPa`,
                action: '立即停机，检查冷凝器风机和环境温度'
            });
        } else if (stats?.highPressure > ALARM_THRESHOLDS.HIGH_PRESSURE.ALARM) {
            alerts.push({
                id: 'hp-alarm',
                level: 'error',
                title: '高压报警',
                message: `高压 ${stats.highPressure} kPa 超过报警阈值`,
                action: '检查冷凝器风机运行状态'
            });
        } else if (stats?.highPressure > ALARM_THRESHOLDS.HIGH_PRESSURE.WARNING) {
            alerts.push({
                id: 'hp-warning',
                level: 'warning',
                title: '高压预警',
                message: `高压 ${stats.highPressure} kPa 接近报警阈值`,
                action: '注意观察'
            });
        }

        // 低压告警
        if (stats?.lowPressure < ALARM_THRESHOLDS.LOW_PRESSURE.TRIP) {
            alerts.push({
                id: 'lp-trip',
                level: 'critical',
                title: '低压停机保护',
                message: `低压 ${stats.lowPressure} kPa 低于停机阈值`,
                action: '立即停机，检查制冷剂充注量'
            });
        } else if (stats?.lowPressure < ALARM_THRESHOLDS.LOW_PRESSURE.ALARM) {
            alerts.push({
                id: 'lp-alarm',
                level: 'error',
                title: '低压报警',
                message: `低压 ${stats.lowPressure} kPa 低于报警阈值`,
                action: '检查蒸发器负荷和膨胀阀'
            });
        }

        // 过热度告警
        if (stats?.superheat < ALARM_THRESHOLDS.SUPERHEAT.LOW_ALARM) {
            alerts.push({
                id: 'sh-low',
                level: 'error',
                title: '过热度过低',
                message: `过热度 ${stats.superheat}°C 存在液击风险`,
                action: '关小膨胀阀'
            });
        } else if (stats?.superheat > ALARM_THRESHOLDS.SUPERHEAT.HIGH_ALARM) {
            alerts.push({
                id: 'sh-high',
                level: 'warning',
                title: '过热度过高',
                message: `过热度 ${stats.superheat}°C 制冷效率下降`,
                action: '开大膨胀阀'
            });
        }

        // 喘振告警
        if (stats?.surgeStatus === 'emergency') {
            alerts.push({
                id: 'surge-emergency',
                level: 'critical',
                title: '紧急防喘振',
                message: '压缩机喘振裕度不足，TE5全开旁通中',
                action: '增加负荷或检查阻塞'
            });
        } else if (stats?.surgeStatus === 'control') {
            alerts.push({
                id: 'surge-control',
                level: 'warning',
                title: '防喘振控制中',
                message: `TE5开度 ${stats.te5Opening}%，维持喘振裕度`,
                action: '正常控制，无需干预'
            });
        }

        // 电机温度告警
        if (stats?.motorTemp > ALARM_THRESHOLDS.MOTOR_TEMP.ALARM) {
            alerts.push({
                id: 'motor-temp',
                level: 'error',
                title: '电机过温',
                message: `电机温度 ${stats.motorTemp}°C 超过报警阈值`,
                action: '检查冷却回路'
            });
        }

        return alerts;
    };

    const alerts = generateAlerts();

    const getLevelIcon = (level) => {
        switch (level) {
            case 'critical': return XCircle;
            case 'error': return AlertCircle;
            case 'warning': return AlertTriangle;
            default: return CheckCircle;
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'critical': return 'bg-red-500/20 border-red-500/50 text-red-400';
            case 'error': return 'bg-orange-500/20 border-orange-500/50 text-orange-400';
            case 'warning': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
            default: return 'bg-green-500/20 border-green-500/50 text-green-400';
        }
    };

    return (
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell size={20} className="text-red-400" />
                    告警中心
                </h3>
                <div className="flex items-center gap-2">
                    {alerts.filter(a => a.level === 'critical').length > 0 && (
                        <span className="px-2 py-1 bg-red-500 rounded-full text-xs text-white font-bold animate-pulse">
                            {alerts.filter(a => a.level === 'critical').length} 严重
                        </span>
                    )}
                    {alerts.filter(a => a.level === 'error').length > 0 && (
                        <span className="px-2 py-1 bg-orange-500 rounded-full text-xs text-white font-bold">
                            {alerts.filter(a => a.level === 'error').length} 报警
                        </span>
                    )}
                    {alerts.filter(a => a.level === 'warning').length > 0 && (
                        <span className="px-2 py-1 bg-yellow-500 rounded-full text-xs text-white font-bold">
                            {alerts.filter(a => a.level === 'warning').length} 预警
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                    {alerts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-slate-500"
                        >
                            <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                            <p>系统运行正常，无告警</p>
                        </motion.div>
                    ) : (
                        alerts.map((alert) => {
                            const Icon = getLevelIcon(alert.level);
                            return (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className={`p-3 rounded-xl border ${getLevelColor(alert.level)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Icon size={18} className="flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm">{alert.title}</div>
                                            <div className="text-xs opacity-80 mt-1">{alert.message}</div>
                                            <div className="text-xs opacity-60 mt-1">
                                                建议措施: {alert.action}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
