// src/components/ExpandableParameter.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils';
import ParameterChart from './ParameterChart';

const ExpandableParameter = ({
    label,
    value,
    unit,
    sublabel,
    parameter,  // parameter key in history data
    history,    // history data array
    color = '#3b82f6'
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="text-center">
            <div
                className="cursor-pointer transition-all hover:bg-slate-700/30 rounded p-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-center gap-1">
                    <div className="text-[10px] text-slate-500">{label}</div>
                    {isExpanded ?
                        <ChevronUp size={12} className="text-slate-500" /> :
                        <ChevronDown size={12} className="text-slate-500" />
                    }
                </div>
                <div className={cn("text-xl font-bold font-mono", `text-${color}`)} style={{ color }}>
                    {value} {unit}
                </div>
                {sublabel && (
                    <div className="text-[9px] text-slate-600 mt-1">{sublabel}</div>
                )}
            </div>

            {/* 展开的曲线图 */}
            {isExpanded && (
                <div className="mt-2 mb-2 animate-in slide-in-from-top-2 duration-200">
                    <ParameterChart
                        data={history}
                        parameter={parameter}
                        label={label}
                        unit={unit}
                        color={color}
                    />
                </div>
            )}
        </div>
    );
};

export default ExpandableParameter;
