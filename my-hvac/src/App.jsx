// src/App.jsx
import React, { useState } from 'react';
import { Settings, Activity, Wind, Droplets, Zap, Snowflake, Gauge, ArrowDown, ArrowUp, Bell } from 'lucide-react';
import { useHvacPhysics } from './hooks/useHvacPhysics';
import { useHistoryData } from './hooks/useHistoryData';
import { useAlerts } from './hooks/useAlerts';
import { useEquipmentFaults } from './hooks/useEquipmentFaults';
import { useCopAnalysis } from './hooks/useCopAnalysis';
import { cn, getAirColor } from './utils';

import HvacDiagram from './components/HvacDiagram';
import EfficiencyPanel from './components/EfficiencyPanel';
import AdvancedSettings from './components/AdvancedSettings';
import ChartModal from './components/ChartModal';
import WarningModal from './components/WarningModal';
import AlertCenter from './components/AlertCenter';

export default function UltimateIECDxDemo() {
    const [params, setParams] = useState({
        oaTemp: 35,
        oaRh: 45,
        saSet: 25, // 送风温度设定值
        fanSpeed: 80,
        qLoad: 50000, // 机房热负载 (W) - 默认50kW
    });

    const [mode, setMode] = useState('dry');

    // 系统规格参数（可通过高级设置编辑）
    const [systemSpecs, setSystemSpecs] = useState({
        AIR: {
            DENSITY: 1.2,
            CP: 1005,
            ALTITUDE_CORRECTION: 1.0
        },
        IEC: {
            MAX_AIRFLOW: 15000,
            FAN_RATED_POWER: 3.5,
            DRY_MODE: {
                BASE_EFF: 0.75,
                DEGRADATION: 0.15
            },
            WET_MODE: {
                BASE_EFF: 0.95,
                DEGRADATION: 0.10
            },
            SPRAY_WATER_CONS: 0.5
        },
        DX: {
            RATED_CAPACITY: 60000,
            RATED_COP: 3.2,
            MIN_FREQ: 30,
            MAX_FREQ: 90
        },
        THERMAL: {
            MASS: 100000  // 机房热容量 (J/K) - 降低以加快响应
        }
    });

    // Equipment faults system
    const { activeFaults, isPaused: faultsPaused, clearFault, clearAllFaults, togglePause: toggleFaultPause, getFaultEffects } = useEquipmentFaults();
    const faultEffects = getFaultEffects();

    // Use custom hook for physics calculations
    const stats = useHvacPhysics(params, mode, systemSpecs, faultEffects);

    // Track parameter history for charts
    const history = useHistoryData(stats, 300);

    // Use alerts system with history tracking
    const { currentAlerts, alertHistory, statistics } = useAlerts(stats, params);

    // COP analysis
    const copAnalysis = useCopAnalysis(stats, params);

    // Modal state - 在App层级管理，不受stats更新影响
    const [modalData, setModalData] = useState(null);
    const [warningModal, setWarningModal] = useState(null);
    const [showAlertCenter, setShowAlertCenter] = useState(false);

    const openModal = (parameter, label, unit, color) => {
        setModalData({ parameter, label, unit, color });
    };

    const closeModal = () => {
        setModalData(null);
    };

    const openWarningModal = (warning) => {
        setWarningModal(warning);
    };

    const closeWarningModal = () => {
        setWarningModal(null);
    };

    const toggleAlertCenter = () => {
        setShowAlertCenter(!showAlertCenter);
    };

    return (
        <div className="w-full h-screen bg-slate-950 text-slate-200 font-sans p-6 flex flex-col items-center overflow-auto">
            {/* 高级参数设置面板 */}
            <AdvancedSettings specs={systemSpecs} onSpecsChange={setSystemSpecs} />

            {/* 告警中心按钮 */}
            <button
                onClick={toggleAlertCenter}
                className="fixed top-4 right-4 z-40 p-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl shadow-2xl transition-all hover:scale-105 group"
                title="打开告警监控中心"
            >
                <div className="flex items-center gap-2">
                    <Bell size={24} className="text-white" />
                    {statistics.total > 0 && (
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold animate-pulse border-2 border-slate-950">
                            {statistics.total}
                        </div>
                    )}
                </div>
            </button>

            {/* Header / Mode Switcher */}
            <div className="w-full max-w-6xl mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
                    {['auto', 'dry', 'wet', 'hybrid', 'dx'].map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={cn(
                                'flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded transition-all',
                                mode === m ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                            )}
                        >
                            {m === 'auto' ? '🤖自动' : m === 'hybrid' ? '混合模式' : m === 'dx' ? '强冷DX' : m === 'wet' ? '湿模式' : '干模式'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
                    <div className="text-xs text-slate-500">OA Temp</div>
                    <input
                        type="range"
                        min="-30"
                        max="50"
                        step="1"
                        value={params.oaTemp}
                        onChange={(e) => setParams({ ...params, oaTemp: Number(e.target.value) })}
                        className="w-24 h-1 bg-slate-700 rounded-full appearance-none accent-red-500"
                    />
                    <div className="text-xs text-red-400 font-mono w-10">
                        {stats.oaTemp ? stats.oaTemp.toFixed(1) : params.oaTemp}℃
                    </div>
                    <div className="h-4 w-[1px] bg-slate-700 mx-2"></div>
                    <div className="text-xs text-slate-500">RH</div>
                    <input
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={params.oaRh}
                        onChange={(e) => setParams({ ...params, oaRh: Number(e.target.value) })}
                        className="w-24 h-1 bg-slate-700 rounded-full appearance-none accent-blue-500"
                    />
                    <div className="text-xs text-blue-400 font-mono w-8">{params.oaRh}%</div>
                </div>
            </div>

            {/* New Control Panel: Supply Air Setpoint & Heat Load */}
            <div className="w-full max-w-6xl mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supply Air Temperature Setpoint */}
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
                    <Snowflake size={16} className="text-cyan-400" />
                    <div className="text-xs text-slate-500 min-w-24">送风温度设定</div>
                    <input
                        type="range"
                        min="16"
                        max="30"
                        step="0.5"
                        value={params.saSet}
                        onChange={(e) => setParams({ ...params, saSet: Number(e.target.value) })}
                        className="flex-1 h-1 bg-slate-700 rounded-full appearance-none accent-cyan-500"
                    />
                    <div className="text-sm text-cyan-400 font-mono min-w-16 text-right">
                        {params.saSet.toFixed(1)} °C
                    </div>
                </div>

                {/* Heat Load */}
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-lg px-4 py-3">
                    <Zap size={16} className="text-yellow-400" />
                    <div className="text-xs text-slate-500 min-w-24">机房热负载</div>
                    <input
                        type="range"
                        min="10000"
                        max="200000"
                        step="5000"
                        value={params.qLoad}
                        onChange={(e) => setParams({ ...params, qLoad: Number(e.target.value) })}
                        className="flex-1 h-1 bg-slate-700 rounded-full appearance-none accent-yellow-500"
                    />
                    <div className="text-sm text-yellow-400 font-mono min-w-20 text-right">
                        {(params.qLoad / 1000).toFixed(0)} kW
                    </div>
                </div>
            </div>
            {/* Main Visualizer (SVG) */}
            <HvacDiagram params={params} stats={stats} getAirColor={getAirColor} />
            {/* Bottom Data Panel */}
            <div className="w-full max-w-6xl h-48">
                <EfficiencyPanel
                    mode={mode}
                    params={params}
                    stats={stats}
                    history={history}
                    openModal={openModal}
                    warnings={currentAlerts}
                    onWarningClick={openWarningModal}
                />
            </div>

            {/* Modal在App层级渲染，不受stats更新影响 */}
            {modalData && (
                <ChartModal
                    onClose={closeModal}
                    parameter={modalData.parameter}
                    label={modalData.label}
                    unit={modalData.unit}
                    history={history}
                    color={modalData.color}
                />
            )}

            {/* 警告模态框 */}
            {warningModal && (
                <WarningModal
                    warning={warningModal}
                    onClose={closeWarningModal}
                />
            )}

            {/* 告警监控中心 */}
            {showAlertCenter && (
                <AlertCenter
                    alerts={currentAlerts}
                    alertHistory={alertHistory}
                    statistics={statistics}
                    stats={stats}
                    params={params}
                    mode={mode}
                    faults={activeFaults}
                    faultsPaused={faultsPaused}
                    copAnalysis={copAnalysis}
                    onClearFault={clearFault}
                    onClearAllFaults={clearAllFaults}
                    onToggleFaultPause={toggleFaultPause}
                    onClose={toggleAlertCenter}
                    onAlertClick={openWarningModal}
                />
            )}
        </div>
    );
}
