// src/components/ClickableParameter.jsx
import React from 'react';
import { TrendingUp, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { getAlertColor } from '../config/alertRules';

const ClickableParameter = ({
    label,
    value,
    unit,
    sublabel,
    parameter,
    color = '#3b82f6',
    openModal,
    warning = null,  // 警告对象
    onWarningClick = null  // 警告点击回调
}) => {
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        // 调用App层级的openModal函数
        openModal(parameter, label, unit, color);
    };

    const handleWarningClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (onWarningClick && warning) {
            onWarningClick(warning);
        }
    };

    // 根据警告级别选择图标
    const getWarningIcon = () => {
        if (!warning) return null;

        switch (warning.level) {
            case 'P0':
            case 'P1':
                return <AlertTriangle size={14} />;
            case 'P2':
            case 'P3':
                return <AlertCircle size={14} />;
            case 'P4':
                return <Info size={14} />;
            default:
                return null;
        }
    };

    return (
        <div
            className="text-center cursor-pointer transition-all hover:bg-slate-700/50 rounded-lg p-2 group relative"
            onClick={handleClick}
        >
            <div className="flex items-center justify-center gap-1 mb-1">
                <div className="text-[10px] text-slate-500">{label}</div>
                <TrendingUp size={10} className="text-slate-600 group-hover:text-slate-400 transition-colors" />

                {/* 警告图标 */}
                {warning && (
                    <button
                        onClick={handleWarningClick}
                        className="ml-1 p-0.5 rounded hover:bg-slate-600/50 transition-all animate-pulse hover:animate-none"
                        style={{ color: getAlertColor(warning.level) }}
                        title={warning.title}
                    >
                        {getWarningIcon()}
                    </button>
                )}
            </div>
            <div
                className="text-xl font-bold font-mono group-hover:scale-105 transition-transform"
                style={{ color: warning ? getAlertColor(warning.level) : color }}
            >
                {value}{unit}
            </div>
            {sublabel && (
                <div className="text-[9px] text-slate-600 mt-1">{sublabel}</div>
            )}

            {/* 警告指示器 */}
            {warning && (
                <div
                    className="absolute top-0 right-0 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: getAlertColor(warning.level) }}
                />
            )}
        </div>
    );
};

export default ClickableParameter;
