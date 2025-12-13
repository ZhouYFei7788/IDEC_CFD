import React from 'react';
import { Activity, Droplet, Zap, Wind, Gauge, Thermometer, TrendingUp } from 'lucide-react';
import { cn } from '../utils';
import ClickableParameter from './ClickableParameter';

/**
 * EfficiencyPanel displays system performance metrics with expandable charts
 */
const EfficiencyPanel = ({ mode, params, stats, history = [], openModal, warnings = {}, onWarningClick }) => {

    // A. 换热效率展示组件
    const EfficiencyGauge = () => {
        // 根据 A/B 情况判断显示逻辑
        const isWet = mode === 'wet';
        const isDry = mode === 'dry';

        let value = 0;
        let label = "";
        let colorClass = "text-slate-400";

        // 分母
        const denomDry = params.oaTemp - params.raTempInput; // 注意：这里 params.raTempInput 可能需要检查传入的 params 结构


        const raTemp = Number(stats.raTemp);
        const oaTemp = stats.oaTemp || params.oaTemp; // 优先使用带扰动的实时温度
        const denomDryCalc = oaTemp - raTemp;
        const denomWet = oaTemp - stats.wb;
        const numer = oaTemp - stats.coreOut; // 进风 - 芯体出风

        if (isDry) {
            // A情况: 干效率
            value = denomDryCalc !== 0 ? (numer / denomDryCalc) * 100 : 0;
            label = "显热效率 (Dry Eff)";
            // 阈值判断
            if (value > 75) colorClass = "text-emerald-400";
            else if (value < 50) colorClass = "text-yellow-400";
            else colorClass = "text-blue-400";
        } else if (isWet) {
            // B情况: 湿效率
            value = denomWet !== 0 ? (numer / denomWet) * 100 : 0;
            label = "湿球效率 (Wet Eff)";
            colorClass = "text-cyan-400"; // 总是很高
        }

        // 限制显示范围
        const displayVal = Math.min(Math.max(value, 0), 120).toFixed(1);

        return (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 h-full relative overflow-hidden">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</div>
                <div className={cn("text-4xl font-bold font-mono transition-colors", colorClass)}>
                    {displayVal}<span className="text-lg">%</span>
                </div>
                {isWet && <div className="text-[10px] text-slate-500 mt-1">B场景: 极限趋近湿球温度</div>}
                {isDry && <div className="text-[10px] text-slate-500 mt-1">A场景: 极限趋近回风温度</div>}
                <div className="absolute top-0 right-0 p-8 bg-current opacity-[0.03] rounded-full blur-2xl pointer-events-none text-white" />
            </div>
        );
    };

    // C. DX 性能展示组件 (混合/直膨模式) - 优化计算
    const DXPerformance = () => {
        const deltaT = (params.oaTemp - stats.saTemp).toFixed(1);
        // 简化COP计算，避免随机波动
        const cop = stats.compPower > 0
            ? ((stats.compPower * 3.5) / 1000).toFixed(2) // 基于功率的简化估算
            : "3.50";

        return (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/50 rounded-xl border border-slate-700 h-full border-l-4 border-l-indigo-500">
                <div className="text-xs text-indigo-300 uppercase tracking-widest mb-1">C场景: 机械制冷性能</div>
                <div className="grid grid-cols-2 gap-8 w-full text-center">
                    <div>
                        <div className="text-[10px] text-slate-500">总温差 ΔT</div>
                        <div className="text-2xl font-bold text-white font-mono">{deltaT}°C</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-500">实时能效 COP</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono">{cop}</div>
                    </div>
                </div>
            </div>
        );
    };

    // D. 温度状态显示组件
    const TemperatureStatus = () => {
        return (
            <div className="grid grid-cols-4 gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                {/* 机房冷通道温度 */}
                <ClickableParameter openModal={openModal}
                    label="机房冷通道温度"
                    value={stats.roomTemp}
                    unit="°C"
                    sublabel="Cold Aisle (SA+2°C)"
                    parameter="roomTemp"
                    history={history}
                    color="#67e8f9"
                    warning={warnings.roomTemp}
                    onWarningClick={onWarningClick}
                />
                {/* 机房热通道温度 */}
                <ClickableParameter openModal={openModal}
                    label="机房热通道温度"
                    value={stats.raTemp}
                    unit="°C"
                    sublabel="RA (Hot Aisle)"
                    parameter="raTemp"
                    history={history}
                    color="#fb923c"
                    warning={warnings.raTemp}
                    onWarningClick={onWarningClick}
                />
                {/* 送风温度 */}
                <ClickableParameter openModal={openModal}
                    label="送风温度"
                    value={stats.saTemp}
                    unit="°C"
                    sublabel="SA (IEC+DX)"
                    parameter="saTemp"
                    history={history}
                    color="#60a5fa"
                    warning={warnings.saTemp}
                    onWarningClick={onWarningClick}
                />
                {/* 排风温度 */}
                <ClickableParameter openModal={openModal}
                    label="排风温度"
                    value={stats.eaTemp}
                    unit="°C"
                    sublabel="EA (OA热交换后)"
                    parameter="eaTemp"
                    history={history}
                    color="#f87171"
                />
            </div>
        );
    };

    // D2. 制冷需求显示组件 (CFC)
    const CoolingDemand = () => {
        const cfcValue = stats.cfc || 0;
        let cfcColor = '#22c55e';  // 绿色 - 低需求
        let cfcLabel = '低';

        if (cfcValue > 70) {
            cfcColor = '#ef4444';  // 红色 - 高需求
            cfcLabel = '高';
        } else if (cfcValue > 40) {
            cfcColor = '#f59e0b';  // 橙色 - 中需求
            cfcLabel = '中';
        }

        const cfcWarning = warnings.cfc;

        return (
            <div className="p-4 bg-gradient-to-r from-slate-800/70 to-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                            <TrendingUp size={24} style={{ color: cfcColor }} />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                                制冷需求 Call For Cooling
                                {/* 警告图标 */}
                                {cfcWarning && (
                                    <button
                                        onClick={() => onWarningClick && onWarningClick(cfcWarning)}
                                        className="p-1 rounded hover:bg-slate-600/50 transition-all animate-pulse hover:animate-none"
                                        style={{ color: cfcWarning.levelInfo?.color || '#ef4444' }}
                                        title={cfcWarning.title}
                                    >
                                        {cfcWarning.levelInfo?.icon || '⚠️'}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold font-mono" style={{ color: cfcColor }}>
                                    {cfcValue}%
                                </span>
                                <span className="px-2 py-1 rounded text-xs font-semibold"
                                    style={{
                                        backgroundColor: `${cfcColor}20`,
                                        color: cfcColor
                                    }}>
                                    {cfcLabel}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CFC进度条 */}
                    <div className="flex-1 max-w-md ml-6">
                        <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full transition-all duration-700 rounded-full"
                                style={{
                                    width: `${cfcValue}%`,
                                    backgroundColor: cfcColor
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // E. 制冷量显示组件
    const CoolingCapacity = () => {
        return (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                {/* 总制冷量 */}
                <ClickableParameter openModal={openModal}
                    label="总制冷量"
                    value={stats.capacity_kw || 0}
                    unit=" kW"
                    sublabel="Total Cooling"
                    parameter="capacity_kw"
                    history={history}
                    color="#a78bfa"
                    warning={warnings.capacity_kw}
                    onWarningClick={onWarningClick}
                />
                {/* IEC制冷量 */}
                <ClickableParameter openModal={openModal}
                    label="IEC制冷量"
                    value={stats.Q_iec_kw || 0}
                    unit=" kW"
                    sublabel="IEC Cooling"
                    parameter="Q_iec_kw"
                    history={history}
                    color="#60a5fa"
                />
                {/* DX制冷量 */}
                <ClickableParameter openModal={openModal}
                    label="DX制冷量"
                    value={stats.Q_dx_kw || 0}
                    unit=" kW"
                    sublabel="DX Cooling"
                    parameter="Q_dx_kw"
                    history={history}
                    color="#f87171"
                />
            </div>
        );
    };

    // F. 风量显示组件
    const AirflowDisplay = () => {
        return (
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                {/* 实际风速 */}
                <ClickableParameter openModal={openModal}
                    label="实际风速"
                    value={stats.fanSpeed_actual || 0}
                    unit=" %"
                    sublabel="Fan Speed"
                    parameter="fanSpeed_actual"
                    history={history}
                    color="#22c55e"
                    warning={warnings.fanSpeed_actual}
                    onWarningClick={onWarningClick}
                />
                {/* 体积流量 */}
                <ClickableParameter openModal={openModal}
                    label="体积流量"
                    value={stats.airflow_m3h || 0}
                    unit=" m³/h"
                    sublabel="Volume Flow"
                    parameter="airflow_m3h"
                    history={history}
                    color="#06b6d4"
                />
                {/* 质量流量 */}
                <ClickableParameter openModal={openModal}
                    label="质量流量"
                    value={stats.airflow_kgs || 0}
                    unit=" kg/s"
                    sublabel="Mass Flow"
                    parameter="airflow_kgs"
                    history={history}
                    color="#fb923c"
                />
            </div>
        );
    };

    return (
        <div className="space-y-4 w-full h-full">
            {/* 温度状态栏 */}
            <TemperatureStatus />

            {/* 制冷需求显示 */}
            <CoolingDemand />

            {/* 制冷量显示栏 */}
            <CoolingCapacity />

            {/* 风量显示栏 */}
            <AirflowDisplay />

            {/* 主数据面板 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* 左侧：效率 / 性能看板 */}
                <div className="lg:col-span-3">
                    {(mode === 'dry' || mode === 'wet') ? <EfficiencyGauge /> : <DXPerformance />}
                </div>

                {/* 右侧：逆卡诺循环参数 (仅 DX 激活时有意义，否则置灰) */}
                <div className="lg:col-span-9 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Activity size={14} /> 逆卡诺循环实时监控 (Reverse Carnot Cycle)
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", stats.dxOn ? "bg-green-500 animate-pulse" : "bg-slate-600")}></span>
                            <span className="text-[10px] text-slate-500">{stats.dxOn ? "COMPRESSOR RUNNING" : "COMPRESSOR OFF"}</span>
                        </div>
                    </div>

                    <div className={cn("grid grid-cols-4 gap-4 transition-opacity duration-500", stats.dxOn ? "opacity-100" : "opacity-30 grayscale")}>
                        {/* 压缩机 */}
                        <div className="space-y-1">
                            <div className="text-[10px] text-slate-500">压缩机频率</div>
                            <div className="text-lg font-mono text-white">{stats.compHz} <span className="text-xs text-slate-500">Hz</span></div>
                            <div className="text-[10px] text-slate-600">Power: {(stats.compPower / 1000).toFixed(1)} kW</div>
                        </div>
                        {/* 高压侧 */}
                        <div className="space-y-1">
                            <div className="text-[10px] text-red-400">高压侧 (Condenser)</div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">P_high</span>
                                <span className="font-mono text-red-200">{stats.highPress} kPa</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">T_cond</span>
                                <span className="font-mono text-red-200">{stats.condTemp}°C</span>
                            </div>
                        </div>
                        {/* 低压侧 */}
                        <div className="space-y-1">
                            <div className="text-[10px] text-blue-400">低压侧 (Evaporator)</div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">P_low</span>
                                <span className="font-mono text-blue-200">{stats.lowPress} kPa</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">T_evap</span>
                                <span className="font-mono text-blue-200">{stats.evapTemp}°C</span>
                            </div>
                        </div>
                        {/* 过热/过冷/EEV */}
                        <div className="space-y-1">
                            <div className="text-[10px] text-purple-400">状态 (State)</div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">过热度 SH</span>
                                <span className="font-mono text-white">{stats.superheat || 0} K</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">过冷度 SC</span>
                                <span className="font-mono text-white">{stats.subcool || 0} K</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1 pt-1 border-t border-slate-700">
                                <span className="text-slate-400">EEV 开度</span>
                                <span className="font-mono text-purple-300">{stats.eevOpening || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EfficiencyPanel;

