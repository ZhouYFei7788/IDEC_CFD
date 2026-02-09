import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter } from 'lucide-react';

const ComponentLibrary = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');

    const componentData = [
        {
            id: 'C',
            name: '压缩机',
            category: 'compressor',
            icon: '🔄',
            model: 'Turbocor TG310',
            description: '磁悬浮离心式无油压缩机',
            features: ['无油设计', '磁悬浮轴承', 'Eco Port中压口', '变频调速'],
            specs: {
                '类型': 'Centrifugal离心式',
                '功率': '145 kW',
                '转速': '18000-48000 RPM',
                '压缩比': '2.5-4.5',
                '调节': '10-100%',
                '噪音': '58-65 dB(A)'
            }
        },
        {
            id: 'BC',
            name: '冷凝器',
            category: 'heat_exchanger',
            icon: '🌬️',
            model: 'V-Shape Fin&Coil',
            description: 'V型翅片式风冷冷凝器',
            features: ['V型布局', '铜管铝翅片', '6台风机', '高效换热'],
            specs: {
                '类型': 'Fin & Coil',
                '换热面积': '285 m²',
                '风量': '156000 m³/h',
                '风机数': '6台',
                '风机功率': '3.0 kW/台',
                '材质': '铜管铝翅片'
            }
        },
        {
            id: 'EVA',
            name: '蒸发器',
            category: 'heat_exchanger',
            icon: '❄️',
            model: 'Shell & Tube',
            description: '壳管式满液蒸发器',
            features: ['满液式设计', '不锈钢外壳', '水温传感器S1/S2', '高效传热'],
            specs: {
                '类型': 'Shell & Tube',
                '水流量': '120 m³/h',
                '进出水温差': '12/7°C',
                '水侧压降': '45 kPa',
                '材质': '不锈钢/铜管',
                '传感器': 'S1 S2'
            }
        },
        {
            id: 'ECO',
            name: '经济器',
            category: 'economizer',
            icon: '⚡',
            model: 'Flash Tank / PHEX',
            description: '闪蒸式经济器或板换式',
            features: ['液体过冷', '中压补气', '提升COP', '节能15-20%'],
            specs: {
                '类型': 'Flash Tank',
                '过冷度': '3-5°C',
                '效率提升': '15-20%',
                '中压级数': '1级',
                '容积': '适配系统',
                '汽液分离': '高效'
            }
        },
        {
            id: 'TE1',
            name: '主膨胀阀 TE1',
            category: 'valve',
            icon: '🎚️',
            model: 'EEV',
            description: '电子膨胀阀 - 主回路1',
            features: ['电子控制', '过热度调节', '精确节流', '快速响应'],
            specs: {
                '类型': 'Electronic EEV',
                '控制方式': '过热度控制',
                '调节范围': '0-100%',
                '步数': '500步',
                '响应时间': '<2s',
                '控制精度': '±0.5°C'
            }
        },
        {
            id: 'TE3',
            name: '经济器膨胀阀 TE3',
            category: 'valve',
            icon: '🎚️',
            model: 'EEV - Economizer',
            description: '经济器电子膨胀阀',
            features: ['控制过冷度', '优化中压', '独立调节', '节能优化'],
            specs: {
                '类型': 'Electronic EEV',
                '控制目标': '过冷度',
                '流量比': '20-30%',
                '中压优化': '是',
                '联动控制': 'TE4',
                '调节精度': '高'
            }
        },
        {
            id: 'TE5',
            name: '防喘振阀 TE5',
            category: 'safety',
            icon: '🛡️',
            model: 'Anti-Surge Valve',
            description: '热气旁通电子膨胀阀',
            features: ['压缩机保护', '防喘振', '低负荷保护', 'P0安全级'],
            specs: {
                '类型': 'Hot Gas Bypass',
                '触发条件': '压比过高',
                '旁通路径': '排气→吸气',
                '响应时间': '<1s',
                '安全等级': 'P0',
                '保护功能': '喘振保护'
            }
        },
        {
            id: 'FE',
            name: '过滤器',
            category: 'auxiliary',
            icon: '🔬',
            model: 'Filter Drier',
            description: '干燥过滤器',
            features: ['过滤杂质', '吸收水分', '保护系统', '定期更换'],
            specs: {
                '过滤精度': '25μm',
                '吸湿能力': '强',
                '更换周期': '2年',
                '压降': '<10 kPa',
                '容量': '标准',
                '指示': '压差开关'
            }
        },
        {
            id: 'VS',
            name: '视液镜',
            category: 'auxiliary',
            icon: '👁️',
            model: 'Sight Glass',
            description: '液态指示器带湿度指示',
            features: ['液态观察', '气泡检测', '湿度指示', '变色警示'],
            specs: {
                '功能': '气泡+湿度',
                '湿度指示': '变色',
                '材质': '耐压玻璃',
                '可视性': '优',
                '安装位置': 'FE后',
                '压力等级': '高压'
            }
        },
        {
            id: 'P',
            name: '冷媒泵',
            category: 'auxiliary',
            icon: '💧',
            model: 'Refrigerant Pump',
            description: '压缩机冷却用冷媒泵',
            features: ['电机冷却', '逆变器冷却', '液态循环', '独立回路'],
            specs: {
                '用途': '电机/逆变器冷却',
                '流量': '小流量',
                '扬程': '中等',
                '取液点': 'EVA底部',
                '回流': 'EVA',
                '类型': '离心泵'
            }
        },
        {
            id: 'VR',
            name: '止回阀',
            category: 'valve',
            icon: '◀️',
            model: 'Check Valve',
            description: '单向止回阀',
            features: ['防倒流', '流向控制', '多点布置', '可靠关断'],
            specs: {
                '数量': '多个',
                '位置': '关键节点',
                '压降': '最小',
                '密封性': '优',
                '类型': '弹簧式',
                '开启压差': '低'
            }
        },
        {
            id: 'S1_S2',
            name: '温度传感器',
            category: 'sensor',
            icon: '🌡️',
            model: 'PT1000',
            description: '水温传感器 S1(进水) S2(出水)',
            features: ['高精度', '快速响应', '抗腐蚀', '长期稳定'],
            specs: {
                '类型': 'PT1000',
                '精度': '±0.1°C',
                '响应时间': '<5s',
                '量程': '-50~150°C',
                'S1': '进水温度',
                'S2': '出水温度'
            }
        },
    ];

    const categories = [
        { id: 'all', name: '全部组件', icon: '📦' },
        { id: 'compressor', name: '压缩机', icon: '🔄' },
        { id: 'heat_exchanger', name: '换热器', icon: '🌬️' },
        { id: 'valve', name: '阀门', icon: '🎚️' },
        { id: 'economizer', name: '经济器', icon: '⚡' },
        { id: 'auxiliary', name: '辅助设备', icon: '🔧' },
        { id: 'sensor', name: '传感器', icon: '🌡️' },
        { id: 'safety', name: '安全装置', icon: '🛡️' },
    ];

    const filteredComponents = componentData.filter(comp => {
        const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            comp.model.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'all' || comp.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="section-title">组件库</h1>
                    <p className="text-xl text-slate-400">F370853EYC05-O 回路所有组件详细说明</p>
                </motion.div>

                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="搜索组件名称、型号、描述..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:border-magnetic-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(cat.id)}
                                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${filterCategory === cat.id
                                        ? 'bg-magnetic-500 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <span>{cat.icon}</span>
                                <span className="text-sm">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-6 text-slate-400 text-sm">
                    找到 <span className="text-magnetic-400 font-bold">{filteredComponents.length}</span> 个组件
                </div>

                {/* Components Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredComponents.map((comp, index) => (
                        <motion.div
                            key={comp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="tech-card group"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">{comp.icon}</div>
                                    <div>
                                        <div className="font-bold text-lg">{comp.name}</div>
                                        <div className="text-xs text-magnetic-400 font-mono">{comp.id}</div>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">
                                    {categories.find(c => c.id === comp.category)?.name}
                                </div>
                            </div>

                            {/* Model */}
                            <div className="bg-gradient-to-r from-magnetic-500/10 to-techno-500/10 border border-magnetic-500/30 rounded-lg p-3 mb-4">
                                <div className="text-xs text-slate-500 mb-1">型号/类型</div>
                                <div className="font-bold text-magnetic-300">{comp.model}</div>
                            </div>

                            {/* Description */}
                            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                                {comp.description}
                            </p>

                            {/* Features */}
                            <div className="mb-4">
                                <div className="text-xs text-slate-500 mb-2">特性</div>
                                <div className="flex flex-wrap gap-1">
                                    {comp.features.map((feature, i) => (
                                        <span
                                            key={i}
                                            className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Specs */}
                            <div className="border-t border-slate-800 pt-4">
                                <div className="text-xs text-slate-500 mb-2">技术参数</div>
                                <div className="space-y-1">
                                    {Object.entries(comp.specs).map(([key, value], i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-slate-500">{key}</span>
                                            <span className="text-slate-300 font-mono">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* No Results */}
                {filteredComponents.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <div className="text-xl text-slate-400">未找到匹配的组件</div>
                        <div className="text-sm text-slate-500 mt-2">请尝试其他搜索关键词或筛选条件</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComponentLibrary;
