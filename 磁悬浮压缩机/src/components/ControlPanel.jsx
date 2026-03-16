import React from 'react';
import { Thermometer, Zap } from 'lucide-react';

/**
 * W3000TE 控制面板 - 简洁版
 */
export default function ControlPanel({ params, setParams, stats }) {
    const {
        ambientTemp = 35,
        waterInletTemp = 12,
        waterOutletSetpoint = 7,
        loadPercent = 100,
        mode = 'auto'
    } = params;

    const updateParam = (key, value) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* 室外温度 */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer size={14} className="text-red-400" />
                        <span className="text-xs text-slate-400">室外温度</span>
                        <span className="ml-auto text-sm font-bold text-red-400">{ambientTemp}°C</span>
                    </div>
                    <input
                        type="range"
                        min="-10"
                        max="50"
                        step="1"
                        value={ambientTemp}
                        onChange={(e) => updateParam('ambientTemp', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-red-500"
                    />
                </div>

                {/* 出水温度设定 */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer size={14} className="text-cyan-400" />
                        <span className="text-xs text-slate-400">出水设定</span>
                        <span className="ml-auto text-sm font-bold text-cyan-400">{waterOutletSetpoint}°C</span>
                    </div>
                    <input
                        type="range"
                        min="5"
                        max="15"
                        step="0.5"
                        value={waterOutletSetpoint}
                        onChange={(e) => updateParam('waterOutletSetpoint', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                    />
                    <div className="text-xs text-slate-500 mt-1 text-center">
                        实际: {stats?.waterOutTemp ?? '--'}°C
                    </div>
                </div>

                {/* 回水温度 */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Thermometer size={14} className="text-orange-400" />
                        <span className="text-xs text-slate-400">回水温度</span>
                        <span className="ml-auto text-sm font-bold text-orange-400">{waterInletTemp}°C</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="18"
                        step="0.5"
                        value={waterInletTemp}
                        onChange={(e) => updateParam('waterInletTemp', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                </div>

                {/* 负荷调节 */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-yellow-400" />
                        <span className="text-xs text-slate-400">负荷</span>
                        <span className="ml-auto text-sm font-bold text-yellow-400">{loadPercent}%</span>
                    </div>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={loadPercent}
                        onChange={(e) => updateParam('loadPercent', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-yellow-500"
                    />
                </div>
            </div>

            {/* 快捷工况按钮 */}
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-center gap-2">
                <span className="text-xs text-slate-500">快捷工况:</span>
                <button
                    onClick={() => setParams({
                        ambientTemp: 35, waterInletTemp: 12, waterOutletSetpoint: 7, loadPercent: 100, mode: 'auto'
                    })}
                    className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400 hover:bg-slate-700"
                >
                    额定
                </button>
                <button
                    onClick={() => setParams({
                        ambientTemp: 22, waterInletTemp: 12, waterOutletSetpoint: 7, loadPercent: 50, mode: 'auto'
                    })}
                    className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400 hover:bg-slate-700"
                >
                    50%负荷
                </button>
                <button
                    onClick={() => setParams({
                        ambientTemp: 15, waterInletTemp: 12, waterOutletSetpoint: 7, loadPercent: 20, mode: 'auto'
                    })}
                    className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400 hover:bg-slate-700"
                >
                    低负荷
                </button>
            </div>
        </div>
    );
}
