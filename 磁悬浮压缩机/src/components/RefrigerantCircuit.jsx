import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Info, Zap, AlertCircle } from 'lucide-react';

const RefrigerantCircuit = () => {
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [flowActive, setFlowActive] = useState(true);

    const components = {
        C: {
            name: '压缩机 (C)',
            fullName: 'Compressor - Centrifugal Type',
            type: 'Turbocor 磁悬浮离心式',
            description: '无油设计，带 Eco Port 中间压力接口用于经济器回气',
            specs: ['型号: TG310', '转速: 18000-48000 RPM', '功率: 145 kW'],
            position: { x: 20, y: 50 }
        },
        BC: {
            name: '冷凝器 (BC)',
            fullName: 'Condenser - V-shape Fin & Coil',
            type: 'V型翅片式冷凝器',
            description: '风冷式，铜管铝翅片，6台风机',
            specs: ['换热面积: 285 m²', '风量: 156000 m³/h', '气流: 强制对流'],
            position: { x: 80, y: 50 }
        },
        EVA: {
            name: '蒸发器 (EVA)',
            fullName: 'Evaporator - Shell & Tube',
            type: '壳管式蒸发器（满液式）',
            description: '配备水温传感器 S1(进水) 和 S2(出水)',
            specs: ['水流量: 120 m³/h', '换水温差: 7°C', '材质: 不锈钢/铜管'],
            position: { x: 20, y: 85 }
        },
        ECO: {
            name: '经济器 (ECO)',
            fullName: 'Economizer - Flash Tank',
            type: '闪蒸式经济器',
            description: '通过液体过冷和中压补气提升系统COP 15-20%',
            specs: ['类型: 汽液分离器', '过冷度: 3-5°C', '中压级数: 1'],
            position: { x: 65, y: 68 }
        },
        TE1: {
            name: 'TE1 主膨胀阀',
            fullName: 'Main EEV - Electric Expansion Valve',
            type: '电子膨胀阀',
            description: '控制进入蒸发器的液体冷媒流量',
            specs: ['控制方式: 过热度控制', '调节范围: 0-100%', '响应时间: <2s'],
            position: { x: 38, y: 75 }
        },
        TE2: {
            name: 'TE2 主膨胀阀',
            fullName: 'Second Main EEV',
            type: '备用/并联电子膨胀阀',
            description: '与TE1配合，大负荷时并联使用',
            specs: ['配置: 并联', '容量分配: 50%', '备份功能: 支持'],
            position: { x: 42, y: 78 }
        },
        TE3: {
            name: 'TE3 经济器膨胀阀',
            fullName: 'Economizer EEV 1',
            type: '经济器电子膨胀阀',
            description: '控制进入经济器的液体分流，产生中压气体',
            specs: ['控制目标: 过冷度', '流量比例: 20-30%', '中压补气'],
            position: { x: 58, y: 65 }
        },
        TE4: {
            name: 'TE4 经济器膨胀阀',
            fullName: 'Economizer EEV 2',
            type: '经济器电子膨胀阀备用',
            description: '与TE3配合或备用',
            specs: ['配置: 并联', '容量分配: 50%', '备份功能: 支持'],
            position: { x: 62, y: 68 }
        },
        TE5: {
            name: 'TE5 防喘振阀',
            fullName: 'Anti-Surge Valve - Hot Gas Bypass',
            type: '热气旁通电子膨胀阀',
            description: '低负荷或启动时防止压缩机喘振，保护设备安全',
            specs: ['触发条件: 压比过高', '旁通路径: 排气→吸气', '安全保护: P0级'],
            position: { x: 50, y: 35 }
        },
        FE: {
            name: '过滤器 (FE)',
            fullName: 'Filter Drier',
            type: '干燥过滤器',
            description: '过滤冷媒中的杂质和水分',
            specs: ['过滤精度: 25μm', '吸湿能力: 强', '更换周期: 2年'],
            position: { x: 72, y: 60 }
        },
        VS: {
            name: '视液镜 (VS)',
            fullName: 'Sight Glass',
            type: '液态指示器',
            description: '观察冷媒状态和湿度指示',
            specs: ['功能: 气泡检测', '湿度指示: 变色', '材质: 耐压玻璃'],
            position: { x: 68, y: 63 }
        },
        P: {
            name: '冷媒泵 (P)',
            fullName: 'Refrigerant Pump',
            type: '压缩机冷却泵',
            description: '从蒸发器底部抽取液态冷媒，冷却压缩机电机和逆变器',
            specs: ['用途: 电机/逆变器冷却', '流量: 小', '扬程: 中'],
            position: { x: 15, y: 75 }
        },
        VR: {
            name: '止回阀 (VR)',
            fullName: 'Check Valve',
            type: '单向阀',
            description: '控制流向，防止冷媒倒流',
            specs: ['数量: 多个', '位置: 关键节点', '作用: 流向控制'],
            position: { x: 35, y: 42 }
        },
    };

    const flows = [
        {
            name: '主循环',
            color: '#ef4444',
            path: 'C → VR → BC → FE → VS → ECO → TE1/TE2 → EVA → C',
            description: '压缩机排出高温高压气体 → 止回阀 → 冷凝器冷凝成液体 → 过滤干燥 → 视液镜 → 经济器过冷 → 膨胀阀节流降压 → 蒸发器吸热蒸发 → 返回压缩机吸气'
        },
        {
            name: '经济器回路',
            color: '#3b82f6',
            path: 'BC出口 → 分流 → TE3/TE4 → ECO闪蒸 → 中压气体 → C中压口',
            description: '冷凝器出口液体分流 → 经济器膨胀阀节流 → 经济器内闪蒸蒸发 → 产生中压气体 → 注入压缩机中间级，提升效率'
        },
        {
            name: '防喘振回路',
            color: '#f59e0b',
            path: 'C排气 → TE5 → 吸气管',
            description: '压缩机高压排气 → 防喘振阀节流降压降温 → 返回吸气管路，避免低负荷时压比过高导致喘振'
        },
        {
            name: '冷却回路',
            color: '#8b5cf6',
            path: 'EVA底部 → 泵P → VR → C电机/逆变器 → 返回EVA',
            description: '蒸发器底部液态冷媒 → 冷媒泵加压 → 止回阀 → 冷却压缩机电机和变频器 → 回流至蒸发器'
        },
    ];

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="section-title">冷媒回路图</h1>
                    <p className="text-xl text-slate-400 mb-4">F370853EYC05-O 系统回路详解</p>
                    <div className="flex items-center justify-center gap-4">
                        <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 font-mono text-sm">
                            高压高温气体
                        </div>
                        <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 font-mono text-sm">
                            中压气体
                        </div>
                        <div className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded-lg text-cyan-400 font-mono text-sm">
                            低压气体
                        </div>
                        <div className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-purple-400 font-mono text-sm">
                            液态冷媒
                        </div>
                    </div>
                </motion.div>

                {/* Flow Control */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => setFlowActive(!flowActive)}
                        className="tech-button"
                    >
                        {flowActive ? '⏸ 暂停流动' : '▶ 开始流动'}
                    </button>
                </div>

                {/* Schematic Diagram */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="tech-card mb-12 p-8 overflow-x-auto"
                >
                    <div className="relative min-w-[800px] h-[500px]">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Main Cycle - Red */}
                            <motion.path
                                d="M 20,50 L 30,50 L 80,50 L 80,60 L 72,60 L 65,68 L 55,68 L 50,75 L 38,75 L 20,85 L 20,50"
                                className="schematic-line"
                                stroke="#ef4444"
                                strokeDasharray="2 1"
                                animate={flowActive ? { strokeDashoffset: [0, -20] } : {}}
                                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                            />

                            {/* Economizer Loop - Blue */}
                            <motion.path
                                d="M 72,60 L 65,65 L 58,65 L 50,55 L 30,55"
                                className="schematic-line"
                                stroke="#3b82f6"
                                strokeDasharray="2 1"
                                animate={flowActive ? { strokeDashoffset: [0, -20] } : {}}
                                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', delay: 0.3 }}
                            />

                            {/* Anti-Surge - Orange */}
                            <motion.path
                                d="M 30,50 L 50,35 L 20,45"
                                className="schematic-line"
                                stroke="#f59e0b"
                                strokeDasharray="2 1"
                                animate={flowActive ? { strokeDashoffset: [0, -20] } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 0.6 }}
                            />

                            {/* Cooling Loop - Purple */}
                            <motion.path
                                d="M 15,75 L 15,85 L 18,82 L 18,72"
                                className="schematic-line"
                                stroke="#8b5cf6"
                                strokeDasharray="2 1"
                                animate={flowActive ? { strokeDashoffset: [0, -20] } : {}}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: 0.9 }}
                            />

                            {/* Component Nodes */}
                            {Object.entries(components).map(([key, comp]) => (
                                <g key={key}>
                                    <motion.circle
                                        cx={comp.position.x}
                                        cy={comp.position.y}
                                        r="3"
                                        className="component-node"
                                        whileHover={{ r: 4 }}
                                        onClick={() => setSelectedComponent(comp)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <text
                                        x={comp.position.x}
                                        y={comp.position.y - 5}
                                        className="text-[3px] fill-magnetic-300 font-bold"
                                        textAnchor="middle"
                                    >
                                        {key}
                                    </text>
                                </g>
                            ))}

                            {/* Flow Arrows */}
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="5"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3, 0 6" fill="#0ea5e9" />
                                </marker>
                            </defs>
                        </svg>
                    </div>
                </motion.div>

                {/* Selected Component Details */}
                {selectedComponent && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6 mb-12"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold mb-2">{selectedComponent.fullName}</h3>
                                <p className="text-magnetic-400 font-semibold">{selectedComponent.type}</p>
                            </div>
                            <button
                                onClick={() => setSelectedComponent(null)}
                                className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700"
                            >
                                关闭
                            </button>
                        </div>
                        <p className="text-slate-300 mb-4">{selectedComponent.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedComponent.specs.map((spec, i) => (
                                <div key={i} className="bg-slate-900/50 rounded-lg p-3">
                                    <div className="text-sm text-slate-400">{spec}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Flow Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {flows.map((flow, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="tech-card"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: flow.color }}
                                />
                                <h3 className="text-xl font-bold">{flow.name}</h3>
                            </div>
                            <div className="bg-slate-900/50 rounded-lg p-4 mb-3">
                                <div className="text-xs text-slate-500 mb-1">流程路径</div>
                                <div className="font-mono text-sm" style={{ color: flow.color }}>
                                    {flow.path}
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {flow.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

                {/* Safety Notice */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <AlertCircle className="text-yellow-400 flex-shrink-0 mt-1" size={24} />
                        <div>
                            <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                安全提示
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                本回路图<strong>仅描述图纸 F370853EYC05-O 中明确标注的连接关系</strong>。
                                关键安全装置：<span className="text-yellow-400 font-bold">VA(安全阀)</span> 用于超压保护，
                                <span className="text-yellow-400 font-bold">TE5(防喘振阀)</span> 保护压缩机免受低负荷损害。
                                所有维护和故障诊断必须由专业技术人员进行。
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default RefrigerantCircuit;
