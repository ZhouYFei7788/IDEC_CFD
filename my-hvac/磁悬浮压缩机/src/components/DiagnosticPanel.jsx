import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, Search, Shield } from 'lucide-react';

const DiagnosticPanel = () => {
    const [selectedFault, setSelectedFault] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const faults = [
        {
            id: 'F001',
            name: '压缩机喘振',
            severity: 'P0',
            icon: '⚠️',
            color: 'red',
            symptoms: ['压缩机异常振动', '噪音突然增大', '压比过高', '流量过低'],
            causes: [
                '负荷过低（<15%）',
                '吸气管路堵塞',
                'TE5防喘振阀故障未开启',
                '蒸发器换热不足',
            ],
            diagnosis: [
                '检查当前负荷百分比',
                '监测压缩机振动传感器',
                '检查吸排气压力',
                '确认TE5阀门状态',
            ],
            solutions: [
                '立即开启TE5热气旁通阀',
                '降低压缩机转速',
                '检查并清理吸气过滤器',
                '增加蒸发器水流量',
            ],
            relatedComponents: ['C', 'TE5', 'EVA'],
            safetyLevel: 'P0 - 立即停机'
        },
        {
            id: 'F002',
            name: '压缩机过载',
            severity: 'P0',
            icon: '🔥',
            color: 'red',
            symptoms: ['电流超过额定值', '电机温度过高', '逆变器报警', '功率异常'],
            causes: [
                '冷凝压力过高',
                '蒸发压力过低',
                '冷媒充注过量',
                '风机故障导致散热不良',
            ],
            diagnosis: [
                '读取变频器电流值',
                '检测电机绕组温度',
                '测量冷凝器压力',
                '检查风机运行状态',
            ],
            solutions: [
                '立即降低负荷或停机',
                '检查冷凝器风机全部运行',
                '清洗冷凝器翅片',
                '检查冷媒充注量',
            ],
            relatedComponents: ['C', 'BC', '风机'],
            safetyLevel: 'P0 - 立即降负荷'
        },
        {
            id: 'F003',
            name: '高压报警',
            severity: 'P1',
            icon: '📈',
            color: 'orange',
            symptoms: ['排气压力>设定值', '冷凝温度高', '压缩机功率高', '系统COP下降'],
            causes: [
                '冷凝器换热不足',
                '风机故障（1台或多台）',
                '环境温度过高',
                '冷凝器翅片堵塞',
                '冷媒过量',
            ],
            diagnosis: [
                '测量排气压力（应<18 bar）',
                '检查6台风机运行状态',
                '测量环境温度',
                '目视检查翅片清洁度',
            ],
            solutions: [
                '确认6台风机全部运行',
                '清洗冷凝器翅片',
                '检查风机电机和电容',
                '必要时放出多余冷媒',
            ],
            relatedComponents: ['BC', '风机', '压力传感器'],
            safetyLevel: 'P1 - 60s后停机'
        },
        {
            id: 'F004',
            name: '低压报警',
            severity: 'P1',
            icon: '📉',
            color: 'orange',
            symptoms: ['吸气压力过低', '蒸发温度低', '可能结冰', '制冷量下降'],
            causes: [
                '冷媒泄漏或不足',
                '膨胀阀TE1/TE2开度过小',
                '过滤器FE堵塞',
                '蒸发器水流量不足',
            ],
            diagnosis: [
                '测量吸气压力（应>1.0 bar）',
                '检查视液镜VS是否有气泡',
                '测量FE前后压差',
                '检查水流量和水泵',
            ],
            solutions: [
                '检漏并补充冷媒',
                '增大TE1/TE2开度',
                '更换堵塞的FE过滤器',
                '检查水系统流量',
            ],
            relatedComponents: ['EVA', 'TE1', 'TE2', 'FE', 'VS'],
            safetyLevel: 'P1 - 延时报警'
        },
        {
            id: 'F005',
            name: '经济器效率低',
            severity: 'P2',
            icon: '⚡',
            color: 'yellow',
            symptoms: ['COP未提升', '过冷度不足', '中压异常', '节能效果差'],
            causes: [
                'TE3/TE4开度不当',
                '经济器ECO汽液分离不良',
                '中压管路泄漏',
                '主回路流量分配不合理',
            ],
            diagnosis: [
                '测量主液路过冷度（应3-5°C）',
                '测量中压压力（应3-4 bar）',
                '检查TE3/TE4开度',
                '对比开启/关闭经济器时COP',
            ],
            solutions: [
                '调整TE3/TE4开度至最优',
                '检查ECO内部状态',
                '检漏中压管路',
                '优化控制逻辑',
            ],
            relatedComponents: ['ECO', 'TE3', 'TE4'],
            safetyLevel: 'P2 - 性能优化'
        },
        {
            id: 'F006',
            name: '磁悬浮轴承异常',
            severity: 'P0',
            icon: '🧲',
            color: 'red',
            symptoms: ['轴承位移信号异常', '备用轴承接触报警', '运行不稳定', '异响'],
            causes: [
                '磁悬浮控制器故障',
                '位移传感器故障',
                '电源电压波动',
                '转子不平衡',
            ],
            diagnosis: [
                '读取磁悬浮控制器诊断代码',
                '检查5轴位移传感器信号',
                '测量供电电压稳定性',
                '检查转子平衡状态',
            ],
            solutions: [
                '立即停机检查',
                '联系Turbocor技术支持',
                '更换故障传感器',
                '检查供电质量',
                '必要时送厂维修',
            ],
            relatedComponents: ['C - 磁悬浮系统', '控制器'],
            safetyLevel: 'P0 - 立即停机'
        },
        {
            id: 'F007',
            name: '电机/逆变器过热',
            severity: 'P1',
            icon: '🌡️',
            color: 'orange',
            symptoms: ['电机温度>设定值', '逆变器降额运行', '冷却系统报警'],
            causes: [
                '冷媒泵P故障',
                '冷却回路堵塞',
                '蒸发器液位不足',
                '环境温度过高',
            ],
            diagnosis: [
                '检测电机绕组温度',
                '检测逆变器模块温度',
                '检查冷媒泵P运行状态',
                '检查蒸发器液位',
            ],
            solutions: [
                '确认冷媒泵P正常运行',
                '检查冷却回路VR止回阀',
                '确保蒸发器满液',
                '降低负荷或停机冷却',
            ],
            relatedComponents: ['C - 电机', 'P', 'EVA'],
            safetyLevel: 'P1 - 降负荷运行'
        },
        {
            id: 'F008',
            name: '水温传感器故障',
            severity: 'P2',
            icon: '🌡️',
            color: 'yellow',
            symptoms: ['S1/S2读数异常', '温差计算错误', '控制逻辑混乱'],
            causes: [
                '传感器损坏',
                '接线松动或短路',
                '传感器探头脱落',
                '控制器输入故障',
            ],
            diagnosis: [
                '测量S1/S2电阻值（PT1000）',
                '检查接线端子',
                '对比实际水温',
                '更换传感器测试',
            ],
            solutions: [
                '重新紧固接线',
                '更换故障传感器',
                '校准传感器',
                '检查控制器输入模块',
            ],
            relatedComponents: ['S1', 'S2', '控制器'],
            safetyLevel: 'P2 - 影响控制精度'
        },
    ];

    const filteredFaults = faults.filter(fault =>
        fault.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fault.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fault.symptoms.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'P0': return 'bg-red-500/20 text-red-400 border-red-500/50';
            case 'P1': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
            case 'P2': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    const getIconColor = (color) => {
        switch (color) {
            case 'red': return 'from-red-500 to-rose-500';
            case 'orange': return 'from-orange-500 to-amber-500';
            case 'yellow': return 'from-yellow-500 to-orange-400';
            default: return 'from-slate-500 to-slate-600';
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="section-title">故障诊断中心</h1>
                    <p className="text-xl text-slate-400">专业故障分析与解决方案</p>
                </motion.div>

                {/* Safety Notice */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8"
                >
                    <div className="flex items-start gap-4">
                        <Shield className="text-red-400 flex-shrink-0 mt-1" size={24} />
                        <div>
                            <h4 className="font-bold text-red-400 mb-2">安全警示</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                所有故障诊断和维修操作必须由<strong className="text-red-400">具备资质的专业技术人员</strong>进行。
                                P0级别故障需要<strong className="text-red-400">立即停机</strong>，P1级别延时停机，P2级别影响性能但可继续运行。
                                涉及制冷剂的操作需遵守相关法规，使用专业工具和防护装备。
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Search */}
                <div className="mb-8">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="搜索故障代码、名称、症状..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-magnetic-500 focus:outline-none transition-colors text-lg"
                        />
                    </div>
                </div>

                {/* Fault Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {filteredFaults.map((fault, index) => (
                        <motion.div
                            key={fault.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedFault(fault)}
                            className="tech-card cursor-pointer group hover:scale-[1.02] transition-transform"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIconColor(fault.color)} flex items-center justify-center shadow-lg text-2xl`}>
                                        {fault.icon}
                                    </div>
                                    <div>
                                        <div className="font-mono text-xs text-slate-500">{fault.id}</div>
                                        <div className="font-bold text-lg">{fault.name}</div>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold mb-4 ${getSeverityColor(fault.severity)}`}>
                                {fault.severity} - {fault.safetyLevel}
                            </div>

                            <div className="mb-4">
                                <div className="text-xs text-slate-500 mb-2">典型症状</div>
                                <div className="space-y-1">
                                    {fault.symptoms.slice(0, 3).map((symptom, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-red-400 mt-0.5">▸</span>
                                            <span className="text-slate-400">{symptom}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                                <span className="text-xs text-slate-500">
                                    {fault.solutions.length} 个解决方案
                                </span>
                                <span className="text-sm text-magnetic-400 font-semibold group-hover:translate-x-1 transition-transform">
                                    查看详情 →
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Detailed Fault View */}
                {selectedFault && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-8"
                    >
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getIconColor(selectedFault.color)} flex items-center justify-center shadow-xl text-4xl`}>
                                    {selectedFault.icon}
                                </div>
                                <div>
                                    <div className="font-mono text-sm text-slate-500 mb-1">{selectedFault.id}</div>
                                    <h2 className="text-3xl font-bold mb-2">{selectedFault.name}</h2>
                                    <div className={`inline-block px-4 py-1.5 rounded-lg border font-mono text-sm font-bold ${getSeverityColor(selectedFault.severity)}`}>
                                        {selectedFault.severity} - {selectedFault.safetyLevel}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFault(null)}
                                className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors font-semibold"
                            >
                                关闭
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Symptoms */}
                            <div className="bg-slate-900/50 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertTriangle className="text-red-400" size={20} />
                                    <h3 className="font-bold text-lg">症状表现</h3>
                                </div>
                                <ul className="space-y-2">
                                    {selectedFault.symptoms.map((symptom, i) => (
                                        <li key={i} className="flex items-start gap-2 text-slate-300">
                                            <span className="text-red-400 mt-1">●</span>
                                            <span>{symptom}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Causes */}
                            <div className="bg-slate-900/50 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <XCircle className="text-orange-400" size={20} />
                                    <h3 className="font-bold text-lg">可能原因</h3>
                                </div>
                                <ul className="space-y-2">
                                    {selectedFault.causes.map((cause, i) => (
                                        <li key={i} className="flex items-start gap-2 text-slate-300">
                                            <span className="text-orange-400 mt-1">●</span>
                                            <span>{cause}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Diagnosis */}
                            <div className="bg-slate-900/50 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="text-blue-400" size={20} />
                                    <h3 className="font-bold text-lg">诊断步骤</h3>
                                </div>
                                <ol className="space-y-2">
                                    {selectedFault.diagnosis.map((step, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300">
                                            <span className="text-blue-400 font-bold mt-0.5">{i + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Solutions */}
                            <div className="bg-slate-900/50 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle className="text-green-400" size={20} />
                                    <h3 className="font-bold text-lg">解决方案</h3>
                                </div>
                                <ol className="space-y-2">
                                    {selectedFault.solutions.map((solution, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300">
                                            <span className="text-green-400 font-bold mt-0.5">{i + 1}.</span>
                                            <span>{solution}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {/* Related Components */}
                        <div className="mt-8 pt-8 border-t border-slate-800">
                            <h4 className="font-bold mb-3 flex items-center gap-2">
                                <span className="text-magnetic-400">🔗</span>
                                相关组件
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedFault.relatedComponents.map((comp, i) => (
                                    <span
                                        key={i}
                                        className="px-4 py-2 bg-magnetic-500/20 border border-magnetic-500/50 rounded-lg text-magnetic-300 font-mono text-sm"
                                    >
                                        {comp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* No Results */}
                {filteredFaults.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <div className="text-xl text-slate-400">未找到匹配的故障</div>
                        <div className="text-sm text-slate-500 mt-2">请尝试其他搜索关键词</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagnosticPanel;
