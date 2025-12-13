// src/components/HvacDiagram.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WindStream from './WindStream';

export default function HvacDiagram({ params, stats, getAirColor }) {
    return (
        <div className="w-full max-w-6xl aspect-[2/1] bg-slate-900 border border-slate-800 rounded-xl relative shadow-2xl overflow-hidden mb-4">
            <svg viewBox="0 0 1000 500" className="w-full h-full">
                <defs>
                    <linearGradient id="grad-cond" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="grad-evap" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#ea580c" stopOpacity="0.6" />
                    </linearGradient>
                    <linearGradient id="grad-evap-stroke" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                </defs>
                <rect x="50" y="50" width="900" height="400" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <line x1="50" y1="250" x2="950" y2="250" stroke="#334155" strokeWidth="2" strokeDasharray="10 5" opacity="0.5" />
                {/* IEC Core */}
                <g transform="translate(300, 150)">
                    <path d="M 0 0 L 200 0 L 200 200 L 0 200 Z" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    <path d="M 0 20 H 200 M 0 60 H 200 M 0 100 H 200 M 0 140 H 200 M 0 180 H 200" stroke="#475569" strokeWidth="1" opacity="0.3" />
                    <path d="M 20 0 V 200 M 60 0 V 200 M 100 0 V 200 M 140 0 V 200 M 180 0 V 200" stroke="#60a5fa" strokeWidth="1" opacity={stats.sprayOn ? 0.4 : 0.1} />
                    {Array.from({ length: 15 }).map((_, i) => (
                        <motion.circle
                            key={`heat-${i}`}
                            r={2}
                            fill={getAirColor(params.oaTemp)}
                            opacity={0.6}
                            initial={{ cx: Math.random() * 200, cy: 20 + i * 12 }}
                            animate={{
                                cx: [Math.random() * 200, 100 + (Math.random() - 0.5) * 100, Math.random() * 200],
                                cy: [20 + i * 12, 100, 180 - i * 8],
                                opacity: [0.6, 0.3, 0],
                            }}
                            transition={{ duration: 2 + Math.random(), repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                        />
                    ))}
                    <text x="100" y="105" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">芯体出风温度</text>
                    <text x="100" y="120" textAnchor="middle" fill="#60a5fa" fontSize="14" fontWeight="bold">
                        {stats.coreOut != null ? stats.coreOut.toFixed(1) : '--'}°C
                    </text>
                </g>
                {/* OA */}
                <g>
                    <WindStream
                        pathId="oa-in"
                        d="M 50 250 H 350 Q 380 250 400 200 V 135"
                        colorStart={getAirColor(params.oaTemp)}
                        colorEnd={getAirColor(params.oaTemp)}
                        width={100}
                        speed={1.5}
                        intensity={1.5}
                    />
                    <text x="200" y="240" fill={getAirColor(params.oaTemp)} fontSize="12">
                        新风 OA {params.oaTemp != null ? params.oaTemp.toFixed(1) : '--'}°
                    </text>
                </g>
                {/* RA to SA combined */}
                <g>
                    <WindStream
                        pathId="ra-sa-flow"
                        d="M 50 400 H 280 Q 340 400 370 360 Q 410 310 450 280 Q 520 300 580 340 Q 610 355 620 360 H 950"
                        colorStart="#f97316"
                        colorEnd={getAirColor(stats.saTemp)}
                        width={120}
                        speed={1.5}
                        intensity={2}
                    />
                    <text x="100" y="390" fill="#f97316" fontSize="12">回风 RA {stats.raTemp != null ? stats.raTemp.toFixed(1) : '--'}°</text>
                    <text x="800" y="340" fill={stats.saTemp < 20 ? '#3b82f6' : 'white'} fontWeight="bold" fontSize="14">
                        送风 SA {stats.saTemp != null ? stats.saTemp.toFixed(1) : '--'}°
                    </text>
                </g>
                {/* EA */}
                <g opacity="0.8">
                    <WindStream
                        pathId="ea-out"
                        d="M 455 95 H 950"
                        colorStart={stats.sprayOn ? '#8b5cf6' : '#f97316'}
                        colorEnd={stats.dxOn ? '#ef4444' : stats.sprayOn ? '#8b5cf6' : '#f97316'}
                        width={80}
                        speed={2.5}
                    />
                    <text x="850" y="90" fill="#ef4444" fontSize="12">排风 EA</text>
                </g>
                {/* Water Pump and Supply Pipe */}
                <g opacity={stats.sprayOn ? 0.8 : 0.15}>
                    {/* Supply pipe from left side to spray system */}
                    <path
                        d="M 200 325 V 150 H 300"
                        stroke="#3b82f6"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Water Pump */}
                    <g transform="translate(200, 325)">
                        {/* Pump body */}
                        <rect x="-20" y="-20" width="40" height="40" fill="#1e293b" stroke="#3b82f6" strokeWidth="3" rx="4" />

                        {/* Pump impeller animation */}
                        {stats.sprayOn && (
                            <motion.g
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            >
                                <circle r="12" fill="none" stroke="#60a5fa" strokeWidth="2" />
                                <path d="M 0 -12 L 0 12 M -12 0 L 12 0" stroke="#60a5fa" strokeWidth="2" />
                            </motion.g>
                        )}

                        {/* Static impeller when not running */}
                        {!stats.sprayOn && (
                            <g>
                                <circle r="12" fill="none" stroke="#475569" strokeWidth="2" />
                                <path d="M 0 -12 L 0 12 M -12 0 L 12 0" stroke="#475569" strokeWidth="2" />
                            </g>
                        )}

                        {/* Pump label */}
                        <text x="0" y="35" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">水泵</text>

                        {/* Water flow particles in pipe - only when running */}
                        {stats.sprayOn && Array.from({ length: 5 }).map((_, i) => (
                            <motion.circle
                                key={`flow-${i}`}
                                r={2}
                                fill="#60a5fa"
                                initial={{ cx: 0, cy: -20 }}
                                animate={{ cx: 0, cy: -175 }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.4,
                                    ease: 'linear'
                                }}
                            />
                        ))}
                    </g>
                </g>

                {/* Spray System */}
                <AnimatePresence>{stats.sprayOn && (
                    <g>
                        <line x1="300" y1="150" x2="500" y2="150" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                        {Array.from({ length: 40 }).map((_, i) => (
                            <motion.circle
                                key={i}
                                r={1.5}
                                fill="#60a5fa"
                                initial={{ cx: 300 + Math.random() * 200, cy: 150, opacity: 1 }}
                                animate={{ cy: 270, opacity: 0 }}
                                transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: 'linear' }}
                            />
                        ))}
                    </g>
                )}</AnimatePresence>
                {/* Compressor */}
                <g transform="translate(400, 460)">
                    <circle r="35" fill="#1e293b" stroke={stats.dxOn ? '#22d3ee' : '#475569'} strokeWidth="4" />
                    {stats.dxOn && (
                        <motion.g animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                            <path d="M -18 0 L 0 -18 L 18 0 L 0 18 Z" fill="#22d3ee" opacity="0.7" />
                            <circle r="10" fill="#1e293b" stroke="#22d3ee" strokeWidth="2" />
                        </motion.g>
                    )}
                    <circle cx="25" cy="0" r="5" fill={stats.dxOn ? '#f97316' : '#475569'} opacity="0.8" />
                    <circle cx="-25" cy="0" r="5" fill={stats.dxOn ? '#ef4444' : '#475569'} opacity="0.8" />
                    <text x="0" y="55" textAnchor="middle" fill="#22d3ee" fontSize="11" fontWeight="bold">压缩机</text>
                    {stats.dxOn && <text x="0" y="70" textAnchor="middle" fill="#22d3ee" fontSize="9">{stats.compHz != null ? stats.compHz : 0}Hz</text>}
                </g>
                {/* Evaporator */}
                <g transform="translate(620, 300)">
                    <rect x="0" y="0" width="90" height="120" fill="url(#grad-evap)" stroke={stats.dxOn ? 'url(#grad-evap-stroke)' : '#475569'} strokeWidth="3" rx="6" />
                    {Array.from({ length: 8 }).map((_, i) => (
                        <path key={i} d={`M 10 ${15 + i * 14} H 80`} stroke={stats.dxOn ? '#3b82f6' : '#475569'} strokeWidth="3" strokeLinecap="round" />
                    ))}
                    {stats.dxOn && Array.from({ length: 4 }).map((_, i) => (
                        <motion.path
                            key={`cold-${i}`}
                            d={`M 10 ${25 + i * 28} Q 45 ${20 + i * 28} 80 ${25 + i * 28}`}
                            stroke="#60a5fa"
                            strokeWidth="2"
                            fill="none"
                            opacity={0.7}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                        />
                    ))}
                    <circle cx="45" cy="125" r="6" fill={stats.dxOn ? '#3b82f6' : '#475569'} opacity="0.8" />
                    <circle cx="45" cy="-5" r="6" fill={stats.dxOn ? '#3b82f6' : '#475569'} opacity="0.8" />
                    <text x="0" y="-12" textAnchor="start" fill="#3b82f6" fontSize="10" fontWeight="bold">蒸发器</text>
                    {stats.dxOn && <text x="0" y="5" textAnchor="start" fill="#3b82f6" fontSize="9">{stats.evapTemp != null ? stats.evapTemp.toFixed(1) : '--'}°C</text>}
                    {stats.dxOn && Array.from({ length: 3 }).map((_, i) => (
                        <motion.circle
                            key={`drop-${i}`}
                            r={2.5}
                            fill="#3b82f6"
                            initial={{ cx: 20 + i * 25, cy: 120, opacity: 1 }}
                            animate={{ cy: 160, opacity: 0 }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.7 }}
                        />
                    ))}
                </g>
                {/* Condenser */}
                <g transform="translate(350, 60)">
                    <rect x="0" y="0" width="100" height="70" fill="url(#grad-cond)" stroke={stats.dxOn ? '#ef4444' : '#475569'} strokeWidth="3" rx="6" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <path key={i} d={`M 10 ${12 + i * 12} H 90`} stroke={stats.dxOn ? '#ef4444' : '#475569'} strokeWidth="2.5" />
                    ))}
                    {stats.dxOn && Array.from({ length: 8 }).map((_, i) => (
                        <motion.circle
                            key={`heat-${i}`}
                            r={2.5}
                            fill="#ef4444"
                            initial={{ cx: 15 + i * 10, cy: 35, opacity: 0.9 }}
                            animate={{ cy: -25, opacity: 0 }}
                            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                    <circle cx="50" cy="-5" r="6" fill={stats.dxOn ? '#ef4444' : '#475569'} opacity="0.8" />
                    <circle cx="105" cy="35" r="6" fill={stats.dxOn ? '#f97316' : '#475569'} opacity="0.8" />
                    <text x="0" y="-12" textAnchor="start" fill="#ef4444" fontSize="10" fontWeight="bold">冷凝器</text>
                    {stats.dxOn && <text x="0" y="5" textAnchor="start" fill="#ef4444" fontSize="9">{stats.condTemp != null ? stats.condTemp.toFixed(1) : '--'}°C</text>}
                </g>
                {/* EEV */}
                <g transform="translate(770, 220)">
                    <rect x="-12" y="-25" width="24" height="50" fill="#1e293b" stroke={stats.dxOn ? '#a855f7' : '#475569'} strokeWidth="2.5" rx="4" />
                    {stats.dxOn && (
                        <motion.g animate={{ scaleY: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <path d="M -8 -10 L 0 0 L 8 -10" stroke="#a855f7" strokeWidth="2" fill="none" />
                            <path d="M -8 10 L 0 0 L 8 10" stroke="#a855f7" strokeWidth="2" fill="none" />
                            <line x1="0" y1="-10" x2="0" y2="10" stroke="#a855f7" strokeWidth="1.5" />
                        </motion.g>
                    )}
                    <circle cx="0" cy="-30" r="5" fill={stats.dxOn ? '#f97316' : '#475569'} opacity="0.8" />
                    <circle cx="0" cy="30" r="5" fill={stats.dxOn ? '#3b82f6' : '#475569'} opacity="0.8" />
                    <text x="0" y="45" textAnchor="middle" fill="#a855f7" fontSize="9" fontWeight="bold">膨胀阀</text>
                </g>
                {/* Refrigerant Pipes */}
                <g opacity={stats.dxOn ? 0.7 : 0.15}>
                    <path d="M 365 460 H 280 V 95 H 350" stroke="#ef4444" strokeWidth="5" fill="none" strokeLinecap="round" filter={stats.dxOn ? 'url(#glow-red)' : 'none'} />
                    <path d="M 455 95 H 770 V 185" stroke="#f97316" strokeWidth="5" fill="none" strokeLinecap="round" filter={stats.dxOn ? 'url(#glow-orange)' : 'none'} />
                    <path d="M 770 260 V 280 Q 770 290 760 290 H 675 Q 665 290 665 300 V 425" stroke="#3b82f6" strokeWidth="5" fill="none" strokeLinecap="round" filter={stats.dxOn ? 'url(#glow-blue)' : 'none'} />
                    <path d="M 665 425 V 460 H 435" stroke="#f97316" strokeWidth="5" fill="none" strokeLinecap="round" filter={stats.dxOn ? 'url(#glow-orange)' : 'none'} />
                </g>
                {/* Glow Filters */}
                <defs>
                    <filter id="glow-red"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    <filter id="glow-orange"><feGaussianBlur stdDeviation="2" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                    <filter id="glow-blue"><feGaussianBlur stdDeviation="2.5" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>
            </svg>
        </div>
    );
}
