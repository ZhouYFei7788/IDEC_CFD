import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, PlayCircle, Info } from 'lucide-react';

const OperationalFlows = () => {
    const [selectedFlow, setSelectedFlow] = useState(null);

    const flows = [
        {
            id: 'main',
            name: '主循环流程',
            icon: '🔄',
            color: 'from-red-500 to-orange-500',
            summary: '压缩机 → 冷凝器 → 节流 → 蒸发器 → 返回压缩机',
            steps: [
                {
                    step: 1,
                    component: 'C - 压缩机',
                    action: '吸气 & 压缩',
                    detail: '低压低温冷媒蒸汽从吸气口进入压缩机，通过磁悬浮离心叶轮高速旋转，冷媒被离心压缩成高压高温气体',
                    pressure: '1.5→6.5 bar',
                    temp: '8→75°C',
                    state: '气态→高压气态'
                },
                {
                    step: 2,
                    component: 'VR - 止回阀',
                    action: '单向流通',
                    detail: '高压气体通过止回阀流向冷凝器，防止反向回流',
                    pressure: '6.5 bar',
                    temp: '75°C',
                    state: '高压气态'
                },
                {
                    step: 3,
                    component: 'BC - 冷凝器',
                    action: '冷凝液化',
                    detail: 'V型翅片冷凝器，6台风机强制对流，冷媒向空气放热，从高温高压气体冷凝成中温高压液体',
                    pressure: '6.5 bar',
                    temp: '75→40°C',
                    state: '气态→液态'
                },
                {
                    step: 4,
                    component: 'FE - 过滤器',
                    action: '净化 & 干燥',
                    detail: '过滤冷媒中的杂质和水分，保护膨胀阀和蒸发器',
                    pressure: '6.4 bar',
                    temp: '40°C',
                    state: '纯净液态'
                },
                {
                    step: 5,
                    component: 'VS - 视液镜',
                    action: '状态观察',
                    detail: '通过视液镜观察冷媒流动状态，确认无气泡（满液）和湿度正常（颜色指示）',
                    pressure: '6.4 bar',
                    temp: '40°C',
                    state: '液态'
                },
                {
                    step: 6,
                    component: 'ECO - 经济器',
                    action: '过冷降温',
                    detail: '主液路通过经济器板换，被闪蒸冷媒吸热降温，实现3-5°C过冷度',
                    pressure: '6.3 bar',
                    temp: '40→35°C',
                    state: '过冷液态'
                },
                {
                    step: 7,
                    component: 'TE1/TE2 - 膨胀阀',
                    action: '节流降压',
                    detail: '电子膨胀阀根据蒸发器过热度精确调节开度，使高压液体节流成低压低温湿蒸汽',
                    pressure: '6.3→1.5 bar',
                    temp: '35→5°C',
                    state: '液态→两相'
                },
                {
                    step: 8,
                    component: 'EVA - 蒸发器',
                    action: '蒸发吸热',
                    detail: '低温冷媒在壳管式蒸发器内从冷冻水吸收热量，完全蒸发成饱和或微过热蒸汽，冷冻水从12°C降至7°C',
                    pressure: '1.5 bar',
                    temp: '5→8°C',
                    state: '两相→气态'
                },
                {
                    step: 9,
                    component: 'C - 压缩机吸气',
                    action: '循环往复',
                    detail: '低压蒸汽从蒸发器返回压缩机吸气口，完成一个完整制冷循环',
                    pressure: '1.5 bar',
                    temp: '8°C',
                    state: '低压气态'
                },
            ]
        },
        {
            id: 'economizer',
            name: '经济器循环',
            icon: '⚡',
            color: 'from-blue-500 to-cyan-500',
            summary: '液体分流 → 节流闪蒸 → 中压补气 → 提升COP',
            steps: [
                {
                    step: 1,
                    component: '分流点',
                    action: '液体分支',
                    detail: '从冷凝器出口（FE/VS后）分出20-30%液态冷媒支路，流向经济器膨胀阀',
                    pressure: '6.4 bar',
                    temp: '40°C',
                    state: '液态'
                },
                {
                    step: 2,
                    component: 'TE3/TE4 - 经济器膨胀阀',
                    action: '节流降压',
                    detail: '将高压液体节流至中压（约3-4 bar），温度降低至约20-25°C',
                    pressure: '6.4→3.5 bar',
                    temp: '40→22°C',
                    state: '液态→两相'
                },
                {
                    step: 3,
                    component: 'ECO - 经济器（闪蒸侧）',
                    action: '闪蒸分离',
                    detail: '节流后的两相冷媒进入经济器，液态部分吸收主回路液体热量后闪蒸成气体，实现汽液分离',
                    pressure: '3.5 bar',
                    temp: '22°C',
                    state: '气液分离'
                },
                {
                    step: 4,
                    component: 'ECO - 气体出口',
                    action: '中压气体',
                    detail: '分离出的中压气体（干度高，接近饱和蒸汽）从经济器顶部导出',
                    pressure: '3.5 bar',
                    temp: '22°C',
                    state: '中压气态'
                },
                {
                    step: 5,
                    component: 'C - Eco Port',
                    action: '中压补气',
                    detail: '中压气体注入压缩机中间级（Eco Port），减少压缩机做功，提升循环效率15-20%',
                    pressure: '3.5 bar',
                    temp: '22°C',
                    state: '中压补气'
                },
            ]
        },
        {
            id: 'antisurge',
            name: '防喘振保护',
            icon: '🛡️',
            color: 'from-yellow-500 to-orange-500',
            summary: '低负荷/启动 → 热气旁通 → 保护压缩机',
            steps: [
                {
                    step: 1,
                    component: '触发条件',
                    action: '检测异常',
                    detail: '控制系统检测到压缩机负荷过低（<15%）或压比过高（>设定值），可能导致喘振',
                    pressure: '异常压比',
                    temp: '监测中',
                    state: '保护触发'
                },
                {
                    step: 2,
                    component: 'C - 排气',
                    action: '高压气体',
                    detail: '压缩机排出的高温高压气体',
                    pressure: '6.5+ bar',
                    temp: '75-85°C',
                    state: '高压高温气态'
                },
                {
                    step: 3,
                    component: 'TE5 - 防喘振阀',
                    action: '旁通节流',
                    detail: 'TE5开启（正常时关闭），将部分高压热气旁通，经节流降压降温',
                    pressure: '6.5→1.5 bar',
                    temp: '75→25°C',
                    state: '节流降温'
                },
                {
                    step: 4,
                    component: '吸气管路',
                    action: '返回混合',
                    detail: '降压后的气体返回压缩机吸气管路，与主循环混合，增加吸气流量，避免喘振',
                    pressure: '1.5 bar',
                    temp: '25°C混入',
                    state: '混合气态'
                },
                {
                    step: 5,
                    component: '保护完成',
                    action: '稳定运行',
                    detail: '压缩机恢复稳定工况，TE5逐渐关闭，系统回归正常循环',
                    pressure: '恢复正常',
                    temp: '稳定',
                    state: '正常运行'
                },
            ]
        },
        {
            id: 'cooling',
            name: '压缩机冷却回路',
            icon: '💧',
            color: 'from-purple-500 to-pink-500',
            summary: '蒸发器取液 → 泵送 → 冷却电机/逆变器',
            steps: [
                {
                    step: 1,
                    component: 'EVA - 底部',
                    action: '低温液体',
                    detail: '蒸发器底部积存的低温液态冷媒（满液式设计），温度约5-8°C',
                    pressure: '1.5 bar',
                    temp: '5-8°C',
                    state: '低温液态'
                },
                {
                    step: 2,
                    component: 'P - 冷媒泵',
                    action: '加压输送',
                    detail: '冷媒泵抽取液态冷媒，小流量加压输送至压缩机冷却系统',
                    pressure: '1.5→2.5 bar',
                    temp: '5-8°C',
                    state: '加压液态'
                },
                {
                    step: 3,
                    component: 'VR - 止回阀',
                    action: '单向流通',
                    detail: '止回阀确保冷媒单向流向压缩机，防止回流',
                    pressure: '2.5 bar',
                    temp: '5-8°C',
                    state: '液态'
                },
                {
                    step: 4,
                    component: 'C - 电机冷却',
                    action: '吸收电机热',
                    detail: '液态冷媒流经压缩机电机绕组，吸收电机运行产生的热量（铜损、铁损）',
                    pressure: '2.3 bar',
                    temp: '8→25°C',
                    state: '加热液态'
                },
                {
                    step: 5,
                    component: 'C - 逆变器冷却',
                    action: '吸收电子热',
                    detail: '冷媒继续流经变频器功率模块，带走IGBT等电子元件热量',
                    pressure: '2.2 bar',
                    temp: '25→35°C',
                    state: '升温液态'
                },
                {
                    step: 6,
                    component: '返回 EVA',
                    action: '回流蒸发',
                    detail: '吸热后的温冷媒返回蒸发器，在蒸发器内继续参与主循环蒸发过程',
                    pressure: '1.5 bar',
                    temp: '35°C→蒸发',
                    state: '回流蒸发'
                },
            ]
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
                    <h1 className="section-title">工作流程</h1>
                    <p className="text-xl text-slate-400">系统运行逻辑与流向详解</p>
                </motion.div>

                {/* Flow Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {flows.map((flow, index) => (
                        <motion.div
                            key={flow.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedFlow(flow)}
                            className="tech-card cursor-pointer group hover:scale-[1.02] transition-transform"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${flow.color} flex items-center justify-center shadow-xl text-3xl`}>
                                    {flow.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-2">{flow.name}</h3>
                                    <p className="text-slate-400 text-sm">{flow.summary}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                <span className="text-sm text-slate-500">
                                    {flow.steps.length} 个步骤
                                </span>
                                <div className="flex items-center gap-2 text-magnetic-400 group-hover:translate-x-2 transition-transform">
                                    <span className="text-sm font-semibold">查看详情</span>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Detailed Flow View */}
                <AnimatePresence mode="wait">
                    {selectedFlow && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="glass-panel p-8"
                        >
                            {/* Flow Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${selectedFlow.color} flex items-center justify-center shadow-xl text-3xl`}>
                                        {selectedFlow.icon}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-1">{selectedFlow.name}</h2>
                                        <p className="text-slate-400">{selectedFlow.summary}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedFlow(null)}
                                    className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                                >
                                    关闭
                                </button>
                            </div>

                            {/* Steps Timeline */}
                            <div className="relative">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-magnetic-500 via-techno-500 to-magnetic-500"></div>

                                {/* Steps */}
                                <div className="space-y-6">
                                    {selectedFlow.steps.map((step, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="relative pl-20"
                                        >
                                            {/* Step Number */}
                                            <div className={`absolute left-0 w-16 h-16 rounded-xl bg-gradient-to-br ${selectedFlow.color} flex items-center justify-center shadow-xl`}>
                                                <span className="text-2xl font-bold text-white">{step.step}</span>
                                            </div>

                                            {/* Step Content */}
                                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="text-xl font-bold mb-1">{step.component}</h4>
                                                        <p className="text-magnetic-400 font-semibold">{step.action}</p>
                                                    </div>
                                                    <Info className="text-slate-500" size={20} />
                                                </div>

                                                <p className="text-slate-300 mb-4 leading-relaxed">
                                                    {step.detail}
                                                </p>

                                                <div className="grid grid-cols-3 gap-4">
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <div className="text-xs text-slate-500 mb-1">压力</div>
                                                        <div className="font-mono text-sm text-cyan-400">{step.pressure}</div>
                                                    </div>
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <div className="text-xs text-slate-500 mb-1">温度</div>
                                                        <div className="font-mono text-sm text-orange-400">{step.temp}</div>
                                                    </div>
                                                    <div className="bg-slate-800/50 rounded-lg p-3">
                                                        <div className="text-xs text-slate-500 mb-1">状态</div>
                                                        <div className="font-mono text-sm text-purple-400">{step.state}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Prompt */}
                {!selectedFlow && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-slate-500 flex items-center justify-center gap-2"
                    >
                        <PlayCircle size={20} />
                        <span>点击上方卡片查看详细流程</span>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default OperationalFlows;
