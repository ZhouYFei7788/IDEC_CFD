import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDualColdSourcePhysics } from '../hooks/useDualColdSourcePhysics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ==========================================
// 双冷源风墙空调机组 - 系统级工艺流程图
// Dual Cooling Source Air-Wall HVAC Unit
// SCADA / Digital Twin Style
// ==========================================

// --- 颜色语义配置 (Strict Consistency) ---
const COLORS = {
    // 制冷剂回路 Refrigerant Circuit
    highPressure: '#ef4444',      // 高压常温 High Pressure - red
    highPressureBg: '#fef2f2',
    lowPressure: '#3b82f6',       // 低压常温 Low Pressure - blue
    lowPressureBg: '#eff6ff',
    suction: '#eab308',           // 低压回气 Suction Gas - yellow

    // 冷却水回路 Cooling Water Circuit
    coolingWater: '#10b981',      // 冷却水进水 - green
    coolingWaterLight: '#34d399',
    coolingWaterBg: '#ecfdf5',
    coolingWaterOut: '#fef08a',    // 冷却水出水 - light yellow (水盘管出水)
    coolingWaterHot: '#f87171',    // 板换出水 - light red (高温出水)

    // 气流 Airflow
    airflow: '#67e8f9',           // 气流 - cyan
    airflowLight: '#a5f3fc',

    // 设备 Equipment
    equipment: '#64748b',         // 设备边框 - slate
    equipmentBg: '#1e293b',       // 设备背景

    // 界面 Interface
    background: '#0f172a',
    surface: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    textDim: '#64748b',
};

// --- 管路流动动画 Animated Pipeline ---
const AnimatedPipe: React.FC<{
    d: string;
    color: string;
    strokeWidth?: number;
    animated?: boolean;
    reverse?: boolean;
}> = ({ d, color, strokeWidth = 5, animated = true, reverse = false }) => (
    <g>
        <path d={d} stroke={color} strokeWidth={strokeWidth} fill="none" opacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
        <motion.path
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="12 8"
            animate={animated ? { strokeDashoffset: reverse ? [0, 20] : [20, 0] } : {}}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
    </g>
);

// --- 流向箭头 Flow Arrow ---
const FlowArrow: React.FC<{
    x: number;
    y: number;
    rotation?: number;
    color: string;
    size?: number;
}> = ({ x, y, rotation = 0, color, size = 10 }) => (
    <motion.polygon
        points={`0,${-size / 2} ${size},0 0,${size / 2}`}
        fill={color}
        transform={`translate(${x}, ${y}) rotate(${rotation})`}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
    />
);

// --- 设备块 Equipment Block ---
const Equipment: React.FC<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    labelEn?: string;
    color?: string;
    children?: React.ReactNode;
}> = ({ x, y, width, height, label, labelEn, color = COLORS.equipment, children }) => (
    <g transform={`translate(${x}, ${y})`}>
        <rect x={0} y={0} width={width} height={height} rx={4} fill={COLORS.equipmentBg} stroke={color} strokeWidth={2} />
        {children}
        <text x={width / 2} y={height + 14} textAnchor="middle" fontSize="11" fill={COLORS.text} fontWeight="bold">{label}</text>
        {labelEn && <text x={width / 2} y={height + 26} textAnchor="middle" fontSize="8" fill={COLORS.textDim}>{labelEn}</text>}
    </g>
);

// --- 阀门 Valve ---
const Valve: React.FC<{
    x: number;
    y: number;
    label: string;
    labelEn?: string;
    opening?: number;
    color: string;
    rotation?: number;
    scale?: number;
    labelPosition?: 'top' | 'bottom';
}> = ({ x, y, label, labelEn, opening = 50, color, rotation = 0, scale = 1, labelPosition = 'bottom' }) => {
    const isTop = labelPosition === 'top';
    const textY = isTop ? -20 : 25;
    return (
        <g transform={`translate(${x}, ${y}) scale(${scale})`}>
            {/* 阀门图形 - 可旋转 */}
            <g transform={`rotate(${rotation})`}>
                <polygon points="-12,-10 0,0 -12,10" fill={COLORS.equipmentBg} stroke={color} strokeWidth={2} />
                <polygon points="12,-10 0,0 12,10" fill={COLORS.equipmentBg} stroke={color} strokeWidth={2} />
                <circle cx={0} cy={0} r={4} fill={color} />
            </g>
            {/* 文字 - 始终水平并使用背景遮盖 */}
            {/* 中文标签背景和文字 */}
            <rect x={-15} y={textY - 7} width={30} height={10} fill={COLORS.surface} rx={2} />
            <text x={0} y={textY} textAnchor="middle" fontSize="8" fill={COLORS.text} fontWeight="bold">{label}</text>

            {/* 英文标签背景和文字 */}
            {labelEn && (
                <g>
                    <rect x={-15} y={isTop ? -10 : 29} width={30} height={6} fill={COLORS.surface} rx={1} />
                    <text x={0} y={isTop ? -6 : 33} textAnchor="middle" fontSize="5" fill={COLORS.textDim}>{labelEn}</text>
                </g>
            )}

            {/* 开度背景和文字 */}
            {opening !== undefined && (
                <g>
                    <rect x={22} y={textY - 6} width={26} height={10} fill={COLORS.surface} rx={1} />
                    <text x={24} y={textY + 1} textAnchor="start" fontSize="8" fill={color} fontWeight="bold">{opening.toFixed(1)}%</text>
                </g>
            )}
        </g>
    );
};

// --- 风机 Fan (更加生动的现代风机造型) ---
const Fan: React.FC<{
    x: number;  // 中心点X坐标
    y: number;  // 中心点Y坐标
    width?: number; // 外框宽度
    height?: number; // 外框高度
    running?: boolean;
    id: number;
    color?: string; // 可选的强调色
}> = ({ x, y, width = 60, height = 80, running = true, id, color = COLORS.coolingWater }) => {
    // 限制风机叶轮大小适应外框
    const radius = Math.min(width, height) / 2 - 4;

    return (
        <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>
            {/* 长方体外框 (百叶窗/风波纹理底板) */}
            <rect x={0} y={0} width={width} height={height} rx={4} fill={COLORS.equipmentBg} stroke={running ? color : COLORS.textDim} strokeWidth={2} />

            <g transform={`translate(${width / 2}, ${height / 2})`}>
                {/* 导流罩外圈 */}
                <circle cx={0} cy={0} r={radius} fill={COLORS.background} stroke={COLORS.border} strokeWidth={2} />

                {/* 风机叶片动画 */}
                <motion.g
                    animate={running ? { rotate: 360 } : {}}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                    {/* 绘制4个弯曲的风机叶片 */}
                    {[0, 90, 180, 270].map(angle => (
                        <g key={angle} transform={`rotate(${angle})`}>
                            <path
                                d={`M 0 -4 Q ${radius * 0.6} -10 ${radius * 0.9} 0 Q ${radius * 0.6} 10 0 4 Z`}
                                fill={running ? color : COLORS.textDim}
                                opacity={0.8}
                            />
                        </g>
                    ))}
                </motion.g>

                {/* 电机中心圆毂 */}
                <circle cx={0} cy={0} r={radius * 0.25} fill={COLORS.surface} stroke={running ? color : COLORS.textDim} strokeWidth={1.5} />
                <circle cx={0} cy={0} r={radius * 0.1} fill={running ? color : COLORS.textDim} />
            </g>

            {/* 标签 */}
            <text x={width / 2} y={height + 14} textAnchor="middle" fontSize="9" fill={COLORS.textMuted} fontWeight="bold">F{id}</text>
        </g>
    );
};

// --- 气流粒子特效 Airflow Particles (支持变色) ---
const AirflowParticles: React.FC<{
    fanYPositions: number[];
    active: boolean;
    supplyTemp: number; // 送风温度
}> = ({ fanYPositions, active, supplyTemp }) => {
    if (!active) return null;

    // 确定空气被冷却前后的颜色
    // 空气始终由较热的颜色进入 (如橙色)
    // 根据送风温度来决定出风的颜色，> 28 偏热橙色，否则为冷色 (青蓝)
    const hotColor = '#fb923c'; // orange-400
    const coldColor = supplyTemp >= 28 ? '#fcd34d' : COLORS.airflow; // 淡橙(amber-300) vs青蓝

    const particles: React.ReactNode[] = [];
    fanYPositions.forEach((fanY, fanIndex) => {
        // 每个风机 80 高度，分布 6 条轨迹
        for (let i = 0; i < 6; i++) {
            const yOffset = (i - 2.5) * 12;
            const y = fanY + yOffset;
            const isLight = i % 2 === 0;

            // 每条轨迹放置 3 个粒子动画并错开时间
            for (let j = 0; j < 3; j++) {
                const delay = j * 1.5 + (((fanIndex * 7) + (i * 13) + (j * 17)) % 10) / 10 * 0.8;
                const duration = 4.5 + (((fanIndex * 11) + (i * 19) + (j * 23)) % 10) / 10 * 1.5;

                particles.push(
                    <g key={`particle-${fanIndex}-${i}-${j}`}>
                        {/* 使用渐变色代替单一颜色 */}
                        <motion.line
                            x1={-25} y1={y} x2={0} y2={y}
                            stroke="url(#airflow-gradient)"
                            strokeWidth={isLight ? 1 : 2}
                            strokeLinecap="round"
                            initial={{ x: 230, opacity: 0 }}
                            animate={{ x: 1300, opacity: [0, 0.5, 0.7, 0.5, 0] }}
                            transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
                        />
                        <motion.circle
                            cx={0} cy={y} r={isLight ? 1.5 : 2.5}
                            fill="url(#airflow-gradient)"
                            initial={{ x: 230, opacity: 0 }}
                            animate={{ x: 1300, opacity: [0, 0.8, 1, 0.8, 0] }}
                            transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
                        />
                    </g>
                );
            }
        }
    });

    return (
        <g id="airflow-particles" opacity={0.65} style={{ mixBlendMode: 'screen' }}>
            <defs>
                {/* 气流渐变定义：X坐标范围大致从 200 (进入区) 到 900 (冷却端) */}
                <linearGradient id="airflow-gradient" x1="20%" y1="0%" x2="80%" y2="0%" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={hotColor} />
                    <stop offset="40%" stopColor={hotColor} />  {/* 到达水盘管前保持热色 */}
                    <stop offset="60%" stopColor={coldColor} /> {/* 经过蒸发器后变为冷色 */}
                    <stop offset="100%" stopColor={coldColor} />
                </linearGradient>
            </defs>
            {particles}
        </g>
    );
};

// --- 主组件 Main Component ---
export default function DualColdSourceAirWall() {
    const [mode, setMode] = useState<'auto' | 'natural' | 'mechanical' | 'hybrid'>('auto');
    // 机房热负荷 (0-200kW) 独立状态，用户可控
    const [heatLoad, setHeatLoad] = useState<number>(120);
    // 送风温度设定值 (15-30°C)
    const [supplyTempSet, setSupplyTempSet] = useState<number>(20);
    // 冷却水进水温度 (用户手动控制)
    const [cwInletTemp, setCwInletTemp] = useState<number>(30);

    // 核心物理仿真 Hook
    const data = useDualColdSourcePhysics(mode, heatLoad, supplyTempSet, cwInletTemp);

    // 记录所有参数的历史数据用于图表显示
    const [history, setHistory] = useState<{
        time: string;
        supplyAirTemp: number;
        returnAirTemp: number;
        hotAisleTemp: number;
        coolingWaterIn: number;
        coolingWaterOut: number;
        bypassValveOpening: number;
        highPressureValveOpening: number;
        fanSpeed: number;
        compHz: number;
        totalCooling: number;
        naturalCooling: number;
        dxCooling: number;
        cfcDemand: number;
        eevOpening: number;
        highPressure: number;
        lowPressure: number;
        superheat: number;
        evapTemp: number;
        condTemp: number;
    }[]>([]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHistory(prev => {
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            const newHistory = [...prev, {
                time: timeStr,
                supplyAirTemp: Number(data.supplyAirTemp.toFixed(1)),
                returnAirTemp: Number(data.returnAirTemp.toFixed(1)),
                hotAisleTemp: Number(data.hotAisleTemp.toFixed(1)),
                coolingWaterIn: Number(data.coolingWaterIn.toFixed(1)),
                coolingWaterOut: Number(data.coolingWaterOut.toFixed(1)),
                bypassValveOpening: Number(data.bypassValveOpening.toFixed(2)),
                highPressureValveOpening: Number(data.highPressureValveOpening.toFixed(2)),
                fanSpeed: Number(data.fanSpeed.toFixed(0)),
                compHz: Number(data.compHz.toFixed(1)),
                totalCooling: Number(data.totalCooling.toFixed(1)),
                naturalCooling: Number(data.naturalCooling.toFixed(1)),
                dxCooling: Number(data.dxCooling.toFixed(1)),
                cfcDemand: Number(data.cfcDemand.toFixed(0)),
                eevOpening: Number(data.eev1Opening.toFixed(1)),
                highPressure: Number(data.highPressure.toFixed(1)),
                lowPressure: Number(data.lowPressure.toFixed(1)),
                superheat: Number(data.superheat.toFixed(1)),
                evapTemp: Number(data.evapTemp.toFixed(1)),
                condTemp: Number(data.condTemp.toFixed(1))
            }];
            // 保留最近60个数据点 (按0.5秒一帧大约是30秒的数据)
            if (newHistory.length > 60) {
                return newHistory.slice(newHistory.length - 60);
            }
            return newHistory;
        });
    }, [data.supplyAirTemp, data.returnAirTemp, data.hotAisleTemp, data.coolingWaterIn, data.coolingWaterOut, data.bypassValveOpening, data.highPressureValveOpening, data.fanSpeed, data.compHz, data.totalCooling, data.naturalCooling, data.dxCooling, data.cfcDemand, data.eev1Opening, data.highPressure, data.lowPressure, data.superheat, data.evapTemp, data.condTemp]);

    const [activeChart, setActiveChart] = useState<string | null>(null);

    const renderChartModal = () => {
        if (!activeChart) return null;

        let dataKey = '';
        let title = '';
        let color = '';
        let unit = '';

        switch (activeChart) {
            case 'supplyAirTemp': dataKey = 'supplyAirTemp'; title = '送风温度'; color = COLORS.airflow; unit = '°C'; break;
            case 'returnAirTemp': dataKey = 'returnAirTemp'; title = '回风温度'; color = COLORS.suction; unit = '°C'; break;
            case 'hotAisleTemp': dataKey = 'hotAisleTemp'; title = '热通道温度'; color = '#ef4444'; unit = '°C'; break;
            case 'coolingWaterIn': dataKey = 'coolingWaterIn'; title = '进水温度'; color = COLORS.coolingWater; unit = '°C'; break;
            case 'coolingWaterOut': dataKey = 'coolingWaterOut'; title = '出水温度'; color = COLORS.coolingWaterOut; unit = '°C'; break;
            case 'bypassValveOpening': dataKey = 'bypassValveOpening'; title = '旁通阀开度'; color = COLORS.textDim; unit = '%'; break;
            case 'highPressureValveOpening': dataKey = 'highPressureValveOpening'; title = '二通阀开度'; color = COLORS.coolingWaterHot; unit = '%'; break;
            case 'fanSpeed': dataKey = 'fanSpeed'; title = '风机转速'; color = '#a78bfa'; unit = 'RPM'; break;
            case 'compHz': dataKey = 'compHz'; title = '压缩机频率'; color = COLORS.highPressure; unit = 'Hz'; break;
            case 'totalCooling': dataKey = 'totalCooling'; title = '总制冷量'; color = '#22d3ee'; unit = 'kW'; break;
            case 'naturalCooling': dataKey = 'naturalCooling'; title = '自然冷却量'; color = COLORS.coolingWater; unit = 'kW'; break;
            case 'dxCooling': dataKey = 'dxCooling'; title = 'DX制冷量'; color = COLORS.lowPressure; unit = 'kW'; break;
            case 'cfcDemand': dataKey = 'cfcDemand'; title = 'CFC制冷需求'; color = '#f43f5e'; unit = '%'; break;
            case 'eevOpening': dataKey = 'eevOpening'; title = 'EEV开度'; color = '#facc15'; unit = '%'; break;
            case 'highPressure': dataKey = 'highPressure'; title = '高压压力'; color = COLORS.highPressure; unit = 'Bar'; break;
            case 'lowPressure': dataKey = 'lowPressure'; title = '低压压力'; color = COLORS.lowPressure; unit = 'Bar'; break;
            case 'superheat': dataKey = 'superheat'; title = '过热度'; color = '#f87171'; unit = 'K'; break;
            case 'evapTemp': dataKey = 'evapTemp'; title = '蒸发温度'; color = '#38bdf8'; unit = '°C'; break;
            case 'condTemp': dataKey = 'condTemp'; title = '冷凝温度'; color = '#fb923c'; unit = '°C'; break;
            default: return null;
        }

        const values = history.map(d => d[dataKey as keyof typeof d] as number).filter(v => v !== undefined && !isNaN(v));
        const max = values.length > 0 ? Math.max(...values).toFixed(2) : '-';
        const min = values.length > 0 ? Math.min(...values).toFixed(2) : '-';
        const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '-';

        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setActiveChart(null)}>
                {/* 模糊背景层 (独立避免影响内部内容) */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"></div>

                {/* 弹窗内容 */}
                <div className="relative bg-slate-800 rounded-xl p-6 w-full max-w-3xl border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-slate-700 pb-3">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                                {title} 实时监测曲线
                            </h3>
                            <div className="flex gap-4 mt-3 text-sm">
                                <div className="flex flex-col bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                                    <span className="text-slate-400 text-xs">最大值 (Max)</span>
                                    <span className="text-white font-mono font-bold" style={{ color: color }}>{max} {unit}</span>
                                </div>
                                <div className="flex flex-col bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                                    <span className="text-slate-400 text-xs">最小值 (Min)</span>
                                    <span className="text-white font-mono font-bold" style={{ color: color }}>{min} {unit}</span>
                                </div>
                                <div className="flex flex-col bg-slate-900 px-3 py-1.5 rounded border border-slate-700">
                                    <span className="text-slate-400 text-xs">平均值 (Avg)</span>
                                    <span className="text-white font-mono font-bold" style={{ color: color }}>{avg} {unit}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setActiveChart(null)} className="text-gray-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
                    </div>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} minTickGap={20} />
                                <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(val) => Number(val).toFixed(1)} width={40} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                                    itemStyle={{ color: color, fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey={dataKey}
                                    name={`${title} (${unit})`}
                                    stroke={color}
                                    strokeWidth={3}
                                    dot={{ r: 0, fill: color, strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full p-4" style={{ backgroundColor: COLORS.background }}>
            {/* 标题栏 Header */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b" style={{ borderColor: COLORS.border }}>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>
                        双冷源风墙空调机组
                    </h1>
                    <p className="text-xs" style={{ color: COLORS.textDim }}>
                        Dual Cooling Source Air-Wall HVAC Unit - System Schematic
                    </p>
                </div>

                {/* 图例 Legend */}
                <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-1.5 rounded" style={{ backgroundColor: COLORS.highPressure }} />
                        <span style={{ color: COLORS.textMuted }}>高压制冷剂</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-1.5 rounded" style={{ backgroundColor: COLORS.lowPressure }} />
                        <span style={{ color: COLORS.textMuted }}>低压制冷剂</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-1.5 rounded" style={{ backgroundColor: COLORS.coolingWater }} />
                        <span style={{ color: COLORS.textMuted }}>冷却水</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-5 h-1.5 rounded" style={{ backgroundColor: COLORS.airflow }} />
                        <span style={{ color: COLORS.textMuted }}>气流</span>
                    </div>
                </div>
            </div>

            {/* 主系统示意图 */}
            <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <svg viewBox="0 0 1400 600" className="w-full h-auto">
                    <defs>
                        <pattern id="gridPattern" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke={COLORS.border} strokeWidth="0.5" opacity="0.4" />
                        </pattern>
                    </defs>

                    {/* 背景网格 */}
                    <rect width="100%" height="100%" fill="url(#gridPattern)" />

                    {/* ====== 坐标轴辅助线 (设置 SHOW_AXIS = false 即可去除) ====== */}
                    {(() => {
                        const SHOW_AXIS = true; // 设置为 false 即可去除坐标轴
                        if (!SHOW_AXIS) return null;

                        return (
                            <g id="coordinate-axis">
                                {/* X轴 - 在Y=300位置（600高度的中心） */}
                                <line x1={0} y1={300} x2={1400} y2={300} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" opacity={0.6} />
                                {/* Y轴 */}
                                <line x1={700} y1={0} x2={700} y2={600} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 2" opacity={0.6} />

                                {/* X轴刻度 (每100单位) */}
                                {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400].map(x => (
                                    <g key={`x-${x}`}>
                                        <line x1={x} y1={295} x2={x} y2={305} stroke="#f59e0b" strokeWidth={1} />
                                        <text x={x} y={320} textAnchor="middle" fontSize="10" fill="#f59e0b">{x}</text>
                                    </g>
                                ))}

                                {/* Y轴刻度 (每100单位，范围0-600) */}
                                {[0, 100, 200, 300, 400, 500, 600].map(y => (
                                    <g key={`y-${y}`}>
                                        <line x1={695} y1={y} x2={705} y2={y} stroke="#f59e0b" strokeWidth={1} />
                                        <text x={720} y={y + 4} fontSize="10" fill="#f59e0b">{y}</text>
                                    </g>
                                ))}

                                {/* 50单位小刻度线 */}
                                {[50, 150, 250, 350, 450, 550, 650, 750, 850, 950, 1050, 1150, 1250, 1350].map(x => (
                                    <line key={`x-small-${x}`} x1={x} y1={298} x2={x} y2={302} stroke="#f59e0b" strokeWidth={0.5} opacity={0.5} />
                                ))}
                                {[50, 150, 250, 350, 450, 550].map(y => (
                                    <line key={`y-small-${y}`} x1={698} y1={y} x2={702} y2={y} stroke="#f59e0b" strokeWidth={0.5} opacity={0.5} />
                                ))}

                                {/* 坐标原点标记 */}
                                <circle cx={0} cy={0} r={5} fill="#f59e0b" opacity={0.8} />
                                <text x={15} y={15} fontSize="10" fill="#f59e0b">(0,0)</text>

                                {/* 提示文字 */}
                                <text x={700} y={580} textAnchor="middle" fontSize="12" fill="#f59e0b">
                                    坐标轴辅助线 (SHOW_AXIS = true)
                                </text>
                            </g>
                        );
                    })()}

                    {/* ====== 在此处添加布局组件 ====== */}

                    {/* 风机墙 - 中心点坐标 */}
                    <Fan x={200} y={100} running={true} id={1} />  {/* F1 (200, 100) */}
                    <Fan x={200} y={500} running={true} id={2} />  {/* F2 (200, 500) */}
                    <Fan x={200} y={300} running={true} id={3} />  {/* F3 (200, 300) */}

                    {/* 压缩机 - 中心点坐标(300, 150) */}
                    <Equipment x={270} y={120} width={60} height={60} label="压缩机" labelEn="Compressor" color={COLORS.highPressure}>
                        {/* 压缩机内部图标 */}
                        <circle cx={30} cy={30} r={18} fill="none" stroke={COLORS.highPressure} strokeWidth={1.5} />
                        <path d="M 30 12 L 30 48" stroke={COLORS.highPressure} strokeWidth={1.5} />
                        <path d="M 18 18 L 42 42" stroke={COLORS.highPressure} strokeWidth={1.5} />
                        <path d="M 18 42 L 42 18" stroke={COLORS.highPressure} strokeWidth={1.5} />
                    </Equipment>

                    {/* 板式换热器 - 中心点坐标(400, 300) - 竖直方向 */}
                    <Equipment x={360} y={260} width={80} height={80} label="板换" labelEn="Plate HX" color={COLORS.coolingWater}>
                        {/* 板换内部图标 - 竖直方向，水平板片 */}
                        <rect x={20} y={15} width={40} height={50} fill="none" stroke={COLORS.coolingWater} strokeWidth={1.5} />
                        <line x1={20} y1={25} x2={60} y2={25} stroke={COLORS.coolingWater} strokeWidth={1} />
                        <line x1={20} y1={35} x2={60} y2={35} stroke={COLORS.coolingWater} strokeWidth={1} />
                        <line x1={20} y1={45} x2={60} y2={45} stroke={COLORS.coolingWater} strokeWidth={1} />
                        <line x1={20} y1={55} x2={60} y2={55} stroke={COLORS.coolingWater} strokeWidth={1} />
                        {/* 进出口标记 - 上下方向 */}
                        <circle cx={30} cy={12} r={2} fill={COLORS.coolingWater} />
                        <circle cx={50} cy={68} r={2} fill={COLORS.coolingWater} />
                    </Equipment>

                    {/* 水盘管 - X=600, Y=100-500 (长方形) */}
                    <Equipment x={570} y={100} width={60} height={400} label="水盘管" labelEn="Water Coil" color={COLORS.coolingWater}>
                        {/* 水盘管内部图标 - 水平管道排列 */}
                        <rect x={10} y={30} width={40} height={340} fill="none" stroke={COLORS.coolingWater} strokeWidth={1.5} />
                        {/* 多层水平管道 */}
                        {[50, 100, 150, 200, 250, 300, 350].map(y => (
                            <line key={y} x1={10} y1={y} x2={50} y2={y} stroke={COLORS.coolingWater} strokeWidth={1.5} />
                        ))}
                        {/* 垂直连接管 */}
                        <line x1={15} y1={30} x2={15} y2={370} stroke={COLORS.coolingWaterLight} strokeWidth={1} opacity={0.6} />
                        <line x1={45} y1={30} x2={45} y2={370} stroke={COLORS.coolingWaterLight} strokeWidth={1} opacity={0.6} />
                        {/* 进出口标记 */}
                        <circle cx={30} cy={20} r={3} fill={COLORS.coolingWater} />
                        <circle cx={30} cy={380} r={3} fill={COLORS.coolingWater} />
                    </Equipment>

                    {/* 蒸发器1 - X=800, Y=50-200 */}
                    <Equipment x={770} y={50} width={60} height={150} label="蒸发器1" labelEn="Evaporator 1" color={COLORS.lowPressure}>
                        {/* 蒸发器内部图标 - 翅片管 */}
                        <rect x={10} y={20} width={40} height={110} fill="none" stroke={COLORS.lowPressure} strokeWidth={1.5} />
                        {/* 垂直翅片 */}
                        {[15, 20, 25, 30, 35, 40, 45].map(x => (
                            <line key={x} x1={x} y1={20} x2={x} y2={130} stroke={COLORS.lowPressure} strokeWidth={0.8} opacity={0.6} />
                        ))}
                        {/* 制冷剂管道 */}
                        <line x1={10} y1={40} x2={50} y2={40} stroke={COLORS.lowPressure} strokeWidth={2} />
                        <line x1={10} y1={70} x2={50} y2={70} stroke={COLORS.lowPressure} strokeWidth={2} />
                        <line x1={10} y1={100} x2={50} y2={100} stroke={COLORS.lowPressure} strokeWidth={2} />
                    </Equipment>

                    {/* 蒸发器2 - X=800, Y=400-550 */}
                    <Equipment x={770} y={400} width={60} height={150} label="蒸发器2" labelEn="Evaporator 2" color={COLORS.lowPressure}>
                        {/* 蒸发器内部图标 - 翅片管 */}
                        <rect x={10} y={20} width={40} height={110} fill="none" stroke={COLORS.lowPressure} strokeWidth={1.5} />
                        {/* 垂直翅片 */}
                        {[15, 20, 25, 30, 35, 40, 45].map(x => (
                            <line key={`evap2-${x}`} x1={x} y1={20} x2={x} y2={130} stroke={COLORS.lowPressure} strokeWidth={0.8} opacity={0.6} />
                        ))}
                        {/* 制冷剂管道 */}
                        <line x1={10} y1={40} x2={50} y2={40} stroke={COLORS.lowPressure} strokeWidth={2} />
                        <line x1={10} y1={70} x2={50} y2={70} stroke={COLORS.lowPressure} strokeWidth={2} />
                        <line x1={10} y1={100} x2={50} y2={100} stroke={COLORS.lowPressure} strokeWidth={2} />
                    </Equipment>

                    {/* ====== 气流粒子特效 ====== */}
                    {/* 风机中心的高度分布, 传入送风温度计算变色 */}
                    <AirflowParticles fanYPositions={[100, 300, 500]} active={true} supplyTemp={data.supplyAirTemp} />

                    {/* 回风温度 (Return Air Temp) 显示标签 */}
                    <g transform="translate(100, 300)">
                        <rect x={-35} y={-12} width={70} height={24} fill={COLORS.surface} stroke={COLORS.suction} strokeWidth={1.5} rx={4} />
                        <text x={0} y={4} textAnchor="middle" fontSize="12" fill={COLORS.suction} className="font-mono font-bold">{data.returnAirTemp.toFixed(1)}°C</text>
                        <text x={0} y={22} textAnchor="middle" fontSize="8" fill={COLORS.textDim}>回风温度 T_ra</text>
                    </g>

                    {/* 送风温度 (Supply Air Temp) 显示标签 */}
                    <g transform="translate(900, 300)">
                        <rect x={-35} y={-12} width={70} height={24} fill={COLORS.surface} stroke={COLORS.airflow} strokeWidth={1.5} rx={4} />
                        <text x={0} y={4} textAnchor="middle" fontSize="12" fill={COLORS.airflow} className="font-mono font-bold">{data.supplyAirTemp.toFixed(1)}°C</text>
                        <text x={0} y={22} textAnchor="middle" fontSize="8" fill={COLORS.textDim}>送风温度 T_sa</text>
                    </g>

                    {/* ====== 低压制冷剂管路 ====== */}
                    {/* 从板换下边长靠左(380, 340) → (380, 560) → (700, 560) → (700, 300) → (800, 300)分叉 */}

                    {/* 主管路：板换 → 分叉点 */}
                    <AnimatedPipe d="M 380 340 L 380 560" color={COLORS.lowPressure} strokeWidth={3} />
                    <AnimatedPipe d="M 380 560 L 700 560" color={COLORS.lowPressure} strokeWidth={3} />
                    <AnimatedPipe d="M 700 560 L 700 300" color={COLORS.lowPressure} strokeWidth={3} />
                    <AnimatedPipe d="M 700 300 L 800 300" color={COLORS.lowPressure} strokeWidth={3} />

                    {/* 分叉到蒸发器1（下边长中心 800, 200） */}
                    <AnimatedPipe d="M 800 300 L 800 200" color={COLORS.lowPressure} strokeWidth={3} />

                    {/* 分叉到蒸发器2（上边长中心 800, 400） */}
                    <AnimatedPipe d="M 800 300 L 800 400" color={COLORS.lowPressure} strokeWidth={3} />

                    {/* 流向箭头 */}
                    <FlowArrow x={380} y={450} rotation={90} color={COLORS.lowPressure} />
                    <FlowArrow x={540} y={560} rotation={0} color={COLORS.lowPressure} />
                    <FlowArrow x={700} y={430} rotation={-90} color={COLORS.lowPressure} />
                    <FlowArrow x={750} y={300} rotation={0} color={COLORS.lowPressure} />
                    <FlowArrow x={800} y={250} rotation={-90} color={COLORS.lowPressure} />
                    <FlowArrow x={800} y={350} rotation={90} color={COLORS.lowPressure} />

                    {/* ====== 高压制冷剂管路 ====== */}
                    {/* 从压缩机下边长中心(300, 180) → 板换上边长靠左(380, 260) */}

                    {/* 压缩机排气 → 板换入口 */}
                    <AnimatedPipe d="M 300 180 L 300 220" color={COLORS.highPressure} strokeWidth={3} />
                    <AnimatedPipe d="M 300 220 L 380 220" color={COLORS.highPressure} strokeWidth={3} />
                    <AnimatedPipe d="M 380 220 L 380 260" color={COLORS.highPressure} strokeWidth={3} />

                    {/* 流向箭头 */}
                    <FlowArrow x={300} y={200} rotation={90} color={COLORS.highPressure} />
                    <FlowArrow x={340} y={220} rotation={0} color={COLORS.highPressure} />
                    <FlowArrow x={380} y={240} rotation={90} color={COLORS.highPressure} />

                    {/* ====== 低压回气管路（蒸发器出口 → 压缩机入口） ====== */}

                    {/* 蒸发器1出口路径：(800, 50) → (800, 25) 只保留向上的管道 */}
                    <path d="M 800 50 L 800 25" stroke={COLORS.suction} strokeWidth={3} fill="none" />

                    {/* 蒸发器2出口路径：(800, 550) → (800, 575) → (950, 575) → (950, 25) → (300, 25) 汇合 */}
                    <AnimatedPipe d="M 800 550 L 800 575" color={COLORS.suction} strokeWidth={3} />
                    <AnimatedPipe d="M 800 575 L 950 575" color={COLORS.suction} strokeWidth={3} />
                    <AnimatedPipe d="M 950 575 L 950 25" color={COLORS.suction} strokeWidth={3} />
                    <AnimatedPipe d="M 950 25 L 300 25" color={COLORS.suction} strokeWidth={3} />

                    {/* 汇合后到压缩机：(300, 25) → (300, 120) */}
                    <AnimatedPipe d="M 300 25 L 300 120" color={COLORS.suction} strokeWidth={3} />

                    {/* 流向箭头 */}
                    <FlowArrow x={800} y={37} rotation={-90} color={COLORS.suction} />
                    <FlowArrow x={550} y={25} rotation={180} color={COLORS.suction} />
                    <FlowArrow x={800} y={562} rotation={90} color={COLORS.suction} />
                    <FlowArrow x={875} y={575} rotation={0} color={COLORS.suction} />
                    <FlowArrow x={950} y={300} rotation={-90} color={COLORS.suction} />
                    <FlowArrow x={625} y={25} rotation={180} color={COLORS.suction} />
                    <FlowArrow x={300} y={70} rotation={90} color={COLORS.suction} />

                    {/* ====== 冷却水管路 ====== */}

                    {/* 进水法兰 - (1000, 580) */}
                    <g transform="translate(1000, 580)">
                        {/* 法兰圆圈 */}
                        <circle cx={0} cy={0} r={10} fill={COLORS.equipmentBg} stroke={COLORS.coolingWater} strokeWidth={2.5} />
                        {/* 文字在上方 */}
                        <text x={0} y={-18} textAnchor="middle" fontSize="9" fill={COLORS.coolingWater} fontWeight="bold">进水</text>
                        <text x={0} y={-8} textAnchor="middle" fontSize="7" fill={COLORS.textDim}>Water In</text>
                        {/* 进水温度数值 */}
                        <rect x={20} y={-10} width={45} height={20} fill={COLORS.surface} stroke={COLORS.coolingWater} strokeWidth={1} rx={2} />
                        <text x={42} y={3} textAnchor="middle" fontSize="10" fill={COLORS.coolingWater} className="font-mono font-bold">{data.coolingWaterIn.toFixed(1)}°C</text>
                    </g>

                    {/* 进水管路：(1000, 580) → (600, 580) → (600, 500) 水盘管下边长中心 */}
                    <AnimatedPipe d="M 1000 580 L 600 580" color={COLORS.coolingWater} strokeWidth={3} />
                    <AnimatedPipe d="M 600 580 L 600 500" color={COLORS.coolingWater} strokeWidth={3} />

                    {/* 分支2：到三通 (600, 580) → (512, 580) 延长到三通内部 */}
                    <AnimatedPipe d="M 600 580 L 512 580" color={COLORS.coolingWater} strokeWidth={3} />

                    {/* 流向箭头 */}
                    <FlowArrow x={800} y={580} rotation={180} color={COLORS.coolingWater} />
                    <FlowArrow x={600} y={540} rotation={-90} color={COLORS.coolingWater} />

                    {/* 旁通阀 - 只显示中文标签和开度 */}
                    <Valve x={550} y={580} label="旁通阀" opening={data.bypassValveOpening} color={COLORS.coolingWater} labelPosition="top" />

                    {/* 三通 - (500, 580) T型管件 */}
                    <g transform="translate(500, 580)">
                        {/* 水平主管 */}
                        <rect x={-12} y={-3} width={24} height={6} fill={COLORS.equipmentBg} stroke={COLORS.coolingWater} strokeWidth={1.5} rx={1} />
                        {/* 垂直支管 */}
                        <rect x={-3} y={-12} width={6} height={12} fill={COLORS.equipmentBg} stroke={COLORS.coolingWaterOut} strokeWidth={1.5} rx={1} />
                        {/* 中心连接点 */}
                        <circle cx={0} cy={0} r={3} fill={COLORS.coolingWater} stroke="none" />
                    </g>

                    {/* 出水管路：水盘管上边长中心(600, 100) → (600, 50) → (500, 50) → (500, 580)三通 */}
                    <AnimatedPipe d="M 600 100 L 600 50" color={COLORS.coolingWaterOut} strokeWidth={3} />
                    <AnimatedPipe d="M 600 50 L 500 50" color={COLORS.coolingWaterOut} strokeWidth={3} />
                    <AnimatedPipe d="M 500 50 L 500 580" color={COLORS.coolingWaterOut} strokeWidth={3} />

                    {/* 三通到板换：(500, 580) → (420, 580) → (420, 340)板换下边长靠右 */}
                    <AnimatedPipe d="M 500 580 L 420 580" color={COLORS.coolingWater} strokeWidth={3} />
                    <AnimatedPipe d="M 420 580 L 420 340" color={COLORS.coolingWater} strokeWidth={3} />

                    {/* 流向箭头 */}
                    <FlowArrow x={600} y={75} rotation={-90} color={COLORS.coolingWaterOut} />
                    <FlowArrow x={550} y={50} rotation={180} color={COLORS.coolingWaterOut} />
                    <FlowArrow x={500} y={300} rotation={90} color={COLORS.coolingWaterOut} />
                    <FlowArrow x={460} y={580} rotation={180} color={COLORS.coolingWater} />
                    <FlowArrow x={420} y={460} rotation={-90} color={COLORS.coolingWater} />

                    {/* ====== 板换出水管路 ====== */}

                    {/* 出水法兰 - (100, 30) */}
                    <g transform="translate(100, 30)">
                        {/* 法兰圆圈 */}
                        <circle cx={0} cy={0} r={10} fill={COLORS.equipmentBg} stroke={COLORS.coolingWaterHot} strokeWidth={2.5} />
                        {/* 文字在上方 */}
                        <text x={0} y={-18} textAnchor="middle" fontSize="9" fill={COLORS.coolingWaterHot} fontWeight="bold">出水</text>
                        <text x={0} y={-8} textAnchor="middle" fontSize="7" fill={COLORS.textDim}>Water Out</text>
                        {/* 出水温度数值 */}
                        <rect x={-65} y={-10} width={45} height={20} fill={COLORS.surface} stroke={COLORS.coolingWaterHot} strokeWidth={1} rx={2} />
                        <text x={-43} y={3} textAnchor="middle" fontSize="10" fill={COLORS.coolingWaterHot} className="font-mono font-bold">{data.coolingWaterOut.toFixed(1)}°C</text>
                    </g>

                    {/* 板换出水管路：板换上边长靠右(420, 260) → (420, 30) → (100, 30) */}
                    <AnimatedPipe d="M 420 260 L 420 30" color={COLORS.coolingWaterHot} strokeWidth={3} />
                    <AnimatedPipe d="M 420 30 L 100 30" color={COLORS.coolingWaterHot} strokeWidth={3} />

                    {/* 流向箭头和阀门 */}
                    <Valve x={420} y={200} label="二通阀" opening={data.highPressureValveOpening} color={COLORS.coolingWaterHot} rotation={90} scale={1.3} />
                    <FlowArrow x={260} y={30} rotation={180} color={COLORS.coolingWaterHot} />

                </svg>
            </div>

            {/* 运行模式和热负荷拉杆 Operating Mode & Heat Load */}
            <div className="mt-3 flex flex-col md:flex-row gap-4">
                {/* 模式选择 */}
                <div className="flex-1 flex gap-3">
                    {[
                        { key: 'auto', label: '自动模式', labelEn: 'Auto Mode', desc: '自动计算CFC需求并调度自然/混合/机械' },
                        { key: 'natural', label: '自然冷却模式', labelEn: 'Natural Cooling', desc: '冷却水→水盘管，压缩机关闭' },
                        { key: 'mechanical', label: '机械制冷模式', labelEn: 'Mechanical Cooling', desc: '冷却水旁通→冷凝器，压缩机运行' },
                        { key: 'hybrid', label: '混合模式', labelEn: 'Hybrid Mode', desc: '冷却水分流，压缩机部分负荷' },
                    ].map(m => (
                        <button
                            key={m.key}
                            onClick={() => setMode(m.key as typeof mode)}
                            className="flex-1 p-3 rounded-lg border text-left transition-all"
                            style={{
                                backgroundColor: mode === m.key ? COLORS.surface : COLORS.background,
                                borderColor: mode === m.key ? COLORS.coolingWater : COLORS.border,
                            }}
                        >
                            <div className="text-sm font-bold" style={{ color: mode === m.key ? COLORS.coolingWater : COLORS.text }}>{m.label}</div>
                            <div className="text-xs" style={{ color: COLORS.textDim }}>{m.labelEn}</div>
                            <div className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{m.desc}</div>
                        </button>
                    ))}
                </div>

                {/* 控制滑块面板 Control Panel */}
                <div className="md:w-1/3 p-4 rounded-lg border shadow-sm flex flex-col gap-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                    {/* 送风设定温度滑块 */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <div className="text-sm font-bold" style={{ color: COLORS.text }}>送风设定温度 (Supply Setpoint)</div>
                            </div>
                            <div className="text-xl font-bold font-mono" style={{ color: COLORS.airflow }}>
                                {supplyTempSet.toFixed(1)}<span className="text-xs ml-1 text-gray-500">°C</span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="15"
                            max="30"
                            step="0.5"
                            value={supplyTempSet}
                            onChange={(e) => setSupplyTempSet(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                        <div className="flex justify-between text-xs mt-0.5 text-gray-500 font-mono">
                            <span>15</span>
                            <span>22.5</span>
                            <span>30</span>
                        </div>
                    </div>
                    {/* 热负荷滑块 */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <div className="text-sm font-bold" style={{ color: COLORS.text }}>机房热负荷 (IT Load)</div>
                            </div>
                            <div className="text-xl font-bold font-mono" style={{ color: '#ef4444' }}>
                                {heatLoad}<span className="text-xs ml-1 text-gray-500">kW</span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="200"
                            step="5"
                            value={heatLoad}
                            onChange={(e) => setHeatLoad(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                        <div className="flex justify-between text-xs mt-0.5 text-gray-500 font-mono">
                            <span>0</span>
                            <span>100</span>
                            <span>200</span>
                        </div>
                    </div>
                    {/* 进水温度滑块 */}
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <div className="text-sm font-bold" style={{ color: COLORS.text }}>进水温度 (CW Inlet)</div>
                            </div>
                            <div className="text-xl font-bold font-mono" style={{ color: COLORS.coolingWater }}>
                                {cwInletTemp}<span className="text-xs ml-1 text-gray-500">°C</span>
                            </div>
                        </div>
                        <input
                            type="range"
                            min="5"
                            max="40"
                            step="0.5"
                            value={cwInletTemp}
                            onChange={(e) => setCwInletTemp(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-xs mt-0.5 text-gray-500 font-mono">
                            <span>5</span>
                            <span>20</span>
                            <span>40</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 状态栏 Dashboard (Modern SCADA Redesign) */}
            <div className="mt-5 bg-opacity-50 rounded-xl border p-4 shadow-lg backdrop-blur-sm" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.text }}>系统实时监测 (Real-time Telemetry)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 空气侧 Air Side */}
                    <div className="space-y-3 lg:col-span-2">
                        <div className="text-xs uppercase tracking-wider font-semibold border-b pb-1" style={{ color: COLORS.airflow, borderColor: COLORS.border }}>空气侧参数 Air Side</div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.airflow }}
                                onClick={() => setActiveChart('supplyAirTemp')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>送风温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.airflow }}>{data.supplyAirTemp.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.suction }}
                                onClick={() => setActiveChart('returnAirTemp')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>回风温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.suction }}>{data.returnAirTemp.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#ef4444' }}
                                onClick={() => setActiveChart('hotAisleTemp')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>热通道温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#ef4444' }}>{data.hotAisleTemp.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 水侧 Water Side */}
                    <div className="space-y-3">
                        <div className="text-xs uppercase tracking-wider font-semibold border-b pb-1" style={{ color: COLORS.coolingWater, borderColor: COLORS.border }}>水侧参数 Water Side</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.coolingWater }}
                                onClick={() => setActiveChart('coolingWaterIn')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>进水温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.coolingWater }}>{data.coolingWaterIn.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.coolingWaterOut }}
                                onClick={() => setActiveChart('coolingWaterOut')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>出水温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.coolingWaterOut }}>{data.coolingWaterOut.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 执行机构 Actuators */}
                    <div className="space-y-3">
                        <div className="text-xs uppercase tracking-wider font-semibold border-b pb-1" style={{ color: COLORS.equipment, borderColor: COLORS.border }}>执行机构 Actuators</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.textMuted }}
                                onClick={() => setActiveChart('bypassValveOpening')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>旁通阀开度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.coolingWater }}>{data.bypassValveOpening.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.textMuted }}
                                onClick={() => setActiveChart('highPressureValveOpening')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>二通阀开度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.coolingWaterHot }}>{data.highPressureValveOpening.toFixed(2)}</span>
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 制冷量参数 Cooling Capacity */}
                    <div className="space-y-3 lg:col-span-2">
                        <div className="text-xs uppercase tracking-wider font-semibold border-b pb-1" style={{ color: '#22d3ee', borderColor: COLORS.border }}>制冷量参数 Cooling Capacity</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#22d3ee' }}
                                onClick={() => setActiveChart('totalCooling')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>总制冷量</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#22d3ee' }}>{data.totalCooling.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">kW</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.coolingWater }}
                                onClick={() => setActiveChart('naturalCooling')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>自然冷却量</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.coolingWater }}>{data.naturalCooling.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">kW</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.lowPressure }}
                                onClick={() => setActiveChart('dxCooling')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>DX制冷量</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.lowPressure }}>{data.dxCooling.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">kW</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#f43f5e' }}
                                onClick={() => setActiveChart('cfcDemand')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>CFC需求</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#f43f5e' }}>{data.cfcDemand.toFixed(0)}</span>
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 设备运行参数 Equipment Status */}
                    <div className="space-y-3 lg:col-span-2">
                        <div className="text-xs uppercase tracking-wider font-semibold border-b pb-1" style={{ color: '#a78bfa', borderColor: COLORS.border }}>设备运行参数 Equipment Status</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#a78bfa' }}
                                onClick={() => setActiveChart('fanSpeed')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>风机转速</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#a78bfa' }}>{data.fanSpeed.toFixed(0)}</span>
                                    <span className="text-xs text-gray-500">RPM</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.highPressure }}
                                onClick={() => setActiveChart('compHz')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>压缩机频率</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.highPressure }}>{data.compHz.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">Hz</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between border-l-2"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.coolingWater }}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>压缩机台数</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono" style={{ color: COLORS.coolingWater }}>{data.activeCompressors}</span>
                                    <span className="text-xs text-gray-500">/4</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between border-l-2"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.airflow }}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>有效模式</span>
                                <div className="text-sm font-bold mt-2" style={{ color: COLORS.airflow }}>
                                    {data.effectiveMode === 'natural' ? '自然冷却' : data.effectiveMode === 'hybrid' ? '混合模式' : '机械制冷'}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            <span className="text-xs px-2 py-1 rounded border" style={{
                                color: data.lowLoadMode ? '#facc15' : COLORS.textDim,
                                borderColor: data.lowLoadMode ? '#facc15' : COLORS.border,
                                backgroundColor: COLORS.background
                            }}>
                                低负载: {data.lowLoadMode ? 'ON' : 'OFF'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded border" style={{
                                color: data.dehumidifying ? '#38bdf8' : COLORS.textDim,
                                borderColor: data.dehumidifying ? '#38bdf8' : COLORS.border,
                                backgroundColor: COLORS.background
                            }}>
                                除湿: {data.dehumidifying ? 'ON' : 'OFF'}
                            </span>
                            <span className="text-xs px-2 py-1 rounded border" style={{
                                color: data.emergencyCooling ? '#ef4444' : COLORS.textDim,
                                borderColor: data.emergencyCooling ? '#ef4444' : COLORS.border,
                                backgroundColor: COLORS.background
                            }}>
                                应急制冷: {data.emergencyCooling ? 'ON' : 'OFF'}
                            </span>
                        </div>
                    </div>

                    {/* 压缩机参数 Compressor Parameters */}
                    <div className="space-y-3 lg:col-span-4">
                        <div className="text-xs uppercase tracking-wider font-semibold border-b pb-1" style={{ color: '#f59e0b', borderColor: COLORS.border }}>压缩机参数 Compressor Parameters</div>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#facc15' }}
                                onClick={() => setActiveChart('eevOpening')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>EEV开度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#facc15' }}>{data.eev1Opening.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">%</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.highPressure }}
                                onClick={() => setActiveChart('highPressure')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>高压压力</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.highPressure }}>{data.highPressure.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">Bar</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: COLORS.lowPressure }}
                                onClick={() => setActiveChart('lowPressure')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>低压压力</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: COLORS.lowPressure }}>{data.lowPressure.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">Bar</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#38bdf8' }}
                                onClick={() => setActiveChart('evapTemp')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>蒸发温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#38bdf8' }}>{data.evapTemp.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#fb923c' }}
                                onClick={() => setActiveChart('condTemp')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>冷凝温度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#fb923c' }}>{data.condTemp.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">°C</span>
                                </div>
                            </div>
                            <div className="relative z-50 p-3 rounded flex flex-col justify-between cursor-pointer hover:brightness-125 transition-all border-l-2 pointer-events-auto group"
                                style={{ backgroundColor: COLORS.background, borderColor: '#f87171' }}
                                onClick={() => setActiveChart('superheat')}>
                                <span className="text-xs" style={{ color: COLORS.textDim }}>过热度</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-2xl font-black font-mono group-hover:underline decoration-2 underline-offset-4" style={{ color: '#f87171' }}>{data.superheat.toFixed(1)}</span>
                                    <span className="text-xs text-gray-500">K</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 图表弹窗 */}
            {renderChartModal()}
        </div >
    );
}
