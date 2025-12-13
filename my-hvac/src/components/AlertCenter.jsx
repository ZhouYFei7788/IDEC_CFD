// src/components/AlertCenter.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, TrendingUp, Clock, CheckCircle, BarChart3, Activity, Wrench, Trophy } from 'lucide-react';
import { ALERT_LEVELS, getAlertColor, getAlertBgColor, getAlertIcon } from '../config/alertRules';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EquipmentFaultsPanel from './EquipmentFaultsPanel';

/**
 * 告警监控中心 - 完整的告警管理界面
 */
const AlertCenter = ({ alerts, alertHistory, statistics, stats, params, mode, faults, faultsPaused, copAnalysis, onClearFault, onClearAllFaults, onToggleFaultPause, onClose, onAlertClick }) => {
    const [activeTab, setActiveTab] = useState('current'); // current, history, statistics

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // 格式化时间
    const formatTime = (timestamp) => {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // 格式化持续时间
    const formatDuration = (ms) => {
        if (!ms) return '-';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}小时${minutes % 60} 分`;
        if (minutes > 0) return `${minutes}分${seconds % 60} 秒`;
        return `${seconds} 秒`;
    };

    // 当前告警列表
    const alertArray = Object.values(alerts).sort((a, b) =>
        a.levelInfo.priority - b.levelInfo.priority
    );

    // 准备图表数据
    const levelChartData = Object.keys(ALERT_LEVELS).map(level => ({
        name: ALERT_LEVELS[level].name,
        count: statistics.byLevel[level] || 0,
        color: ALERT_LEVELS[level].color
    }));

    const categoryChartData = Object.entries(statistics.byCategory).map(([category, count]) => ({
        name: category,
        count
    }));

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackgroundClick}
        >
            <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-700 overflow-hidden flex flex-col">
                {/* 头部 */}
                <div className="relative bg-gradient-to-r from-red-900/20 via-slate-800 to-slate-900 p-4 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/20 rounded-xl">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">告警监控中心</h2>
                                <p className="text-slate-400 text-sm mt-1">
                                    Alert Monitoring Center - Real-time System Health
                                </p>
                            </div>
                        </div>

                        {/* 统计概览 */}
                        <div className="flex items-center gap-3">
                            <div className="text-center px-3 py-2 bg-red-500/10 rounded-lg border border-red-500/30">
                                <div className="text-2xl font-bold text-red-400">{statistics.total}</div>
                                <div className="text-xs text-slate-400">当前告警</div>
                            </div>
                            <div className="text-center px-3 py-2 bg-orange-500/10 rounded-lg border border-orange-500/30">
                                <div className="text-xl font-bold text-orange-400">{statistics.byLevel.P0 + statistics.byLevel.P1}</div>
                                <div className="text-xs text-slate-400">高优先级</div>
                            </div>
                            <div className="text-center px-3 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                                <div className="text-xl font-bold text-green-400">{statistics.history.cleared}</div>
                                <div className="text-xs text-slate-400">已清除</div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    {/* 标签页 */}
                    <div className="flex gap-2 mt-3">
                        {[
                            { id: 'current', label: '当前告警', icon: Activity },
                            { id: 'faults', label: '设备故障', icon: Wrench },
                            { id: 'history', label: '历史记录', icon: Clock },
                            { id: 'statistics', label: '系统监控', icon: BarChart3 },
                            { id: 'copAnalysis', label: '能耗分析', icon: Trophy }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm ${activeTab === tab.id
                                    ? 'bg-slate-700 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    } `}
                            >
                                <tab.icon size={14} />
                                <span className="font-medium">{tab.label}</span>
                                {tab.id === 'current' && statistics.total > 0 && (
                                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                        {statistics.total}
                                    </span>
                                )}
                                {tab.id === 'faults' && faults && faults.length > 0 && (
                                    <span className="px-1.5 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                                        {faults.length}
                                    </span>
                                )}
                                {tab.id === 'copAnalysis' && copAnalysis?.isRecording && (
                                    <span className="px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full animate-pulse">
                                        记录中
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* 当前告警 */}
                    {activeTab === 'current' && (
                        <div className="space-y-4">
                            {alertArray.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <CheckCircle size={64} className="mb-4 text-green-500" />
                                    <p className="text-xl font-medium">系统运行正常</p>
                                    <p className="text-sm mt-2">当前没有活跃告警</p>
                                </div>
                            ) : (
                                <>
                                    {/* 按优先级分组显示 */}
                                    {Object.keys(ALERT_LEVELS).map(level => {
                                        const levelAlerts = alertArray.filter(a => a.level === level);
                                        if (levelAlerts.length === 0) return null;

                                        return (
                                            <div key={level} className="space-y-2">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div
                                                        className="px-3 py-1 rounded-lg text-sm font-bold"
                                                        style={{
                                                            backgroundColor: getAlertBgColor(level),
                                                            color: getAlertColor(level)
                                                        }}
                                                    >
                                                        {getAlertIcon(level)} {ALERT_LEVELS[level].name}
                                                    </div>
                                                    <span className="text-slate-500 text-sm">
                                                        {levelAlerts.length} 个告警
                                                    </span>
                                                </div>

                                                {levelAlerts.map((alert, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-slate-800/50 rounded-xl p-4 border-l-4 hover:bg-slate-800/70 transition-all cursor-pointer"
                                                        style={{ borderLeftColor: getAlertColor(alert.level) }}
                                                        onClick={() => onAlertClick && onAlertClick(alert)}
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span
                                                                        className="text-lg font-bold"
                                                                        style={{ color: getAlertColor(alert.level) }}
                                                                    >
                                                                        {alert.title}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                                                                        {alert.category}
                                                                    </span>
                                                                </div>
                                                                <p className="text-slate-300 text-sm mb-2">
                                                                    {alert.description}
                                                                </p>
                                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                                    <span>参数: {alert.paramName}</span>
                                                                    <span>当前值: <span className="font-mono font-bold" style={{ color: getAlertColor(alert.level) }}>
                                                                        {typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}{alert.unit}
                                                                    </span></span>
                                                                    <span>触发时间: {formatTime(alert.timestamp)}</span>
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded transition-colors"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAlertClick && onAlertClick(alert);
                                                                }}
                                                            >
                                                                查看详情
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    )}

                    {/* 历史记录 */}
                    {activeTab === 'history' && (
                        <div className="space-y-2">
                            {alertHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                                    <Clock size={64} className="mb-4" />
                                    <p className="text-xl font-medium">暂无历史记录</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {[...alertHistory].reverse().map((alert, index) => (
                                        <div
                                            key={index}
                                            className={`bg - slate - 800 / 30 rounded - lg p - 4 border - l - 4 ${alert.status === 'cleared' ? 'opacity-60' : ''
                                                } `}
                                            style={{ borderLeftColor: getAlertColor(alert.level) }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className="font-bold"
                                                            style={{ color: getAlertColor(alert.level) }}
                                                        >
                                                            {getAlertIcon(alert.level)} {alert.title}
                                                        </span>
                                                        <span className={`px - 2 py - 0.5 text - xs rounded ${alert.status === 'active'
                                                            ? 'bg-red-500/20 text-red-400'
                                                            : 'bg-green-500/20 text-green-400'
                                                            } `}>
                                                            {alert.status === 'active' ? '活跃' : '已清除'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                                        <span>{alert.paramName}: {typeof alert.value === 'number' ? alert.value.toFixed(1) : alert.value}{alert.unit}</span>
                                                        <span>触发: {formatTime(alert.triggeredAt)}</span>
                                                        {alert.clearedAt && (
                                                            <>
                                                                <span>清除: {formatTime(alert.clearedAt)}</span>
                                                                <span>持续: {formatDuration(alert.duration)}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 设备故障 */}
                    {activeTab === 'faults' && (
                        <EquipmentFaultsPanel
                            faults={faults}
                            isPaused={faultsPaused}
                            onClearFault={onClearFault}
                            onClearAllFaults={onClearAllFaults}
                            onTogglePause={onToggleFaultPause}
                        />
                    )}

                    {/* 系统监控 */}
                    {activeTab === 'statistics' && stats && (
                        <div className="space-y-4">
                            {/* 告警级别统计 */}
                            <div className="grid grid-cols-5 gap-3">
                                {Object.entries(ALERT_LEVELS).map(([level, info]) => (
                                    <div
                                        key={level}
                                        className="bg-slate-800/50 rounded-lg p-3 border-2"
                                        style={{ borderColor: info.color + '40' }}
                                    >
                                        <div className="text-center">
                                            <div className="text-2xl mb-1">{info.icon}</div>
                                            <div className="text-xl font-bold" style={{ color: info.color }}>
                                                {statistics.byLevel[level] || 0}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">{info.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 系统运行数据 */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* 左侧：功率和制冷 */}
                                <div className="space-y-4">
                                    {/* 功率输出 */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                            <Activity size={20} className="text-blue-400" />
                                            功率输出
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">总功耗</div>
                                                <div className="text-2xl font-bold text-red-400">
                                                    {stats.power_kw?.toFixed(1) || '0.0'} kW
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">风机功耗</div>
                                                <div className="text-xl font-bold text-orange-400">
                                                    {((stats.power_kw || 0) - (stats.compPower || 0) / 1000).toFixed(1)} kW
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">压缩机功耗</div>
                                                <div className="text-xl font-bold text-yellow-400">
                                                    {((stats.compPower || 0) / 1000).toFixed(1)} kW
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">系统COP</div>
                                                <div className="text-xl font-bold text-green-400">
                                                    {stats.cop?.toFixed(2) || '0.00'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 制冷输出 */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                            <TrendingUp size={20} className="text-cyan-400" />
                                            制冷输出
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">总制冷量</div>
                                                <div className="text-2xl font-bold text-cyan-400">
                                                    {stats.capacity_kw?.toFixed(1) || '0.0'} kW
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">IEC制冷</div>
                                                <div className="text-xl font-bold text-blue-400">
                                                    {stats.Q_iec_kw?.toFixed(1) || '0.0'} kW
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">DX制冷</div>
                                                <div className="text-xl font-bold text-purple-400">
                                                    {stats.Q_dx_kw?.toFixed(1) || '0.0'} kW
                                                </div>
                                            </div>
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="text-xs text-slate-400 mb-1">制冷需求(CFC)</div>
                                                <div className="text-xl font-bold text-indigo-400">
                                                    {stats.cfc?.toFixed(0) || '0'}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 右侧：温度和运行状态 */}
                                <div className="space-y-4">
                                    {/* 温度监控 */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                        <h3 className="text-lg font-bold text-white mb-3">温度监控</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">送风温度(SA)</span>
                                                <span className="text-lg font-bold text-cyan-400">
                                                    {stats.saTemp?.toFixed(1) || '0.0'}°C
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">回风温度(RA)</span>
                                                <span className="text-lg font-bold text-orange-400">
                                                    {stats.raTemp?.toFixed(1) || '0.0'}°C
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">冷通道温度</span>
                                                <span className="text-lg font-bold text-green-400">
                                                    {stats.roomTemp?.toFixed(1) || '0.0'}°C
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">室外温度(OA)</span>
                                                <span className="text-lg font-bold text-yellow-400">
                                                    {params?.oaTemp?.toFixed(1) || '0.0'}°C
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 运行状态 */}
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                        <h3 className="text-lg font-bold text-white mb-3">运行状态</h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">运行模式</span>
                                                <span className="text-sm font-bold text-blue-400">
                                                    {mode === 'auto' ? '🤖自动' : mode === 'dry' ? '干模式' : mode === 'wet' ? '湿模式' : mode === 'hybrid' ? '混合模式' : 'DX模式'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">风机转速</span>
                                                <span className="text-sm font-bold text-cyan-400">
                                                    {stats.fanSpeed_actual?.toFixed(0) || '0'}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">压缩机频率</span>
                                                <span className="text-sm font-bold text-purple-400">
                                                    {stats.compHz?.toFixed(0) || '0'} Hz
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-900/50 rounded-lg p-2">
                                                <span className="text-sm text-slate-400">机房负载</span>
                                                <span className="text-sm font-bold text-red-400">
                                                    {((params?.qLoad || 0) / 1000).toFixed(1)} kW
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 告警级别分布图表 */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-3">告警级别分布</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={levelChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                        <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e293b',
                                                border: '1px solid #475569',
                                                borderRadius: '8px'
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                            {levelChartData.map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* 历史统计 */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-3">告警历史统计</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-3xl font-bold text-blue-400">{statistics.history.total}</div>
                                        <div className="text-xs text-slate-400 mt-1">总告警次数</div>
                                    </div>
                                    <div className="text-center bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-3xl font-bold text-red-400">{statistics.history.active}</div>
                                        <div className="text-xs text-slate-400 mt-1">当前活跃</div>
                                    </div>
                                    <div className="text-center bg-slate-900/50 rounded-lg p-3">
                                        <div className="text-3xl font-bold text-green-400">{statistics.history.cleared}</div>
                                        <div className="text-xs text-slate-400 mt-1">已清除</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COP分析标签页 */}
                    {activeTab === 'copAnalysis' && copAnalysis && (
                        <div className="space-y-4">
                            {/* 控制面板 */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Trophy size={20} className="text-yellow-400" />
                                            COP/PUE效率分析
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${copAnalysis.isRecording
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-slate-700 text-slate-400'
                                            }`}>
                                            {copAnalysis.isRecording ? '● 记录中' : '○ 已暂停'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!copAnalysis.isRecording ? (
                                            <button
                                                onClick={copAnalysis.startRecording}
                                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                                            >
                                                ▶ 开始分析
                                            </button>
                                        ) : (
                                            <button
                                                onClick={copAnalysis.pauseRecording}
                                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                                            >
                                                ⏸ 暂停分析
                                            </button>
                                        )}
                                        <button
                                            onClick={copAnalysis.clearStats}
                                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
                                        >
                                            清除数据
                                        </button>
                                    </div>
                                </div>

                                {/* 当前状态 */}
                                <div className="mt-4 grid grid-cols-4 gap-4">
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">当前送风设定</div>
                                        <div className="text-2xl font-bold text-cyan-400">{params?.saSet || 25}°C</div>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">当前COP</div>
                                        <div className="text-2xl font-bold text-green-400">{stats?.cop?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">平均COP</div>
                                        <div className="text-2xl font-bold text-yellow-400">{copAnalysis.overallAvgCop?.toFixed(2) || '0.00'}</div>
                                    </div>
                                    <div className="bg-slate-900/50 rounded-lg p-3 text-center">
                                        <div className="text-xs text-slate-400 mb-1">平均PUE</div>
                                        <div className="text-2xl font-bold text-purple-400">{copAnalysis.overallAvgPue?.toFixed(3) || '1.000'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 报表数据 */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                <h3 className="text-lg font-bold text-white mb-4">📊 送风温度效率排行</h3>

                                {copAnalysis.getRanking().length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">
                                        <Trophy size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg">暂无数据</p>
                                        <p className="text-sm mt-2">点击"开始分析"按钮开始记录</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                                                    <th className="pb-3 px-2">排名</th>
                                                    <th className="pb-3 px-2">送风设定</th>
                                                    <th className="pb-3 px-2">运行时间</th>
                                                    <th className="pb-3 px-2">平均COP</th>
                                                    <th className="pb-3 px-2">COP范围</th>
                                                    <th className="pb-3 px-2">平均PUE</th>
                                                    <th className="pb-3 px-2">PUE范围</th>
                                                    <th className="pb-3 px-2">采样数</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {copAnalysis.getRanking().map((item, index) => (
                                                    <tr
                                                        key={item.temp}
                                                        className={`border-b border-slate-700/50 ${index === 0 ? 'bg-yellow-500/5' :
                                                            index === 1 ? 'bg-slate-400/5' :
                                                                index === 2 ? 'bg-orange-500/5' : ''
                                                            }`}
                                                    >
                                                        <td className="py-3 px-2">
                                                            <span className={`text-xl ${index === 0 ? 'text-yellow-400' :
                                                                index === 1 ? 'text-slate-300' :
                                                                    index === 2 ? 'text-orange-500' :
                                                                        'text-slate-500'
                                                                }`}>
                                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <span className="font-bold text-white">{item.temp}°C</span>
                                                        </td>
                                                        <td className="py-3 px-2 text-slate-300">
                                                            {copAnalysis.formatRunTime(item.runTime)}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <span className={`font-bold ${index === 0 ? 'text-yellow-400' : 'text-green-400'
                                                                }`}>
                                                                {item.avgCop.toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-slate-400 text-sm">
                                                            {item.minCop.toFixed(2)} ~ {item.maxCop.toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-2">
                                                            <span className="font-bold text-purple-400">
                                                                {item.avgPue.toFixed(3)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-2 text-slate-400 text-sm">
                                                            {item.minPue.toFixed(3)} ~ {item.maxPue.toFixed(3)}
                                                        </td>
                                                        <td className="py-3 px-2 text-slate-400">
                                                            {item.count}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* 说明 */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-400 mb-2">📝 使用说明</h4>
                                <ul className="text-sm text-slate-500 space-y-1">
                                    <li>• 点击"开始分析"开始记录当前送风温度设定点的COP和PUE</li>
                                    <li>• 调整送风温度设定值，系统会自动为每个设定点创建独立记录</li>
                                    <li>• 多次切换送风温度后，可以比较不同设定点的效率</li>
                                    <li>• COP (制冷系数) = 制冷量 / 总功耗，越高越好</li>
                                    <li>• PUE (能效比) = 1 + 制冷功耗/IT负载，越接近1越好</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AlertCenter;
