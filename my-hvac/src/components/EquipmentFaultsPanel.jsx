// src/components/EquipmentFaultsPanel.jsx
import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

/**
 * 设备故障面板组件
 */
const EquipmentFaultsPanel = ({ faults, isPaused, onClearFault, onClearAllFaults, onTogglePause }) => {
    return (
        <div className="space-y-4">
            {/* 控制面板 */}
            <div className="flex justify-between items-center bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-400">
                        当前故障: <span className="text-red-400 font-bold">{faults?.length || 0}</span> 个
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${isPaused
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}>
                        {isPaused ? '⏸ 故障已暂停' : '● 故障运行中'}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onTogglePause}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 ${isPaused
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                            }`}
                    >
                        {isPaused ? '▶ 恢复故障' : '⏸ 暂停故障'}
                    </button>
                    {faults && faults.length > 0 && (
                        <button
                            onClick={onClearAllFaults}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
                        >
                            清除所有故障
                        </button>
                    )}
                </div>
            </div>

            {/* 无故障状态 */}
            {(!faults || faults.length === 0) && (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                    <CheckCircle size={64} className="mb-4 text-green-500" />
                    <p className="text-xl font-medium">设备运行正常</p>
                    <p className="text-sm mt-2">
                        {isPaused ? '故障触发已暂停' : '当前没有设备故障'}
                    </p>
                </div>
            )}

            {/* 故障列表 */}
            {faults && faults.length > 0 && (
                <div className="space-y-3">
                    {faults.map((fault, index) => (
                        <div
                            key={fault.id}
                            className="bg-slate-800/50 rounded-xl p-4 border-l-4 hover:bg-slate-800/70 transition-all"
                            style={{ borderLeftColor: fault.color }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* 故障标题 */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-3xl">{fault.icon}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-lg font-bold"
                                                    style={{ color: fault.color }}
                                                >
                                                    {fault.name}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs rounded ${fault.severity === 'P0' ? 'bg-red-500/20 text-red-400' :
                                                    fault.severity === 'P1' ? 'bg-orange-500/20 text-orange-400' :
                                                        'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    {fault.severity}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400 mt-1">
                                                {fault.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 故障详情 */}
                                    <div className="space-y-2 ml-12">
                                        <div className="bg-slate-900/50 rounded-lg p-3">
                                            <div className="text-xs text-slate-500 mb-1">影响</div>
                                            <div className="text-sm text-red-400">{fault.impact}</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-3">
                                            <div className="text-xs text-slate-500 mb-1">解决方案</div>
                                            <div className="text-sm text-green-400">{fault.solution}</div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>触发时间: {new Date(fault.triggeredAt).toLocaleTimeString('zh-CN')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 消除按钮 */}
                                <button
                                    onClick={() => onClearFault(fault.id)}
                                    className="ml-4 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center gap-2"
                                    title="手动复位故障"
                                >
                                    <CheckCircle size={16} />
                                    <span className="text-sm font-medium">复位</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EquipmentFaultsPanel;
