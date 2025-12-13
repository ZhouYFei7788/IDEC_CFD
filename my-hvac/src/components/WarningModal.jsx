// src/components/WarningModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, AlertCircle, Info, Lightbulb, Activity, TrendingUp } from 'lucide-react';

/**
 * 告警详情模态框 - 统一的告警展示组件
 */
const WarningModal = ({ warning, onClose }) => {
    if (!warning) return null;

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // 使用levelInfo或回退到默认值
    const color = warning.levelInfo?.color || '#ef4444';
    const levelName = warning.levelInfo?.name || warning.level;
    const icon = warning.levelInfo?.icon || '⚠️';

    // 根据优先级选择图标组件
    const getIconComponent = () => {
        if (warning.level === 'P0' || warning.level === 'P1') {
            return <AlertTriangle size={32} style={{ color }} />;
        } else if (warning.level === 'P2' || warning.level === 'P3') {
            return <AlertCircle size={32} style={{ color }} />;
        } else {
            return <Info size={32} style={{ color }} />;
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackgroundClick}
        >
            <div
                className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border-2 overflow-hidden animate-in zoom-in-95 duration-200"
                style={{ borderColor: color + '80' }}
            >
                {/* 头部 */}
                <div className="relative bg-gradient-to-r from-slate-800 to-slate-900 p-6 border-b border-slate-700">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-slate-800/50 rounded-xl">
                            {getIconComponent()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span
                                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                    style={{
                                        backgroundColor: color + '20',
                                        color: color
                                    }}
                                >
                                    {icon} {levelName}
                                </span>
                                {warning.category && (
                                    <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                                        {warning.category}
                                    </span>
                                )}
                                <span className="text-xs text-slate-500">
                                    {warning.paramName}
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {warning.title}
                            </h2>
                            <p className="text-slate-300 text-sm">
                                {warning.description}
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                                <Activity size={16} className="text-slate-500" />
                                <span className="text-sm text-slate-400">
                                    当前值: <span className="font-mono font-bold" style={{ color }}>
                                        {typeof warning.value === 'number' ? warning.value.toFixed(1) : warning.value}{warning.unit}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 关闭按钮 */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* 内容区域 */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* 影响说明 */}
                    {warning.impact && (
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={18} className="text-red-400" />
                                <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                                    潜在影响
                                </h3>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                {warning.impact}
                            </p>
                        </div>
                    )}

                    {/* 可能原因 */}
                    {warning.causes && warning.causes.length > 0 && (
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle size={18} className="text-orange-400" />
                                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider">
                                    可能原因
                                </h3>
                            </div>
                            <ul className="space-y-2">
                                {warning.causes.map((cause, index) => (
                                    <li key={index} className="flex items-start gap-2 text-slate-300 text-sm">
                                        <span className="text-orange-400 mt-1 flex-shrink-0">•</span>
                                        <span className="leading-relaxed">{cause}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 解决方案 */}
                    {warning.solutions && warning.solutions.length > 0 && (
                        <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 rounded-xl p-4 border border-emerald-700/30">
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb size={18} className="text-emerald-400" />
                                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                                    建议解决方案
                                </h3>
                            </div>
                            <ol className="space-y-3">
                                {warning.solutions.map((solution, index) => (
                                    <li key={index} className="flex items-start gap-3 text-slate-200 text-sm">
                                        <span
                                            className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30"
                                        >
                                            {index + 1}
                                        </span>
                                        <span className="leading-relaxed pt-0.5">{solution}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}
                </div>

                {/* 底部操作栏 */}
                <div className="bg-slate-800/50 p-4 border-t border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                        我知道了
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default WarningModal;
