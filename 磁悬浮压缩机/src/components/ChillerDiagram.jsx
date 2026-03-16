import React from 'react';
import { motion } from 'framer-motion';

/**
 * 冷媒流动动画
 */
const FlowPath = ({ d, color, active = true, width = 3 }) => {
    if (!active) return <path d={d} stroke="#334155" strokeWidth={width} fill="none" opacity={0.4} />;

    return (
        <g>
            <path d={d} stroke={color} strokeWidth={width} fill="none" opacity={0.5} />
            <motion.path
                d={d}
                stroke={color}
                strokeWidth={width}
                fill="none"
                strokeDasharray="12 8"
                animate={{ strokeDashoffset: [0, -40] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
        </g>
    );
};

/**
 * 简洁矩形组件
 */
const SimpleBox = ({ x, y, w, h, label, subLabel, color, onClick }) => (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <rect
            x={-w / 2} y={-h / 2}
            width={w} height={h}
            rx="4"
            fill="#1e293b"
            stroke={color}
            strokeWidth="2"
        />
        <text x="0" y="2" textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">{label}</text>
        {subLabel && <text x="0" y={h / 2 + 14} textAnchor="middle" fill="#64748b" fontSize="10">{subLabel}</text>}
    </g>
);

/**
 * 圆形组件(压缩机等)
 */
const CircleComponent = ({ x, y, r, label, subLabel, color, running }) => (
    <g transform={`translate(${x}, ${y})`}>
        <circle r={r} fill="#1e293b" stroke={color} strokeWidth="2" />
        {running && (
            <motion.circle
                r={r * 0.6}
                fill="none"
                stroke={color}
                strokeWidth="1"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ originX: '0px', originY: '0px' }}
            />
        )}
        <text x="0" y="4" textAnchor="middle" fill={color} fontSize="11" fontWeight="bold">{label}</text>
        {subLabel && <text x="0" y={r + 16} textAnchor="middle" fill="#64748b" fontSize="10">{subLabel}</text>}
    </g>
);

/**
 * 阀门符号
 */
const Valve = ({ x, y, label, opening, color = '#94a3b8', active = true }) => (
    <g transform={`translate(${x}, ${y})`}>
        <polygon
            points="-8,-6 0,0 -8,6 0,0 8,-6 8,6 0,0"
            fill={active ? color : '#475569'}
            opacity={active ? 0.8 : 0.4}
        />
        <text x="0" y="-12" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">{label}</text>
        {opening !== undefined && (
            <text x="0" y="16" textAnchor="middle" fill="#64748b" fontSize="8">{opening}%</text>
        )}
    </g>
);

/**
 * 传感器标记
 */
const Sensor = ({ x, y, label, value, unit, color = '#0ea5e9' }) => (
    <g transform={`translate(${x}, ${y})`}>
        <circle r="8" fill={color} />
        <text x="0" y="3" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="bold">{label}</text>
        {value !== undefined && (
            <text x="0" y="-14" textAnchor="middle" fill={color} fontSize="9">{value}{unit}</text>
        )}
    </g>
);

/**
 * TECS2-SL-CA-E 0853-S 系统图
 * 简洁2D设计，清晰展示管道拓扑和设备位置
 */
export default function ChillerDiagram({ stats }) {
    const isRunning = stats?.running ?? true;
    const ecoActive = stats?.ecoInjection ?? false;
    const surgeActive = (stats?.te5Opening ?? 0) > 5;

    // 颜色定义
    const COLOR = {
        highPressGas: '#ef4444',   // 红色 - 高压排气
        highPressLiq: '#f97316',   // 橙色 - 高压液体
        midPress: '#a855f7',       // 紫色 - 经济器中压
        lowPress: '#3b82f6',       // 蓝色 - 低压吸气
        water: '#0ea5e9',          // 青色 - 冷冻水
        bypass: '#eab308'          // 黄色 - 旁通
    };

    return (
        <div className="w-full h-full bg-slate-950 rounded-xl border border-slate-800 relative">
            <svg viewBox="0 0 900 550" className="w-full h-full">
                {/* 背景 */}
                <rect width="100%" height="100%" fill="#0f172a" />

                {/* ========== 图例 ========== */}
                <g transform="translate(20, 20)">
                    <text x="0" y="0" fill="#64748b" fontSize="10">管路颜色:</text>
                    <line x1="0" y1="12" x2="25" y2="12" stroke={COLOR.highPressGas} strokeWidth="3" />
                    <text x="30" y="16" fill="#94a3b8" fontSize="9">高压气体</text>
                    <line x1="90" y1="12" x2="115" y2="12" stroke={COLOR.highPressLiq} strokeWidth="3" />
                    <text x="120" y="16" fill="#94a3b8" fontSize="9">高压液体</text>
                    <line x1="180" y1="12" x2="205" y2="12" stroke={COLOR.midPress} strokeWidth="3" />
                    <text x="210" y="16" fill="#94a3b8" fontSize="9">中压</text>
                    <line x1="250" y1="12" x2="275" y2="12" stroke={COLOR.lowPress} strokeWidth="3" />
                    <text x="280" y="16" fill="#94a3b8" fontSize="9">低压</text>
                </g>

                {/* ========== 主要设备 ========== */}

                {/* 压缩机 C */}
                <CircleComponent
                    x={120} y={280} r={45}
                    label="C"
                    subLabel={`${stats?.compSpeed ?? 0} RPM`}
                    color="#22d3ee"
                    running={isRunning}
                />
                <text x="120" y="340" textAnchor="middle" fill="#22d3ee" fontSize="11">压缩机</text>

                {/* 冷凝器 FE (翅片换热器) */}
                <SimpleBox
                    x={450} y={80} w={260} h={60}
                    label="FE - 冷凝器"
                    subLabel={`${stats?.condTemp ?? 0}°C`}
                    color={COLOR.highPressGas}
                />

                {/* 过滤器 */}
                <SimpleBox
                    x={650} y={180} w={50} h={30}
                    label="Filter"
                    color={COLOR.highPressLiq}
                />

                {/* 视液镜 VS */}
                <g transform="translate(720, 180)">
                    <circle r="12" fill="#0f172a" stroke="#22c55e" strokeWidth="2" />
                    <text x="0" y="3" textAnchor="middle" fill="#22c55e" fontSize="8">VS</text>
                    <text x="0" y="26" textAnchor="middle" fill="#64748b" fontSize="9">视液镜</text>
                </g>

                {/* 经济器 ECO */}
                <SimpleBox
                    x={600} y={300} w={80} h={70}
                    label="ECO"
                    subLabel={`${stats?.ecoLevel ?? 0}%`}
                    color={COLOR.midPress}
                />
                <text x="600" y="355" textAnchor="middle" fill="#a855f7" fontSize="10">经济器</text>

                {/* 蒸发器 EVA */}
                <SimpleBox
                    x={450} y={450} w={200} h={60}
                    label="EVA - 蒸发器"
                    subLabel={`${stats?.evapTemp ?? 0}°C`}
                    color={COLOR.lowPress}
                />

                {/* ========== 阀门组 ========== */}

                {/* 主膨胀阀 TE1/TE2 */}
                <Valve x={750} y={350} label="TE1" opening={stats?.te1Opening} color={COLOR.highPressLiq} active={isRunning} />
                <Valve x={750} y={390} label="TE2" opening={stats?.te2Opening} color={COLOR.highPressLiq} active={isRunning} />

                {/* 经济器膨胀阀 TE3/TE4 */}
                <Valve x={650} y={220} label="TE3/4" opening={stats?.te3Opening} color={COLOR.midPress} active={ecoActive} />

                {/* 防喘振阀 TES */}
                <Valve x={220} y={180} label="TES" opening={stats?.te5Opening} color={COLOR.bypass} active={surgeActive} />
                <text x="220" y="200" textAnchor="middle" fill="#64748b" fontSize="8">防喘振</text>

                {/* 经济器电磁阀 ES */}
                <g transform="translate(500, 280)">
                    <rect x="-15" y="-10" width="30" height="20" rx="3"
                        fill={ecoActive ? '#a855f7' : '#334155'}
                        stroke="#a855f7" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">ES</text>
                    <text x="0" y="24" textAnchor="middle" fill="#64748b" fontSize="8">{ecoActive ? 'ON' : 'OFF'}</text>
                </g>

                {/* 止回阀 VR4/VR5 */}
                <g transform="translate(180, 420)">
                    <polygon points="-6,5 6,0 -6,-5" fill="#22d3ee" opacity={0.7} />
                    <text x="0" y="-10" textAnchor="middle" fill="#22d3ee" fontSize="8">VR4/5</text>
                </g>

                {/* ========== 传感器 ========== */}

                {/* S1 蒸发器进水 */}
                <Sensor x={380} y={420} label="S1" value={stats?.waterInTemp} unit="°C" color={COLOR.water} />

                {/* S2 蒸发器出水 */}
                <Sensor x={520} y={420} label="S2" value={stats?.waterOutTemp} unit="°C" color="#22d3ee" />

                {/* ========== 管道路径 ========== */}

                {/* 1. 高压排气: 压缩机顶部 → 冷凝器左侧 */}
                <FlowPath
                    d="M 120 235 V 80 H 320"
                    color={COLOR.highPressGas}
                    active={isRunning}
                    width={4}
                />

                {/* 2. 冷凝器出口 → 过滤器 → 视液镜 */}
                <FlowPath
                    d="M 580 80 H 650 V 165"
                    color={COLOR.highPressLiq}
                    active={isRunning}
                />
                <FlowPath
                    d="M 650 195 V 220 H 720 V 180"
                    color={COLOR.highPressLiq}
                    active={isRunning}
                />

                {/* 3. 液管主路: 视液镜 → TE1/TE2 → 蒸发器 */}
                <FlowPath
                    d="M 732 180 H 780 V 370"
                    color={COLOR.highPressLiq}
                    active={isRunning}
                />
                <FlowPath
                    d="M 780 370 V 450 H 550"
                    color={COLOR.lowPress}
                    active={isRunning}
                />

                {/* 4. 低压吸气: 蒸发器 → 止回阀 → 压缩机 */}
                <FlowPath
                    d="M 350 450 H 180 V 420"
                    color={COLOR.lowPress}
                    active={isRunning}
                    width={4}
                />
                <FlowPath
                    d="M 180 420 V 280 H 165"
                    color={COLOR.lowPress}
                    active={isRunning}
                    width={4}
                />

                {/* 5. 经济器回路: 分流 → TE3/4 → ECO → ES → 压缩机补气口 */}
                <FlowPath
                    d="M 650 220 V 265"
                    color={COLOR.midPress}
                    active={ecoActive}
                />
                <FlowPath
                    d="M 600 265 V 265 H 560"
                    color={COLOR.midPress}
                    active={ecoActive}
                />
                <FlowPath
                    d="M 485 280 H 400 V 280 H 165"
                    color={COLOR.midPress}
                    active={ecoActive}
                    width={2}
                />

                {/* 6. 防喘振旁通: 排气 → TES → 吸气 */}
                <FlowPath
                    d="M 120 235 V 180 H 200"
                    color={COLOR.bypass}
                    active={surgeActive}
                    width={2}
                />
                <FlowPath
                    d="M 240 180 H 280 V 350 H 180 V 280"
                    color={COLOR.bypass}
                    active={surgeActive}
                    width={2}
                />

                {/* ========== 压力/状态标注 ========== */}

                {/* 高压标注 */}
                <g transform="translate(200, 60)">
                    <rect x="-30" y="-10" width="60" height="20" rx="3" fill="#ef444430" />
                    <text x="0" y="4" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">
                        {stats?.highPressure ?? 0} kPa
                    </text>
                </g>

                {/* 中压标注 */}
                <g transform="translate(450, 300)">
                    <rect x="-30" y="-10" width="60" height="20" rx="3" fill="#a855f730" />
                    <text x="0" y="4" textAnchor="middle" fill="#a855f7" fontSize="10" fontWeight="bold">
                        {stats?.midPressure ?? 0} kPa
                    </text>
                </g>

                {/* 低压标注 */}
                <g transform="translate(280, 450)">
                    <rect x="-30" y="-10" width="60" height="20" rx="3" fill="#3b82f630" />
                    <text x="0" y="4" textAnchor="middle" fill="#3b82f6" fontSize="10" fontWeight="bold">
                        {stats?.lowPressure ?? 0} kPa
                    </text>
                </g>

                {/* ========== 冷冻水流向 ========== */}
                <g>
                    <path d="M 340 450 L 310 450" stroke={COLOR.water} strokeWidth="2" fill="none" />
                    <polygon points="310,447 300,450 310,453" fill={COLOR.water} />
                    <text x="290" y="454" textAnchor="end" fill={COLOR.water} fontSize="9">冷冻水回水</text>
                </g>
                <g>
                    <path d="M 560 450 L 590 450" stroke="#22d3ee" strokeWidth="2" fill="none" />
                    <polygon points="590,447 600,450 590,453" fill="#22d3ee" />
                    <text x="610" y="454" textAnchor="start" fill="#22d3ee" fontSize="9">冷冻水供水</text>
                </g>

            </svg>
        </div>
    );
}
