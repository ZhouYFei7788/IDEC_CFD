import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
    coolingWaterOut: '#eab308',    // 冷却水出水 - yellow (温度升高)
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
}> = ({ x, y, label, labelEn, opening = 50, color, rotation = 0, scale = 1 }) => (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        {/* 阀门图形 - 可旋转 */}
        <g transform={`rotate(${rotation})`}>
            <polygon points="-12,-10 0,0 -12,10" fill={COLORS.equipmentBg} stroke={color} strokeWidth={2} />
            <polygon points="12,-10 0,0 12,10" fill={COLORS.equipmentBg} stroke={color} strokeWidth={2} />
            <circle cx={0} cy={0} r={4} fill={color} />
        </g>
        {/* 文字 - 始终水平 */}
        <text x={0} y={25} textAnchor="middle" fontSize="7" fill={COLORS.text}>{label}</text>
        {labelEn && <text x={0} y={33} textAnchor="middle" fontSize="5" fill={COLORS.textDim}>{labelEn}</text>}
        {opening !== undefined && <text x={25} y={25} textAnchor="start" fontSize="6" fill={color} fontWeight="bold">{opening}%</text>}
    </g>
);

// --- EEV 电子膨胀阀 ---
const EEV: React.FC<{
    x: number;
    y: number;
    label: string;
}> = ({ x, y, label }) => (
    <g transform={`translate(${x}, ${y})`}>
        <rect x={-15} y={-12} width={30} height={24} rx={3} fill={COLORS.equipmentBg} stroke={COLORS.lowPressure} strokeWidth={2} />
        <text x={0} y={4} textAnchor="middle" fontSize="8" fill={COLORS.lowPressure} fontWeight="bold">EEV</text>
        <text x={0} y={22} textAnchor="middle" fontSize="7" fill={COLORS.textDim}>{label}</text>
    </g>
);

// --- 风机 Fan (长方体，x/y为中心点) ---
const Fan: React.FC<{
    x: number;  // 中心点X坐标
    y: number;  // 中心点Y坐标
    width?: number;
    height?: number;
    running?: boolean;
    id: number;
}> = ({ x, y, width = 60, height = 80, running = true, id }) => (
    <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>
        {/* 长方体外框 */}
        <rect x={0} y={0} width={width} height={height} rx={4} fill={COLORS.equipmentBg} stroke={running ? COLORS.coolingWater : COLORS.textDim} strokeWidth={2} />

        {/* 风机叶片动画 */}
        <motion.g
            style={{ transformOrigin: `${width / 2}px ${height / 2}px` }}
            animate={running ? { rotate: 360 } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
            {[0, 72, 144, 216, 288].map(angle => (
                <line
                    key={angle}
                    x1={width / 2}
                    y1={height / 2}
                    x2={width / 2 + 20 * Math.cos(angle * Math.PI / 180)}
                    y2={height / 2 + 20 * Math.sin(angle * Math.PI / 180)}
                    stroke={running ? COLORS.coolingWater : COLORS.textDim}
                    strokeWidth={2}
                    strokeLinecap="round"
                />
            ))}
        </motion.g>

        {/* 中心圆 */}
        <circle cx={width / 2} cy={height / 2} r={6} fill={running ? COLORS.coolingWater : COLORS.textDim} />



        <text x={width / 2} y={height + 14} textAnchor="middle" fontSize="9" fill={COLORS.textMuted}>F{id}</text>
    </g>
);

// --- 主组件 Main Component ---
export default function DualColdSourceAirWall() {
    const [mode, setMode] = useState<'natural' | 'mechanical' | 'hybrid'>('hybrid');
    const [data, setData] = useState({
        compressorActive: true,
        highPressure: 22.5,
        lowPressure: 4.2,
        superheat: 8.5,
        coolingWaterIn: 32,
        coolingWaterOut: 37,
        bypassValveOpening: 40,
        highPressureValveOpening: 65,
        eev1Opening: 45,
        eev2Opening: 48,
        supplyAirTemp: 18,
        returnAirTemp: 26,
    });

    // 模拟数据更新
    useEffect(() => {
        const interval = setInterval(() => {
            setData(prev => ({
                ...prev,
                highPressure: Number((prev.highPressure + (Math.random() - 0.5) * 0.3).toFixed(1)),
                lowPressure: Number((prev.lowPressure + (Math.random() - 0.5) * 0.1).toFixed(2)),
                superheat: Number((prev.superheat + (Math.random() - 0.5) * 0.2).toFixed(1)),
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const isCompressorOn = mode === 'mechanical' || mode === 'hybrid';
    const isWaterCoilActive = mode === 'natural' || mode === 'hybrid';

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
                    <Valve x={550} y={580} label="旁通阀" opening={100} color={COLORS.coolingWater} />

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
                    </g>

                    {/* 板换出水管路：板换上边长靠右(420, 260) → (420, 30) → (100, 30) */}
                    <AnimatedPipe d="M 420 260 L 420 30" color={COLORS.coolingWaterHot} strokeWidth={3} />
                    <AnimatedPipe d="M 420 30 L 100 30" color={COLORS.coolingWaterHot} strokeWidth={3} />

                    {/* 流向箭头和阀门 */}
                    <Valve x={420} y={200} label="二通阀" opening={100} color={COLORS.coolingWaterHot} rotation={90} scale={1.3} />
                    <FlowArrow x={260} y={30} rotation={180} color={COLORS.coolingWaterHot} />

                </svg>
            </div>

            {/* 运行模式选择 Operating Mode */}
            <div className="mt-3 flex gap-3">
                {[
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

            {/* 状态栏 */}
            <div className="mt-2 flex gap-4 text-xs" style={{ color: COLORS.textMuted }}>
                <span>压缩机: {isCompressorOn ? '运行' : '停止'}</span>
                <span>水盘管: {isWaterCoilActive ? '活动' : '关闭'}</span>
                <span>送风温度: {data.supplyAirTemp}°C</span>
                <span>回风温度: {data.returnAirTemp}°C</span>
            </div>
        </div>
    );
}
