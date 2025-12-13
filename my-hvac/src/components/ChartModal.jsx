// src/components/ChartModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ParameterChart from './ParameterChart';

const ChartModal = ({ onClose, parameter, label, unit, history, color }) => {
    const handleBackgroundClick = (e) => {
        // Only close if clicking the background, not the modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={handleBackgroundClick}
        >
            <div
                className="relative w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 标题栏 */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <h2 className="text-xl font-bold text-white">
                            {label} 历史曲线
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* 曲线图 */}
                <div className="w-full h-96">
                    <ParameterChart
                        data={history}
                        parameter={parameter}
                        label={label}
                        unit={unit}
                        color={color}
                    />
                </div>

                {/* 统计信息 */}
                <div className="mt-4 grid grid-cols-4 gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="text-center">
                        <div className="text-xs text-slate-500">当前值</div>
                        <div className="text-lg font-bold text-white">
                            {history.length > 0 ? history[history.length - 1][parameter] : '-'} {unit}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500">最大值</div>
                        <div className="text-lg font-bold text-green-400">
                            {history.length > 0 ? Math.max(...history.map(d => d[parameter])).toFixed(1) : '-'} {unit}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500">最小值</div>
                        <div className="text-lg font-bold text-blue-400">
                            {history.length > 0 ? Math.min(...history.map(d => d[parameter])).toFixed(1) : '-'} {unit}
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="text-xs text-slate-500">平均值</div>
                        <div className="text-lg font-bold text-purple-400">
                            {history.length > 0 ? (history.reduce((sum, d) => sum + d[parameter], 0) / history.length).toFixed(1) : '-'} {unit}
                        </div>
                    </div>
                </div>

                <div className="mt-3 text-xs text-slate-500 text-center">
                    数据点: {history.length} | 时间范围: {history.length > 0 ? `${history[0].time} - ${history[history.length - 1].time}` : '-'}
                </div>
            </div>
        </div>
    );

    // 使用 Portal 渲染到 body，避免父组件重新渲染影响
    return createPortal(modalContent, document.body);
};

export default ChartModal;
