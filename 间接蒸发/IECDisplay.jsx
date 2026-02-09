import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 辅助函数：合并 Tailwind 类
function cn(...inputs: (string | undefined | null | false)[]) {
return twMerge(clsx(inputs));
}

// --- 类型定义 ---
type Mode = 'dry' | 'wet' | 'hybrid' | 'dx';

interface TempData {
inlet: number;
outlet: number;
color: string;
}

// --- 配置数据 ---
const MODES: { id: Mode; label: string; desc: string }[] = [
{ id: 'dry', label: 'DRY MODE', desc: '仅风机运行 / 显热交换' },
{ id: 'wet', label: 'WET MODE', desc: '蒸发冷却 / 喷淋开启' },
{ id: 'hybrid', label: 'HYBRID', desc: '混合模式 / 喷淋 + DX' },
{ id: 'dx', label: 'DX MODE', desc: '机械制冷 / 仅压缩机' },
];

const TEMP_CONFIG: Record<Mode, TempData> = {
dry: { inlet: 35, outlet: 30, color: '#ef4444' }, // 微红
wet: { inlet: 35, outlet: 24, color: '#3b82f6' }, // 蓝
hybrid: { inlet: 35, outlet: 18, color: '#6366f1' }, // 深蓝/紫
dx: { inlet: 35, outlet: 20, color: '#0ea5e9' }, // 青蓝
};

// --- 子组件：喷淋粒子系统 ---
const SprayParticles = () => {
const drops = Array.from({ length: 20 });
return (
<g className="pointer-events-none">
    {drops.map((_, i) => (
    <motion.line
            key={i}
            x1={350 + Math.random() * 100}
            y1={160}
            x2={350 + Math.random() * 100}
            y2={170}
            stroke="#60a5fa"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ y: 0, opacity: 0 }}
            animate={{
            y: [0, 150],
            opacity: [0, 1, 0],
            }}
            transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "linear",
    delay: Math.random() * 1,
    }}
    />
    ))}
</g>
);
};

// --- 子组件：DX 盘管水滴 ---
const CondensationDrops = () => {
return (
<g>
    {[1, 2, 3, 4].map((i) => (
    <motion.circle
            key={i}
            cx={620 + (i % 2) * 10}
            cy={200 + i * 20}
            r="3"
            fill="#bae6fd"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], y: [0, 10] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
    />
    ))}
</g>
);
};

// --- 主组件 ---
export default function IECUnitDisplay() {
const [mode, setMode] = useState<Mode>('dry');
    const [displayTemp, setDisplayTemp] = useState(TEMP_CONFIG['dry']);

    // 模拟温度数值平滑过渡
    useEffect(() => {
    const target = TEMP_CONFIG[mode];
    const interval = setInterval(() => {
    setDisplayTemp((prev) => {
    if (prev.outlet === target.outlet) return prev;
    const step = prev.outlet > target.outlet ? -0.5 : 0.5;
    return { ...prev, outlet: Number((prev.outlet + step).toFixed(1)), color: target.color };
    });
    }, 50);
    return () => clearInterval(interval);
    }, [mode]);

    const isWet = mode === 'wet' || mode === 'hybrid';
    const isDX = mode === 'dx' || mode === 'hybrid';

    return (
    <div className="min-h-[600px] w-full bg-slate-900 p-8 flex flex-col items-center justify-center text-slate-200 font-mono selection:bg-cyan-500/30">

        {/* 顶部标题栏 */}
        <div className="w-full max-w-4xl flex justify-between items-end mb-6 border-b border-slate-700 pb-4">
            <div>
                <h1 className="text-2xl font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-cyan-500 animate-pulse rounded-full" />
                    IEC SYSTEM MONITOR
                </h1>
                <p className="text-xs text-slate-400 mt-1">INDIRECT EVAPORATIVE COOLING UNIT</p>
            </div>
            <div className="text-right">
                <div className="text-sm text-slate-400">SYSTEM STATUS</div>
                <div className={cn("text-xl font-bold transition-colors duration-500",
                mode === 'dry' ? 'text-orange-400' :
                mode === 'wet' ? 'text-blue-400' :
                mode === 'hybrid' ? 'text-purple-400' : 'text-cyan-400'
                )}>
                {MODES.find(m => m.id === mode)?.label}
            </div>
        </div>
    </div>

    {/* 核心可视化区域 */}
    <div className="relative w-full max-w-4xl aspect-[16/9] bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl overflow-hidden backdrop-blur-sm">

        {/* 背景网格装饰 */}
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(#4fd1c5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

    {/* 温度悬浮显示 */}
    <div className="absolute top-8 left-8 bg-slate-900/80 border border-red-500/30 p-3 rounded backdrop-blur-md z-10">
        <div className="text-xs text-slate-400">INLET AIR (OA)</div>
        <div className="text-2xl font-bold text-red-500">{TEMP_CONFIG[mode].inlet.toFixed(1)}°C</div>
    </div>

    <motion.div
            className="absolute top-8 right-8 bg-slate-900/80 border p-3 rounded backdrop-blur-md z-10"
            animate={{ borderColor: displayTemp.color }}
    >
        <div className="text-xs text-slate-400">SUPPLY AIR (SA)</div>
        <motion.div
                className="text-2xl font-bold"
                animate={{ color: displayTemp.color }}
        >
            {displayTemp.outlet.toFixed(1)}°C
        </motion.div>
    </motion.div>

    {/* SVG 绘图区 */}
    <svg viewBox="0 0 800 450" className="w-full h-full drop-shadow-lg">
        <defs>
            {/* 渐变定义 */}
            <linearGradient id="grad-core" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#475569" />
            </linearGradient>
            <pattern id="pattern-core" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M0 10L10 0" stroke="#94a3b8" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
        </defs>

        {/* 1. 机组外壳 */}
        <rect x="50" y="50" width="700" height="350" rx="10" fill="none" stroke="#334155" strokeWidth="2" />

        {/* 2. 热交换芯体 (Diamond Core) */}
        <path
                d="M 400 100 L 500 225 L 400 350 L 300 225 Z"
                fill="url(#grad-core)"
                stroke="#94a3b8"
                strokeWidth="2"
        />
        {/* 芯体纹理 */}
        <path d="M 400 100 L 500 225 L 400 350 L 300 225 Z" fill="url(#pattern-core)" opacity="0.5" />

        {/* 3. 回风通道 (Scavenger Air) - 垂直流/交叉流 */}
        {/* 从下方进入，穿过芯体，向上排出 */}
        <motion.path
                d="M 400 420 L 400 350 L 400 100 L 400 30"
                fill="none"
                stroke="#f97316" // 橙色代表二次回风/排风
        strokeWidth="4"
        strokeDasharray="10 5"
        strokeOpacity="0.4"
        animate={{ strokeDashoffset: [0, -30] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        {/* 芯体内部的回风路径 (示意) */}
        <path d="M 380 320 L 380 130 M 420 320 L 420 130" stroke="#f97316" strokeWidth="1" strokeOpacity="0.2" />

        {/* 4. 新风通道 (Process Air) - 水平流 */}
        {/* 4.1 入口到芯体 */}
        <motion.path
                d="M 0 225 L 300 225"
                fill="none"
                stroke="#ef4444" // 红色
        strokeWidth="8"
        strokeDasharray="20 10"
        animate={{ strokeDashoffset: [30, 0] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* 4.2 芯体内部流动 */}
        <motion.path
                d="M 300 225 L 500 225"
                fill="none"
                stroke="url(#grad-temp)" // 这里的颜色在复杂场景可以用mask，简化处理用透明度
        strokeWidth="8"
        strokeDasharray="20 10"
        strokeOpacity="0.5"
        animate={{ strokeDashoffset: [30, 0] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />

        {/* 4.3 出口流动 (颜色根据模式变化) */}
        <motion.path
                d="M 500 225 L 800 225"
                fill="none"
                strokeWidth="8"
                strokeDasharray="20 10"
                animate={{
                stroke: displayTemp.color,
                strokeDashoffset: [30, 0]
                }}
                transition={{
                stroke: { duration: 0.5 },
                strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" }
        }}
        />

        {/* 5. 喷淋系统 (Wet/Hybrid) */}
        <AnimatePresence>
            {isWet && (
            <g>
                {/* 喷嘴 */}
                <polygon points="350,90 360,110 340,110" fill="#3b82f6" />
                <polygon points="400,90 410,110 390,110" fill="#3b82f6" />
                <polygon points="450,90 460,110 440,110" fill="#3b82f6" />
                {/* 粒子 */}
                <SprayParticles />
            </g>
            )}
        </AnimatePresence>

        {/* 6. DX 表冷器 (Coil) */}
        <g transform="translate(600, 150)">
            {/* 盘管边框 */}
            <rect x="0" y="0" width="40" height="150" rx="5" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            {/* 盘管管路 */}
            <motion.path
                    d="M 10 10 H 30 M 10 30 H 30 M 10 50 H 30 M 10 70 H 30 M 10 90 H 30 M 10 110 H 30 M 10 130 H 30"
                    stroke={isDX ? "#0ea5e9" : "#94a3b8"}
            strokeWidth="4"
            strokeLinecap="round"
            animate={{
            stroke: isDX ? "#0ea5e9" : "#94a3b8",
            filter: isDX ? "drop-shadow(0 0 4px #0ea5e9)" : "none"
            }}
            />
            {/* 冷凝水 */}
            {isDX && <CondensationDrops />}
        </g>

        {/* 标签与箭头 (UI 叠加) */}
        <text x="150" y="205" fill="#ef4444" fontSize="12" fontFamily="monospace" opacity="0.7">FRESH AIR IN</text>
        <text x="650" y="205" fill={displayTemp.color} fontSize="12" fontFamily="monospace" opacity="0.7">SUPPLY OUT</text>
        <text x="420" y="50" fill="#f97316" fontSize="12" fontFamily="monospace" opacity="0.7">EXHAUST</text>

    </svg>
    </div>

    {/* 底部控制面板 */}
    <div className="w-full max-w-4xl mt-8 grid grid-cols-4 gap-4">
        {MODES.map((m) => (
        <button
                key={m.id}
                onClick={() => setMode(m.id)}
        className={cn(
        "relative group p-4 rounded-lg border transition-all duration-300 text-left overflow-hidden",
        mode === m.id
        ? "bg-slate-800 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
        : "bg-slate-800/30 border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
        )}
        >
        {/* 激活状态下的扫描光效 */}
        {mode === m.id && (
        <motion.div
                layoutId="active-glow"
                className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent"
                initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        )}

        <div className="relative z-10">
            <div className={cn("text-sm font-bold mb-1", mode === m.id ? "text-cyan-400" : "text-slate-300")}>
            {m.label}
        </div>
        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
            {m.desc}
        </div>
    </div>
    </button>
    ))}
    </div>

    </div>
    );
    }