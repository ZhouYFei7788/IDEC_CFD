import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCw, Zap } from 'lucide-react';

const CompressorAnimation = () => {
    const [isRunning, setIsRunning] = useState(true);
    const [speed, setSpeed] = useState(1);

    const stages = [
        {
            title: '1. 吸气过程',
            description: '低压低温冷媒蒸汽从蒸发器被吸入压缩机',
            color: '#3b82f6',
            position: 'bottom'
        },
        {
            title: '2. 压缩过程',
            description: '磁悬浮叶轮高速旋转，冷媒被离心加速压缩',
            color: '#8b5cf6',
            position: 'left'
        },
        {
            title: '3. 排气过程',
            description: '高压高温冷媒蒸汽排出至冷凝器',
            color: '#ef4444',
            position: 'top'
        },
        {
            title: '4. 冷凝过程',
            description: '冷媒在冷凝器中放热液化',
            color: '#f59e0b',
            position: 'right'
        },
    ];

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="section-title">工作原理</h1>
                    <p className="text-xl text-slate-400">磁悬浮离心式压缩机运行机制</p>
                </motion.div>

                {/* Animation Controls */}
                <div className="flex justify-center gap-4 mb-12">
                    <button
                        onClick={() => setIsRunning(!isRunning)}
                        className="tech-button flex items-center gap-2"
                    >
                        {isRunning ? <Pause size={20} /> : <Play size={20} />}
                        {isRunning ? '暂停' : '播放'}
                    </button>
                    <button
                        onClick={() => setSpeed(speed === 2 ? 0.5 : speed + 0.5)}
                        className="px-6 py-3 bg-slate-800 rounded-xl font-semibold text-white hover:bg-slate-700 transition-all flex items-center gap-2"
                    >
                        <RotateCw size={20} />
                        速度: {speed}x
                    </button>
                </div>

                {/* Main Animation */}
                <div className="tech-card mb-12 p-12">
                    <div className="relative w-full h-[600px] flex items-center justify-center">
                        {/* Center Compressor */}
                        <motion.div
                            animate={{ rotate: isRunning ? 360 : 0 }}
                            transition={{
                                duration: 2 / speed,
                                repeat: isRunning ? Infinity : 0,
                                ease: 'linear'
                            }}
                            className="absolute w-48 h-48 rounded-full magnetic-gradient shadow-2xl shadow-magnetic-500/50 flex items-center justify-center"
                        >
                            <div className="w-40 h-40 rounded-full bg-slate-950 border-4 border-white/20 flex items-center justify-center">
                                <Zap className="w-16 h-16 text-yellow-400" />
                            </div>
                        </motion.div>

                        {/* Magnetic Bearing Rings */}
                        {[1, 2, 3].map((ring) => (
                            <motion.div
                                key={ring}
                                animate={{ rotate: isRunning ? (ring % 2 === 0 ? -360 : 360) : 0 }}
                                transition={{
                                    duration: (3 + ring) / speed,
                                    repeat: isRunning ? Infinity : 0,
                                    ease: 'linear'
                                }}
                                className="absolute rounded-full border-2 border-magnetic-500/30"
                                style={{
                                    width: `${200 + ring * 40}px`,
                                    height: `${200 + ring * 40}px`,
                                }}
                            />
                        ))}

                        {/* Flow Paths */}
                        {stages.map((stage, index) => {
                            const angle = (index * 90) - 90;
                            const radius = 250;
                            const x = Math.cos((angle * Math.PI) / 180) * radius;
                            const y = Math.sin((angle * Math.PI) / 180) * radius;

                            return (
                                <React.Fragment key={index}>
                                    {/* Flow Node */}
                                    <motion.div
                                        className="absolute"
                                        style={{
                                            left: `calc(50% + ${x}px)`,
                                            top: `calc(50% + ${y}px)`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: isRunning ? [1, 1.2, 1] : 1,
                                                boxShadow: isRunning
                                                    ? [`0 0 20px ${stage.color}`, `0 0 40px ${stage.color}`, `0 0 20px ${stage.color}`]
                                                    : `0 0 20px ${stage.color}`
                                            }}
                                            transition={{
                                                duration: 1 / speed,
                                                repeat: isRunning ? Infinity : 0,
                                                delay: index * 0.25 / speed
                                            }}
                                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                                            style={{ backgroundColor: stage.color }}
                                        >
                                            {index + 1}
                                        </motion.div>
                                    </motion.div>

                                    {/* Connecting Lines */}
                                    <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
                                        <motion.path
                                            d={`M ${50}% ${50}% L ${50 + (x / radius) * 40}% ${50 + (y / radius) * 40}%`}
                                            stroke={stage.color}
                                            strokeWidth="3"
                                            fill="none"
                                            strokeDasharray="10 5"
                                            animate={{
                                                strokeDashoffset: isRunning ? [0, -60] : 0
                                            }}
                                            transition={{
                                                duration: 2 / speed,
                                                repeat: isRunning ? Infinity : 0,
                                                ease: 'linear'
                                            }}
                                        />
                                    </svg>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Stage Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stages.map((stage, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="tech-card relative overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div
                                className="absolute top-0 left-0 right-0 h-1"
                                style={{ backgroundColor: stage.color }}
                            />
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: stage.color }}
                                >
                                    {index + 1}
                                </div>
                                <h3 className="font-bold text-lg">{stage.title}</h3>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {stage.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Technical Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-12 glass-panel p-8"
                >
                    <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-magnetic-400 to-techno-400 bg-clip-text text-transparent">
                        磁悬浮技术原理
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-xl">
                                <span className="text-4xl">⬆️</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">轴向磁悬浮</h4>
                            <p className="text-slate-400 text-sm">
                                电磁力抵消轴向推力，实现无接触悬浮
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl">
                                <span className="text-4xl">↔️</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">径向磁悬浮</h4>
                            <p className="text-slate-400 text-sm">
                                主动控制径向位置，确保转子精确定位
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl">
                                <span className="text-4xl">🔄</span>
                            </div>
                            <h4 className="font-bold text-lg mb-2">永磁电机</h4>
                            <p className="text-slate-400 text-sm">
                                高效变频驱动，10%-100%无级调速
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-slate-900/50 rounded-xl border border-magnetic-500/30">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                            <Zap className="text-yellow-400" />
                            关键优势
                        </h4>
                        <ul className="space-y-2 text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-magnetic-400 mt-1">▸</span>
                                <span><strong>零摩擦损耗：</strong>转子完全悬浮，无机械接触磨损</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-magnetic-400 mt-1">▸</span>
                                <span><strong>超静音运行：</strong>噪音低至 58-65 dB(A)</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-magnetic-400 mt-1">▸</span>
                                <span><strong>免维护设计：</strong>无需更换轴承和润滑油</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-magnetic-400 mt-1">▸</span>
                                <span><strong>长寿命保证：</strong>设计寿命超过 50 年</span>
                            </li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CompressorAnimation;
