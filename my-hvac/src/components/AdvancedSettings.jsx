// src/components/AdvancedSettings.jsx
import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils';

const AdvancedSettings = ({ specs, onSpecsChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const updateSpec = (category, subcategory, key, value) => {
        const newSpecs = { ...specs };
        if (subcategory) {
            newSpecs[category][subcategory][key] = Number(value);
        } else {
            newSpecs[category][key] = Number(value);
        }
        onSpecsChange(newSpecs);
    };

    return (
        <div className="fixed top-4 left-4 z-50">
            {/* 折叠按钮 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    "bg-slate-900 border border-slate-700 hover:border-slate-600",
                    "text-slate-300 hover:text-white shadow-lg"
                )}
            >
                <Settings size={16} className={cn("transition-transform", isOpen && "rotate-90")} />
                <span className="text-xs font-medium">高级参数</span>
                {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {/* 参数面板 */}
            {isOpen && (
                <div className="mt-2 w-96 max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-2xl">
                    <div className="p-4 space-y-4">
                        {/* A. 物理环境常数 */}
                        <div className="space-y-2">
                            <div className="text-sm font-bold text-cyan-400 border-b border-slate-700 pb-1">
                                A. 物理环境常数
                            </div>

                            <ParamInput
                                label="空气密度"
                                value={specs.AIR.DENSITY}
                                onChange={(v) => updateSpec('AIR', null, 'DENSITY', v)}
                                unit="kg/m³"
                                min={0.8}
                                max={1.5}
                                step={0.01}
                            />

                            <ParamInput
                                label="空气比热容"
                                value={specs.AIR.CP}
                                onChange={(v) => updateSpec('AIR', null, 'CP', v)}
                                unit="J/kg·℃"
                                min={900}
                                max={1100}
                                step={1}
                            />

                            <ParamInput
                                label="海拔修正系数"
                                value={specs.AIR.ALTITUDE_CORRECTION}
                                onChange={(v) => updateSpec('AIR', null, 'ALTITUDE_CORRECTION', v)}
                                unit=""
                                min={0.5}
                                max={1.5}
                                step={0.05}
                            />
                        </div>

                        {/* B. IEC 核心特性 */}
                        <div className="space-y-2">
                            <div className="text-sm font-bold text-purple-400 border-b border-slate-700 pb-1">
                                B. IEC 间接蒸发冷却
                            </div>

                            <ParamInput
                                label="最大设计风量"
                                value={specs.IEC.MAX_AIRFLOW}
                                onChange={(v) => updateSpec('IEC', null, 'MAX_AIRFLOW', v)}
                                unit="m³/h"
                                min={5000}
                                max={30000}
                                step={500}
                            />

                            <ParamInput
                                label="风机额定功率"
                                value={specs.IEC.FAN_RATED_POWER}
                                onChange={(v) => updateSpec('IEC', null, 'FAN_RATED_POWER', v)}
                                unit="kW"
                                min={1}
                                max={10}
                                step={0.1}
                            />

                            {/* 干模式 */}
                            <div className="ml-2 space-y-1 border-l-2 border-slate-700 pl-2">
                                <div className="text-xs text-slate-500">干模式</div>
                                <ParamInput
                                    label="基础效率"
                                    value={specs.IEC.DRY_MODE.BASE_EFF}
                                    onChange={(v) => updateSpec('IEC', 'DRY_MODE', 'BASE_EFF', v)}
                                    unit=""
                                    min={0.5}
                                    max={0.95}
                                    step={0.01}
                                    small
                                />
                                <ParamInput
                                    label="效率衰减"
                                    value={specs.IEC.DRY_MODE.DEGRADATION}
                                    onChange={(v) => updateSpec('IEC', 'DRY_MODE', 'DEGRADATION', v)}
                                    unit=""
                                    min={0}
                                    max={0.3}
                                    step={0.01}
                                    small
                                />
                            </div>

                            {/* 湿模式 */}
                            <div className="ml-2 space-y-1 border-l-2 border-slate-700 pl-2">
                                <div className="text-xs text-slate-500">湿模式</div>
                                <ParamInput
                                    label="基础效率"
                                    value={specs.IEC.WET_MODE.BASE_EFF}
                                    onChange={(v) => updateSpec('IEC', 'WET_MODE', 'BASE_EFF', v)}
                                    unit=""
                                    min={0.7}
                                    max={1.0}
                                    step={0.01}
                                    small
                                />
                                <ParamInput
                                    label="效率衰减"
                                    value={specs.IEC.WET_MODE.DEGRADATION}
                                    onChange={(v) => updateSpec('IEC', 'WET_MODE', 'DEGRADATION', v)}
                                    unit=""
                                    min={0}
                                    max={0.2}
                                    step={0.01}
                                    small
                                />
                            </div>

                            <ParamInput
                                label="喷淋耗水系数"
                                value={specs.IEC.SPRAY_WATER_CONS}
                                onChange={(v) => updateSpec('IEC', null, 'SPRAY_WATER_CONS', v)}
                                unit="L/h/kW"
                                min={0.1}
                                max={2}
                                step={0.1}
                            />
                        </div>

                        {/* C. DX 核心特性 */}
                        <div className="space-y-2">
                            <div className="text-sm font-bold text-red-400 border-b border-slate-700 pb-1">
                                C. DX 机械制冷
                            </div>

                            <ParamInput
                                label="额定制冷量"
                                value={specs.DX.RATED_CAPACITY}
                                onChange={(v) => updateSpec('DX', null, 'RATED_CAPACITY', v)}
                                unit="W"
                                min={20000}
                                max={150000}
                                step={1000}
                            />

                            <ParamInput
                                label="性能系数 COP"
                                value={specs.DX.RATED_COP}
                                onChange={(v) => updateSpec('DX', null, 'RATED_COP', v)}
                                unit=""
                                min={2.0}
                                max={5.0}
                                step={0.1}
                            />

                            <ParamInput
                                label="最小运行频率"
                                value={specs.DX.MIN_FREQ}
                                onChange={(v) => updateSpec('DX', null, 'MIN_FREQ', v)}
                                unit="Hz"
                                min={20}
                                max={50}
                                step={5}
                            />

                            <ParamInput
                                label="最大运行频率"
                                value={specs.DX.MAX_FREQ}
                                onChange={(v) => updateSpec('DX', null, 'MAX_FREQ', v)}
                                unit="Hz"
                                min={60}
                                max={120}
                                step={5}
                            />
                        </div>

                        {/* D. 热惯性参数 */}
                        <div className="space-y-2">
                            <div className="text-sm font-bold text-yellow-400 border-b border-slate-700 pb-1">
                                D. 机房热惯性
                            </div>

                            <ParamInput
                                label="机房热容量"
                                value={specs.THERMAL.MASS}
                                onChange={(v) => updateSpec('THERMAL', null, 'MASS', v)}
                                unit="J/K"
                                min={50000}
                                max={500000}
                                step={10000}
                            />
                        </div>

                        {/* 重置按钮 */}
                        <button
                            onClick={() => {
                                if (confirm('确定要重置所有参数到默认值吗？')) {
                                    // 这里需要传入默认值
                                    console.log('重置参数');
                                }
                            }}
                            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs transition-colors"
                        >
                            重置为默认值
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 参数输入组件
const ParamInput = ({ label, value, onChange, unit, min, max, step, small = false }) => {
    return (
        <div className={cn("flex items-center gap-2", small ? "text-xs" : "text-sm")}>
            <label className="flex-1 text-slate-400">{label}</label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                min={min}
                max={max}
                step={step}
                className={cn(
                    "bg-slate-800 border border-slate-700 rounded px-2 text-white",
                    "focus:outline-none focus:border-cyan-500 transition-colors",
                    small ? "w-16 py-0.5 text-xs" : "w-20 py-1 text-sm"
                )}
            />
            {unit && <span className="text-xs text-slate-500 w-16">{unit}</span>}
        </div>
    );
};

export default AdvancedSettings;
