import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Wind, Droplets, Gauge, Shield, Cpu } from 'lucide-react';

const HeroSection = () => {
    const features = [
        {
            icon: <Zap className="w-8 h-8" />,
            title: '无油技术',
            description: 'Oil-Free 磁悬浮轴承',
            color: 'from-yellow-500 to-orange-500'
        },
        {
            icon: <Wind className="w-8 h-8" />,
            title: '离心式',
            description: 'Centrifugal 高效压缩',
            color: 'from-cyan-500 to-blue-500'
        },
        {
            icon: <Droplets className="w-8 h-8" />,
            title: '经济器',
            description: 'Economizer 节能优化',
            color: 'from-blue-500 to-purple-500'
        },
        {
            icon: <Gauge className="w-8 h-8" />,
            title: '变频控制',
            description: 'VFD 精确调节',
            color: 'from-purple-500 to-pink-500'
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: '多重保护',
            description: 'Anti-Surge 防喘振',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: <Cpu className="w-8 h-8" />,
            title: '智能冷却',
            description: '电机/逆变器冷却系统',
            color: 'from-red-500 to-rose-500'
        },
    ];

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        className="inline-block mb-8"
                    >
                        <div className="relative">
                            <div className="w-32 h-32 magnetic-gradient rounded-3xl flex items-center justify-center shadow-2xl shadow-magnetic-500/50 animate-float">
                                <span className="text-7xl">🧲</span>
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-slate-950 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">ON</span>
                            </div>
                        </div>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black mb-6">
                        <span className="bg-gradient-to-r from-magnetic-300 via-techno-300 to-magnetic-300 bg-clip-text text-transparent animate-gradient">
                            磁悬浮压缩机
                        </span>
                    </h1>

                    <p className="text-2xl md:text-3xl text-slate-400 mb-4 font-light">
                        Turbocor Magnetic Levitation Technology
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="px-6 py-3 bg-slate-800/50 rounded-full border border-magnetic-500/30">
                            <span className="text-magnetic-400 font-mono font-bold">TECS2/SL-CA-E 0853/5</span>
                        </div>
                        <div className="px-6 py-3 bg-slate-800/50 rounded-full border border-techno-500/30">
                            <span className="text-techno-400 font-mono font-bold">F370853EYC05-O</span>
                        </div>
                    </div>

                    <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                        Climaveneta <strong className="text-magnetic-400">克莱门特</strong> 风冷冷水机组<br />
                        专业级磁悬浮离心式无油压缩机技术详解平台
                    </p>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ scale: 1.05, rotateY: 5 }}
                            className="tech-card group cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-2xl transition-shadow`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-slate-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Key Highlights */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="glass-panel p-8 md:p-12"
                >
                    <h2 className="text-3xl font-bold mb-8 text-center">
                        <span className="bg-gradient-to-r from-magnetic-400 to-techno-400 bg-clip-text text-transparent">
                            核心技术优势
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-magnetic-500 mt-2"></div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">磁悬浮轴承技术</h4>
                                    <p className="text-slate-400">完全无机械接触，零摩擦损耗，无需润滑油维护</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-magnetic-500 mt-2"></div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">变频调速系统</h4>
                                    <p className="text-slate-400">10%-100% 无级调节，精确匹配负荷需求</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-magnetic-500 mt-2"></div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">经济器节能技术</h4>
                                    <p className="text-slate-400">闪蒸冷却提升COP，降低运行成本15-20%</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-techno-500 mt-2"></div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">智能防喘振保护</h4>
                                    <p className="text-slate-400">TE5 热气旁通阀，确保压缩机安全运行</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-techno-500 mt-2"></div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">冷媒泵冷却回路</h4>
                                    <p className="text-slate-400">独立冷却系统保护电机和逆变器元件</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-2 h-2 rounded-full bg-techno-500 mt-2"></div>
                                <div>
                                    <h4 className="font-bold text-lg mb-1">V型翅片式冷凝器</h4>
                                    <p className="text-slate-400">优化换热效率，降低排气温度</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
                >
                    {[
                        { value: '0', label: '机械摩擦', unit: 'Zero Friction' },
                        { value: '100%', label: '无油运行', unit: 'Oil-Free' },
                        { value: '50+', label: '使用寿命', unit: '年设计寿命' },
                        { value: 'A+++', label: '能效等级', unit: 'Energy Class' },
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            className="bg-slate-900/50 rounded-2xl p-6 text-center border border-slate-800 hover:border-magnetic-500/50 transition-all"
                        >
                            <div className="text-4xl font-black bg-gradient-to-r from-magnetic-400 to-techno-400 bg-clip-text text-transparent mb-2">
                                {stat.value}
                            </div>
                            <div className="text-slate-300 font-semibold mb-1">{stat.label}</div>
                            <div className="text-xs text-slate-500 font-mono">{stat.unit}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default HeroSection;
