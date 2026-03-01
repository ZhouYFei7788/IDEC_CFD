import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const uiClamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type SeriesKey =
    | 'supplyAirTemp'
    | 'returnAirTemp'
    | 'hotAisleTemp'
    | 'coolingWaterIn'
    | 'coolingWaterOut'
    | 'cfcDemand'
    | 'totalCooling'
    | 'naturalCooling'
    | 'dxCooling'
    | 'fanSpeed'
    | 'compHz'
    | 'highPressure'
    | 'lowPressure'
    | 'evapTemp'
    | 'condTemp';

type ChartPreset = 'air' | 'water' | 'capacity' | 'refrigerant' | 'custom';
type SectionKey = 'air' | 'water' | 'capacity' | 'actuator' | 'runtime' | 'compressor';
type AxisId = 'temp' | 'cooling' | 'pressure' | 'percent' | 'speed';
type ExportFormat = 'json' | 'excel';

const SERIES_META: Record<SeriesKey, { label: string; unit: string; color: string; axis: AxisId }> = {
    supplyAirTemp: { label: '送风温度', unit: '°C', color: COLORS.airflow, axis: 'temp' },
    returnAirTemp: { label: '回风温度', unit: '°C', color: COLORS.suction, axis: 'temp' },
    hotAisleTemp: { label: '热通道温度', unit: '°C', color: '#ef4444', axis: 'temp' },
    coolingWaterIn: { label: '进水温度', unit: '°C', color: COLORS.coolingWater, axis: 'temp' },
    coolingWaterOut: { label: '出水温度', unit: '°C', color: COLORS.coolingWaterOut, axis: 'temp' },
    cfcDemand: { label: 'CFC需求', unit: '%', color: '#f43f5e', axis: 'percent' },
    totalCooling: { label: '总制冷量', unit: 'kW', color: '#22d3ee', axis: 'cooling' },
    naturalCooling: { label: '自然冷却量', unit: 'kW', color: COLORS.coolingWater, axis: 'cooling' },
    dxCooling: { label: 'DX制冷量', unit: 'kW', color: COLORS.lowPressure, axis: 'cooling' },
    fanSpeed: { label: '风机转速', unit: 'RPM', color: '#a78bfa', axis: 'speed' },
    compHz: { label: '压缩机频率', unit: 'Hz', color: COLORS.highPressure, axis: 'speed' },
    highPressure: { label: '高压', unit: 'Bar', color: COLORS.highPressure, axis: 'pressure' },
    lowPressure: { label: '低压', unit: 'Bar', color: COLORS.lowPressure, axis: 'pressure' },
    evapTemp: { label: '蒸发温度', unit: '°C', color: '#38bdf8', axis: 'temp' },
    condTemp: { label: '冷凝温度', unit: '°C', color: '#fb923c', axis: 'temp' },
};

const ALL_SERIES = Object.keys(SERIES_META) as SeriesKey[];

const PRESET_SERIES: Record<Exclude<ChartPreset, 'custom'>, SeriesKey[]> = {
    air: ['supplyAirTemp', 'returnAirTemp', 'hotAisleTemp'],
    water: ['coolingWaterIn', 'coolingWaterOut'],
    capacity: ['totalCooling', 'naturalCooling', 'dxCooling', 'cfcDemand'],
    refrigerant: ['highPressure', 'lowPressure', 'evapTemp', 'condTemp'],
};

const createSeriesSelection = (enabledKeys: SeriesKey[]) =>
    ALL_SERIES.reduce((acc, key) => {
        acc[key] = enabledKeys.includes(key);
        return acc;
    }, {} as Record<SeriesKey, boolean>);

const RingGauge: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const radius = 12;
    const circumference = 2 * Math.PI * radius;
    const normalizedValue = uiClamp(value, 0, 100);
    const dashOffset = circumference * (1 - normalizedValue / 100);
    return (
        <svg width="30" height="30" viewBox="0 0 30 30">
            <circle cx="15" cy="15" r={radius} fill="none" stroke={COLORS.border} strokeWidth="3" />
            <motion.circle
                cx="15"
                cy="15"
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={false}
                animate={{ strokeDashoffset: dashOffset }}
                transform="rotate(-90 15 15)"
                transition={{ duration: 0.4 }}
            />
        </svg>
    );
};

const TempBarIcon: React.FC<{ value: number; color: string }> = ({ value, color }) => {
    const fill = uiClamp((value - 10) / 30, 0.05, 1);
    return (
        <div className="w-4 h-8 rounded border relative overflow-hidden" style={{ borderColor: COLORS.border }}>
            <motion.div
                className="absolute bottom-0 left-0 right-0"
                style={{ backgroundColor: color }}
                initial={false}
                animate={{ height: `${fill * 100}%`, opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
};

const ModeFlowIcon: React.FC<{ mode: 'natural' | 'mechanical' | 'hybrid' }> = ({ mode }) => {
    const activeIdx = mode === 'natural' ? 0 : mode === 'hybrid' ? 1 : 2;
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((idx) => (
                <motion.span
                    key={idx}
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: idx <= activeIdx ? COLORS.airflow : COLORS.border }}
                    animate={idx === activeIdx ? { scale: [1, 1.25, 1] } : {}}
                    transition={{ duration: 1.2, repeat: Infinity }}
                />
            ))}
        </div>
    );
};

const CoolingSpinIcon: React.FC<{ color: string }> = ({ color }) => (
    <motion.div
        className="text-sm font-bold"
        style={{ color }}
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
        ✦
    </motion.div>
);

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
        // 减少轨迹与粒子数量以降低每帧重绘负载
        for (let i = 0; i < 3; i++) {
            const yOffset = (i - 1) * 16;
            const y = fanY + yOffset;
            const isLight = i % 2 === 0;

            for (let j = 0; j < 2; j++) {
                const delay = j * 1.2 + (((fanIndex * 7) + (i * 13) + (j * 17)) % 10) / 10 * 0.6;
                const duration = 5 + (((fanIndex * 11) + (i * 19) + (j * 23)) % 10) / 10;

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

    const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
        air: true,
        water: true,
        capacity: true,
        actuator: false,
        runtime: false,
        compressor: false,
    });
    const [selectedSeries, setSelectedSeries] = useState<Record<SeriesKey, boolean>>(
        createSeriesSelection(['supplyAirTemp', 'returnAirTemp', 'coolingWaterIn', 'coolingWaterOut', 'cfcDemand'])
    );
    const [chartPreset, setChartPreset] = useState<ChartPreset>('custom');
    const [modalSeries, setModalSeries] = useState<SeriesKey | null>(null);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

    const toggleSection = (sectionKey: SectionKey) => {
        setExpandedSections((prev) => ({ ...prev, [sectionKey]: !prev[sectionKey] }));
    };

    const toggleSeries = (seriesKey: SeriesKey) => {
        setChartPreset('custom');
        setSelectedSeries((prev) => ({ ...prev, [seriesKey]: !prev[seriesKey] }));
    };

    const openSeriesModal = (seriesKey: SeriesKey) => {
        setModalSeries(seriesKey);
    };

    const applyPreset = (preset: Exclude<ChartPreset, 'custom'>) => {
        setChartPreset(preset);
        setSelectedSeries(createSeriesSelection(PRESET_SERIES[preset]));
    };

    const roundExportNumbers = (value: any): any => {
        if (typeof value === 'number') {
            return Number(value.toFixed(2));
        }
        if (Array.isArray(value)) {
            return value.map(roundExportNumbers);
        }
        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, innerValue]) => [key, roundExportNumbers(innerValue)])
            );
        }
        return value;
    };

    const escapeCsvValue = (value: unknown) => {
        const text = value === null || value === undefined ? '' : String(value);
        if (/[",\n]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    };

    const buildExcelCsv = (payload: Record<string, any>) => {
        const lines: string[] = [];
        const addSection = (title: string, source: Record<string, any>) => {
            lines.push(title);
            lines.push('字段,数值');
            Object.entries(source).forEach(([key, value]) => {
                lines.push(`${escapeCsvValue(key)},${escapeCsvValue(value)}`);
            });
            lines.push('');
        };

        lines.push(`导出时间,${escapeCsvValue(payload.exportedAt)}`);
        lines.push('');
        addSection('控制输入 controlInputs', payload.controlInputs ?? {});
        addSection('实时状态 realtimeState', payload.realtimeState ?? {});

        if (payload.latestHistoryPoint) {
            addSection('最新历史点 latestHistoryPoint', payload.latestHistoryPoint);
        }

        const historyRows = Array.isArray(payload.recentHistory) ? payload.recentHistory : [];
        if (historyRows.length > 0) {
            const headers = Object.keys(historyRows[0]);
            lines.push('历史序列 recentHistory');
            lines.push(headers.map(escapeCsvValue).join(','));
            historyRows.forEach((row: Record<string, any>) => {
                lines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
            });
            lines.push('');
        }

        return `\uFEFF${lines.join('\n')}`;
    };

    const exportCurrentParameters = () => {
        const now = new Date();
        const exportPayload = roundExportNumbers({
            exportedAt: now.toISOString(),
            controlInputs: {
                mode,
                heatLoad,
                supplyTempSet,
                cwInletTemp,
            },
            realtimeState: {
                ...data,
                fanFrequencyHz: Number((data.fanSpeed / 60).toFixed(2)),
            },
            latestHistoryPoint: history.length > 0 ? history[history.length - 1] : null,
            recentHistory: history,
        });

        const fileStamp = now.toISOString().replace(/[:.]/g, '-');
        let blob: Blob;
        let fileName: string;

        if (exportFormat === 'excel') {
            blob = new Blob([buildExcelCsv(exportPayload)], {
                type: 'text/csv;charset=utf-8',
            });
            fileName = `dual-cold-source-params-${fileStamp}.csv`;
        } else {
            blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
                type: 'application/json;charset=utf-8',
            });
            fileName = `dual-cold-source-params-${fileStamp}.json`;
        }

        const exportUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = exportUrl;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(exportUrl);
    };

    const renderMetricCard = (
        label: string,
        value: string,
        unit: string,
        color: string,
        seriesKey?: SeriesKey
    ) => (
        <button
            type="button"
            className="relative text-left rounded-md border px-3 py-2 transition-colors"
            style={{
                backgroundColor: COLORS.background,
                borderColor: COLORS.border,
                cursor: seriesKey ? 'pointer' : 'default',
            }}
            onClick={seriesKey ? () => openSeriesModal(seriesKey) : undefined}
        >
            <span className="absolute left-0 top-0 h-full w-[2px] rounded-l-md" style={{ backgroundColor: color }} />
            <div className="text-[11px]" style={{ color: COLORS.textDim }}>{label}</div>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono" style={{ color }}>{value}</span>
                <span className="text-xs text-gray-500">{unit}</span>
            </div>
            {seriesKey && (
                <div className="mt-1 text-[10px]" style={{ color: COLORS.textDim }}>
                    点击查看趋势弹窗
                </div>
            )}
        </button>
    );

    const renderSection = (
        sectionKey: SectionKey,
        title: string,
        summary: string,
        color: string,
        content: React.ReactNode
    ) => (
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.surface }}>
            <button
                type="button"
                className="w-full flex items-center justify-between gap-3 text-left"
                onClick={() => toggleSection(sectionKey)}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span className="h-4 w-[2px] rounded" style={{ backgroundColor: color }} />
                    <span className="text-sm font-bold" style={{ color: COLORS.text }}>{title}</span>
                </div>
                <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs truncate" style={{ color: COLORS.textMuted }}>{summary}</span>
                    <span className="text-sm" style={{ color: COLORS.textDim }}>{expandedSections[sectionKey] ? '▾' : '▸'}</span>
                </div>
            </button>
            <AnimatePresence initial={false}>
                {expandedSections[sectionKey] && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 pt-2 border-t" style={{ borderColor: COLORS.border }}>
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const activeSeries = ALL_SERIES.filter((seriesKey) => selectedSeries[seriesKey]);
    const axisUsage = activeSeries.reduce((acc, seriesKey) => {
        acc[SERIES_META[seriesKey].axis] = true;
        return acc;
    }, { temp: false, cooling: false, pressure: false, percent: false, speed: false } as Record<AxisId, boolean>);
    const rightAxisFamilies = (['percent', 'pressure', 'cooling', 'speed'] as AxisId[]).filter((axis) => axisUsage[axis]);
    const primaryRightAxis = axisUsage.percent
        ? 'percent'
        : axisUsage.pressure
            ? 'pressure'
            : axisUsage.cooling
                ? 'cooling'
                : axisUsage.speed
                    ? 'speed'
                    : null;
    const modeLabel = data.effectiveMode === 'natural' ? '自然冷却' : data.effectiveMode === 'hybrid' ? '混合模式' : '机械制冷';
    const modeColor = data.effectiveMode === 'natural' ? COLORS.coolingWater : data.effectiveMode === 'hybrid' ? '#f59e0b' : COLORS.highPressure;
    const cfcColor = data.cfcDemand >= 75 ? '#f43f5e' : data.cfcDemand >= 45 ? '#f59e0b' : '#22c55e';

    const renderValveRow = (label: string, value: number, color: string) => (
        <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
            <div className="flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: COLORS.textMuted }}>{label}</span>
                <span className="font-mono" style={{ color }}>{value.toFixed(2)}%</span>
            </div>
            <div className="h-1.5 rounded overflow-hidden" style={{ backgroundColor: COLORS.border }}>
                <motion.div
                    className="h-full"
                    style={{ backgroundColor: color }}
                    initial={false}
                    animate={{ width: `${uiClamp(value, 0, 100)}%` }}
                    transition={{ duration: 0.35 }}
                />
            </div>
        </div>
    );

    const renderKpiStrip = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            <button
                type="button"
                className="rounded-md border px-3 py-2 text-left"
                style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}
                onClick={() => openSeriesModal('supplyAirTemp')}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: COLORS.textDim }}>送风温度</span>
                    <TempBarIcon value={data.supplyAirTemp} color={COLORS.airflow} />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono" style={{ color: COLORS.airflow }}>{data.supplyAirTemp.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">°C</span>
                </div>
                <div className="mt-1 text-[10px]" style={{ color: COLORS.textDim }}>
                    点击查看趋势弹窗
                </div>
            </button>

            <button
                type="button"
                className="rounded-md border px-3 py-2 text-left"
                style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}
                onClick={() => openSeriesModal('returnAirTemp')}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: COLORS.textDim }}>回风温度</span>
                    <TempBarIcon value={data.returnAirTemp} color={COLORS.suction} />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono" style={{ color: COLORS.suction }}>{data.returnAirTemp.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">°C</span>
                </div>
                <div className="mt-1 text-[10px]" style={{ color: COLORS.textDim }}>
                    点击查看趋势弹窗
                </div>
            </button>

            <button
                type="button"
                className="rounded-md border px-3 py-2 text-left"
                style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}
                onClick={() => openSeriesModal('cfcDemand')}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: COLORS.textDim }}>CFC需求</span>
                    <RingGauge value={data.cfcDemand} color={cfcColor} />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono" style={{ color: cfcColor }}>{data.cfcDemand.toFixed(0)}</span>
                    <span className="text-xs text-gray-500">%</span>
                </div>
                <div className="mt-1 text-[10px]" style={{ color: COLORS.textDim }}>
                    点击查看趋势弹窗
                </div>
            </button>

            <div className="rounded-md border px-3 py-2 text-left" style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}>
                <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: COLORS.textDim }}>有效模式</span>
                    <ModeFlowIcon mode={data.effectiveMode} />
                </div>
                <div className="mt-2 text-lg font-black" style={{ color: modeColor }}>{modeLabel}</div>
                <div className="mt-1 text-[10px]" style={{ color: COLORS.textDim }}>
                    压缩机 {data.activeCompressors}/4
                </div>
            </div>

            <button
                type="button"
                className="rounded-md border px-3 py-2 text-left"
                style={{ backgroundColor: COLORS.background, borderColor: COLORS.border }}
                onClick={() => openSeriesModal('totalCooling')}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: COLORS.textDim }}>总制冷量</span>
                    <CoolingSpinIcon color="#22d3ee" />
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono" style={{ color: '#22d3ee' }}>{data.totalCooling.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">kW</span>
                </div>
                <div className="mt-1 text-[10px]" style={{ color: COLORS.textDim }}>
                    点击查看趋势弹窗
                </div>
            </button>
        </div>
    );

    const renderCollapsibleSections = () => (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
            {renderSection(
                'air',
                '空气侧参数',
                `送风 ${data.supplyAirTemp.toFixed(1)}°C · 回风 ${data.returnAirTemp.toFixed(1)}°C`,
                COLORS.airflow,
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {renderMetricCard('送风温度', data.supplyAirTemp.toFixed(1), '°C', COLORS.airflow, 'supplyAirTemp')}
                    {renderMetricCard('回风温度', data.returnAirTemp.toFixed(1), '°C', COLORS.suction, 'returnAirTemp')}
                    {renderMetricCard('热通道温度', data.hotAisleTemp.toFixed(1), '°C', '#ef4444', 'hotAisleTemp')}
                </div>
            )}

            {renderSection(
                'water',
                '水侧参数',
                `进水 ${data.coolingWaterIn.toFixed(1)}°C · 出水 ${data.coolingWaterOut.toFixed(1)}°C`,
                COLORS.coolingWater,
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderMetricCard('进水温度', data.coolingWaterIn.toFixed(1), '°C', COLORS.coolingWater, 'coolingWaterIn')}
                    {renderMetricCard('出水温度', data.coolingWaterOut.toFixed(1), '°C', COLORS.coolingWaterOut, 'coolingWaterOut')}
                </div>
            )}

            {renderSection(
                'capacity',
                '冷却能力',
                `总冷量 ${data.totalCooling.toFixed(1)} kW · CFC ${data.cfcDemand.toFixed(0)}%`,
                '#22d3ee',
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {renderMetricCard('总制冷量', data.totalCooling.toFixed(1), 'kW', '#22d3ee', 'totalCooling')}
                    {renderMetricCard('自然冷却量', data.naturalCooling.toFixed(1), 'kW', COLORS.coolingWater, 'naturalCooling')}
                    {renderMetricCard('DX制冷量', data.dxCooling.toFixed(1), 'kW', COLORS.lowPressure, 'dxCooling')}
                    {renderMetricCard('CFC需求', data.cfcDemand.toFixed(0), '%', cfcColor, 'cfcDemand')}
                </div>
            )}

            {renderSection(
                'actuator',
                '执行器',
                `二通阀 ${data.highPressureValveOpening.toFixed(1)}% · 旁通阀 ${data.bypassValveOpening.toFixed(1)}%`,
                '#94a3b8',
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {renderValveRow('旁通阀门开度', data.bypassValveOpening, COLORS.coolingWater)}
                    {renderValveRow('二通阀门开度', data.highPressureValveOpening, COLORS.coolingWaterHot)}
                </div>
            )}

            {renderSection(
                'runtime',
                '运行状态',
                `风机 ${data.fanSpeed.toFixed(0)} RPM (${(data.fanSpeed / 60).toFixed(2)}Hz) · 压缩机 ${data.compHz.toFixed(1)} Hz`,
                '#a78bfa',
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {renderMetricCard('风机转速', data.fanSpeed.toFixed(0), 'RPM', '#a78bfa', 'fanSpeed')}
                        <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                            <div className="text-xs" style={{ color: COLORS.textDim }}>风机频率</div>
                            <div className="mt-1 text-xl font-black font-mono" style={{ color: '#8b5cf6' }}>{(data.fanSpeed / 60).toFixed(2)} <span className="text-xs text-gray-500">Hz</span></div>
                        </div>
                        {renderMetricCard('压缩机频率', data.compHz.toFixed(1), 'Hz', COLORS.highPressure, 'compHz')}
                        <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                            <div className="text-xs" style={{ color: COLORS.textDim }}>压缩机台数</div>
                            <div className="mt-1 text-xl font-black font-mono" style={{ color: COLORS.coolingWater }}>{data.activeCompressors}<span className="text-xs text-gray-500">/4</span></div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { label: '低负载', active: data.lowLoadMode, color: '#facc15' },
                            { label: '除湿', active: data.dehumidifying, color: '#38bdf8' },
                            { label: '应急制冷', active: data.emergencyCooling, color: '#ef4444' }
                        ].map((badge) => (
                            <span
                                key={badge.label}
                                className="px-2 py-1 rounded border text-xs"
                                style={{
                                    color: badge.active ? badge.color : COLORS.textDim,
                                    borderColor: badge.active ? badge.color : COLORS.border,
                                    backgroundColor: COLORS.background
                                }}
                            >
                                {badge.label}: {badge.active ? 'ON' : 'OFF'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {renderSection(
                'compressor',
                '压缩机参数',
                `高压 ${data.highPressure.toFixed(1)} Bar · 低压 ${data.lowPressure.toFixed(1)} Bar`,
                '#f59e0b',
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                        <div className="text-xs" style={{ color: COLORS.textDim }}>EEV开度</div>
                        <div className="mt-1 text-xl font-black font-mono" style={{ color: '#facc15' }}>{data.eev1Opening.toFixed(1)} <span className="text-xs text-gray-500">%</span></div>
                    </div>
                    {renderMetricCard('高压', data.highPressure.toFixed(1), 'Bar', COLORS.highPressure, 'highPressure')}
                    {renderMetricCard('低压', data.lowPressure.toFixed(1), 'Bar', COLORS.lowPressure, 'lowPressure')}
                    {renderMetricCard('蒸发温度', data.evapTemp.toFixed(1), '°C', '#38bdf8', 'evapTemp')}
                    {renderMetricCard('冷凝温度', data.condTemp.toFixed(1), '°C', '#fb923c', 'condTemp')}
                    <div className="rounded-md border px-3 py-2" style={{ borderColor: COLORS.border, backgroundColor: COLORS.background }}>
                        <div className="text-xs" style={{ color: COLORS.textDim }}>过热度</div>
                        <div className="mt-1 text-xl font-black font-mono" style={{ color: '#f87171' }}>{data.superheat.toFixed(1)} <span className="text-xs text-gray-500">K</span></div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderChartTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) {
            return null;
        }

        return (
            <div className="rounded-md border px-3 py-2 text-xs shadow-lg" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <div className="mb-1 font-semibold" style={{ color: COLORS.text }}>{label}</div>
                {payload.map((item: any) => {
                    const dataKey = item?.dataKey as SeriesKey | undefined;
                    if (!dataKey || !SERIES_META[dataKey]) {
                        return null;
                    }
                    return (
                        <div key={dataKey} className="flex items-center justify-between gap-4">
                            <span style={{ color: item.color }}>{SERIES_META[dataKey].label}</span>
                            <span className="font-mono" style={{ color: COLORS.text }}>
                                {Number(item.value).toFixed(1)} {SERIES_META[dataKey].unit}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderUnifiedTrendChart = () => (
        <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { key: 'air', label: '空气' },
                        { key: 'water', label: '水侧' },
                        { key: 'capacity', label: '冷量' },
                        { key: 'refrigerant', label: '制冷剂' },
                    ].map((preset) => (
                        <button
                            key={preset.key}
                            type="button"
                            className="px-2.5 py-1 rounded-md border text-xs transition-colors"
                            style={{
                                borderColor: chartPreset === preset.key ? COLORS.airflow : COLORS.border,
                                color: chartPreset === preset.key ? COLORS.airflow : COLORS.textMuted,
                                backgroundColor: COLORS.background
                            }}
                            onClick={() => applyPreset(preset.key as Exclude<ChartPreset, 'custom'>)}
                        >
                            {preset.label}
                        </button>
                    ))}
                    <span className="text-xs ml-1" style={{ color: COLORS.textDim }}>
                        当前预设: {chartPreset === 'custom' ? '自定义' : chartPreset === 'air' ? '空气' : chartPreset === 'water' ? '水侧' : chartPreset === 'capacity' ? '冷量' : '制冷剂'}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2">
                    {ALL_SERIES.map((seriesKey) => (
                        <button
                            key={seriesKey}
                            type="button"
                            className="px-2.5 py-1 rounded-md border text-xs transition-colors"
                            style={{
                                borderColor: selectedSeries[seriesKey] ? SERIES_META[seriesKey].color : COLORS.border,
                                color: selectedSeries[seriesKey] ? SERIES_META[seriesKey].color : COLORS.textDim,
                                backgroundColor: COLORS.background
                            }}
                            onClick={() => toggleSeries(seriesKey)}
                        >
                            {SERIES_META[seriesKey].label}
                        </button>
                    ))}
                </div>

                {rightAxisFamilies.length > 1 && (
                    <div className="text-[11px]" style={{ color: '#f59e0b' }}>
                        当前自定义选择含多种非温度单位，右轴仅显示主单位，请优先使用分组预设避免误读。
                    </div>
                )}

                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} opacity={0.35} />
                            <XAxis dataKey="time" stroke={COLORS.textDim} tick={{ fill: COLORS.textDim, fontSize: 11 }} minTickGap={28} />
                            <YAxis
                                yAxisId="temp"
                                stroke={COLORS.textMuted}
                                tick={{ fill: COLORS.textDim, fontSize: 11 }}
                                hide={!axisUsage.temp}
                                domain={[(min: number) => Math.floor(min - 2), (max: number) => Math.ceil(max + 2)]}
                            />
                            <YAxis
                                yAxisId="cooling"
                                orientation="right"
                                stroke="#22d3ee"
                                tick={{ fill: '#22d3ee', fontSize: 11 }}
                                hide={primaryRightAxis !== 'cooling'}
                                domain={[0, (max: number) => Math.max(20, Math.ceil(max * 1.15))]}
                            />
                            <YAxis
                                yAxisId="pressure"
                                orientation="right"
                                stroke={COLORS.highPressure}
                                tick={{ fill: COLORS.highPressure, fontSize: 11 }}
                                hide={primaryRightAxis !== 'pressure'}
                                domain={[(min: number) => Math.floor(min - 1), (max: number) => Math.ceil(max + 1)]}
                            />
                            <YAxis
                                yAxisId="percent"
                                orientation="right"
                                stroke="#f43f5e"
                                tick={{ fill: '#f43f5e', fontSize: 11 }}
                                hide={primaryRightAxis !== 'percent'}
                                domain={[0, 100]}
                            />
                            <YAxis
                                yAxisId="speed"
                                orientation="right"
                                stroke="#a78bfa"
                                tick={{ fill: '#a78bfa', fontSize: 11 }}
                                hide={primaryRightAxis !== 'speed'}
                                domain={[(min: number) => Math.floor(Math.max(0, min - 5)), (max: number) => Math.ceil(max + 5)]}
                            />
                            <Tooltip content={renderChartTooltip} />
                            {activeSeries.map((seriesKey) => (
                                <Line
                                    key={seriesKey}
                                    type="monotone"
                                    dataKey={seriesKey}
                                    yAxisId={SERIES_META[seriesKey].axis}
                                    stroke={SERIES_META[seriesKey].color}
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );

    const renderSeriesModal = () => {
        if (!modalSeries) {
            return null;
        }

        const meta = SERIES_META[modalSeries];
        const latestValue = history.length > 0 ? history[history.length - 1][modalSeries] : 0;

        return (
            <div
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-[1px] p-4 flex items-center justify-center"
                onClick={() => setModalSeries(null)}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-4xl rounded-xl border p-4"
                    style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                            <div className="text-xs" style={{ color: COLORS.textDim }}>参数趋势</div>
                            <div className="text-lg font-bold flex items-baseline gap-2" style={{ color: meta.color }}>
                                {meta.label}
                                <span className="text-sm font-mono" style={{ color: COLORS.text }}>
                                    {latestValue.toFixed(1)} {meta.unit}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="px-2.5 py-1 rounded-md border text-xs"
                            style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
                            onClick={() => setModalSeries(null)}
                        >
                            关闭
                        </button>
                    </div>
                    <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} opacity={0.35} />
                                <XAxis dataKey="time" stroke={COLORS.textDim} tick={{ fill: COLORS.textDim, fontSize: 11 }} minTickGap={24} />
                                <YAxis
                                    stroke={meta.color}
                                    tick={{ fill: meta.color, fontSize: 11 }}
                                    domain={meta.axis === 'percent' ? [0, 100] : ['auto', 'auto']}
                                />
                                <Tooltip content={renderChartTooltip} />
                                <Line
                                    type="monotone"
                                    dataKey={modalSeries}
                                    stroke={meta.color}
                                    strokeWidth={2.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
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
                        const SHOW_AXIS = false; // 关闭辅助线可显著减少绘制开销
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
                                    坐标轴辅助线 (SHOW_AXIS = false)
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
            <div className="mt-3 grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-3">
                <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                    <div className="text-xs mb-2" style={{ color: COLORS.textMuted }}>运行模式切换</div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                            { key: 'auto', label: '自动模式', labelEn: 'Auto' },
                            { key: 'natural', label: '自然冷却', labelEn: 'Natural' },
                            { key: 'mechanical', label: '机械制冷', labelEn: 'Mechanical' },
                            { key: 'hybrid', label: '混合模式', labelEn: 'Hybrid' },
                        ].map(m => (
                            <button
                                key={m.key}
                                onClick={() => setMode(m.key as typeof mode)}
                                className="px-2 py-2 rounded-md border text-left transition-all"
                                style={{
                                    backgroundColor: mode === m.key ? COLORS.background : COLORS.surface,
                                    borderColor: mode === m.key ? COLORS.coolingWater : COLORS.border,
                                }}
                            >
                                <div className="text-xs font-bold" style={{ color: mode === m.key ? COLORS.coolingWater : COLORS.text }}>{m.label}</div>
                                <div className="text-[10px]" style={{ color: COLORS.textDim }}>{m.labelEn}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg border p-3" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-xs" style={{ color: COLORS.textMuted }}>设定参数</div>
                        <div className="flex items-center gap-2">
                            <select
                                value={exportFormat}
                                onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
                                className="px-2 py-1 rounded-md border text-[11px] bg-transparent outline-none"
                                style={{ borderColor: COLORS.border, color: COLORS.textMuted }}
                            >
                                <option value="json" style={{ backgroundColor: COLORS.surface }}>JSON</option>
                                <option value="excel" style={{ backgroundColor: COLORS.surface }}>Excel (CSV)</option>
                            </select>
                            <button
                                type="button"
                                className="px-2 py-1 rounded-md border text-[11px]"
                                style={{ borderColor: COLORS.border, color: COLORS.airflow, backgroundColor: COLORS.background }}
                                onClick={exportCurrentParameters}
                            >
                                导出
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold" style={{ color: COLORS.text }}>送风设定</div>
                                <div className="text-sm font-bold font-mono" style={{ color: COLORS.airflow }}>
                                    {supplyTempSet.toFixed(1)}<span className="text-[10px] ml-1 text-gray-500">°C</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="15"
                                max="30"
                                step="0.5"
                                value={supplyTempSet}
                                onChange={(e) => setSupplyTempSet(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                            <div className="flex justify-between text-[10px] mt-0.5 text-gray-500 font-mono">
                                <span>15</span>
                                <span>22.5</span>
                                <span>30</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold" style={{ color: COLORS.text }}>机房热负荷</div>
                                <div className="text-sm font-bold font-mono" style={{ color: '#ef4444' }}>
                                    {heatLoad}<span className="text-[10px] ml-1 text-gray-500">kW</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                step="5"
                                value={heatLoad}
                                onChange={(e) => setHeatLoad(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <div className="flex justify-between text-[10px] mt-0.5 text-gray-500 font-mono">
                                <span>0</span>
                                <span>100</span>
                                <span>200</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="text-xs font-semibold" style={{ color: COLORS.text }}>进水温度</div>
                                <div className="text-sm font-bold font-mono" style={{ color: COLORS.coolingWater }}>
                                    {cwInletTemp}<span className="text-[10px] ml-1 text-gray-500">°C</span>
                                </div>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="40"
                                step="0.5"
                                value={cwInletTemp}
                                onChange={(e) => setCwInletTemp(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                            <div className="flex justify-between text-[10px] mt-0.5 text-gray-500 font-mono">
                                <span>5</span>
                                <span>20</span>
                                <span>40</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 系统实时监测 Telemetry */}
            <div className="mt-5 rounded-xl border p-4 space-y-4" style={{ backgroundColor: COLORS.surface, borderColor: COLORS.border }}>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: COLORS.airflow }} />
                    <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.text }}>系统实时监测 (Real-time Telemetry)</h2>
                </div>

                {renderKpiStrip()}

                <div className="flex flex-wrap gap-2">
                    {[
                        { label: '低负载', active: data.lowLoadMode, color: '#facc15' },
                        { label: '除湿', active: data.dehumidifying, color: '#38bdf8' },
                        { label: '应急制冷', active: data.emergencyCooling, color: '#ef4444' }
                    ].map((badge) => (
                        <span
                            key={`kpi-${badge.label}`}
                            className="px-2 py-1 rounded border text-xs"
                            style={{
                                color: badge.active ? badge.color : COLORS.textDim,
                                borderColor: badge.active ? badge.color : COLORS.border,
                                backgroundColor: COLORS.background
                            }}
                        >
                            {badge.label}: {badge.active ? 'ON' : 'OFF'}
                        </span>
                    ))}
                </div>

                {renderCollapsibleSections()}

                <div>
                    <div className="text-xs mb-2" style={{ color: COLORS.textMuted }}>关键趋势图（近 60 点采样）</div>
                    {renderUnifiedTrendChart()}
                </div>
            </div>
            {renderSeriesModal()}
        </div >
    );
}
