import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Thermometer, Gauge, Zap, Droplets, Wind } from 'lucide-react';

const TechSpecs = () => {
    const [selectedMode, setSelectedMode] = useState('cooling');

    const performanceData = [
        { load: '10%', cop: 3.2, power: 15, capacity: 48 },
        { load: '25%', cop: 4.5, power: 35, capacity: 158 },
        { load: '50%', cop: 5.8, power: 68, capacity: 394 },
        { load: '75%', cop: 5.5, power: 105, capacity: 578 },
        { load: '100%', cop: 4.8, power: 145, capacity: 696 },
    ];

    const radarData = [
        { subject: '能效', A: 95, fullMark: 100 },
        { subject: '可靠性', A: 98, fullMark: 100 },
        { subject: '静音性', A: 92, fullMark: 100 },
        { subject: '维护性', A: 88, fullMark: 100 },
        { subject: '环保性', A: 100, fullMark: 100 },
        { subject: '智能化', A: 90, fullMark: 100 },
    ];

    const specs = [
        {
            category: '压缩机参数',
            icon: <Zap className="w-6 h-6" />,
            color: 'from-yellow-500 to-orange-500',
            items: [
                { label: '型号', value: 'Turbocor TG310', unit: '' },
                { label: '压缩机类型', value: '离心式磁悬浮', unit: '' },
                { label: '轴承类型', value: '永磁悬浮', unit: 'Active Magnetic Bearing' },
                { label: '润滑方式', value: '无油', unit: 'Oil-Free' },
                { label: '调节范围', value: '10~100', unit: '%' },
                { label: '额定功率', value: '145', unit: 'kW' },
                { label: '电机类型', value: '永磁同步', unit: 'PMSM' },
                { label: '额定转速', value: '18000~48000', unit: 'RPM' },
            ]
        },
        {
            category: '制冷性能',
            icon: <Thermometer className="w-6 h-6" />,
            color: 'from-cyan-500 to-blue-500',
            items: [
                { label: '制冷量', value: '696', unit: 'kW' },
                { label: '额定COP', value: '4.8', unit: '' },
                { label: '最大COP', value: '5.8', unit: '@50%负荷' },
                { label: '冷媒类型', value: 'R134a / R1234ze', unit: '' },
                { label: '蒸发温度', value: '5~15', unit: '°C' },
                { label: '冷凝温度', value: '30~55', unit: '°C' },
                { label: '工作压力', value: '4.5~18', unit: 'bar' },
                { label: 'IPLV', value: '6.2', unit: '' },
            ]
        },
        {
            category: '换热器',
            icon: <Droplets className="w-6 h-6" />,
            color: 'from-blue-500 to-purple-500',
            items: [
                { label: '蒸发器类型', value: '壳管式', unit: 'Shell & Tube' },
                { label: '蒸发器材质', value: '不锈钢 / 铜管', unit: '' },
                { label: '冷凝器类型', value: 'V型翅片', unit: 'Fin & Coil' },
                { label: '冷凝器材质', value: '铜管铝翅片', unit: '' },
                { label: '水流量', value: '120', unit: 'm³/h' },
                { label: '水侧压降', value: '45', unit: 'kPa' },
                { label: '风量', value: '156000', unit: 'm³/h' },
                { label: '风机数量', value: '6', unit: '台' },
            ]
        },
        {
            category: '控制系统',
            icon: <Gauge className="w-6 h-6" />,
            color: 'from-purple-500 to-pink-500',
            items: [
                { label: '控制器', value: 'PLC', unit: 'Siemens S7-1200' },
                { label: '变频器', value: 'VFD', unit: 'ABB ACS880' },
                { label: '通讯协议', value: 'Modbus RTU/TCP', unit: '' },
                { label: '传感器数量', value: '32+', unit: '个' },
                { label: '压力传感器', value: '8', unit: '个' },
                { label: '温度传感器', value: '12', unit: '个' },
                { label: '流量传感器', value: '4', unit: '个' },
                { label: '触摸屏', value: '10.1', unit: '英寸' },
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
                    className="text-center mb-16"
                >
                    <h1 className="section-title">技术规格参数</h1>
                    <p className="text-xl text-slate-400">TECS2/SL-CA-E 0853/5 系列详细技术参数</p>
                </motion.div>

                {/* Performance Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* COP Curve */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="tech-card"
                    >
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Gauge className="text-magnetic-400" />
                            性能曲线 - COP vs 负荷
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={performanceData}>
                                <defs>
                                    <linearGradient id="copGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="load" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Area type="monotone" dataKey="cop" stroke="#0ea5e9" fillOpacity={1} fill="url(#copGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm text-slate-400 text-center">
                            最佳效率点: <span className="text-magnetic-400 font-bold">COP 5.8</span> @ 50%负荷
                        </div>
                    </motion.div>

                    {/* Capacity Curve */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="tech-card"
                    >
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Thermometer className="text-techno-400" />
                            制冷量 & 功率
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={performanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="load" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="capacity" stroke="#d946ef" strokeWidth={3} name="制冷量 (kW)" />
                                <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={3} name="功率 (kW)" />
                            </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-4 text-sm text-slate-400 text-center">
                            额定工况: <span className="text-techno-400 font-bold">696 kW</span> / <span className="text-yellow-400 font-bold">145 kW</span>
                        </div>
                    </motion.div>
                </div>

                {/* Radar Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="tech-card mb-12"
                >
                    <h3 className="text-2xl font-bold mb-6 text-center">综合性能评估</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
                            <PolarRadiusAxis stroke="#94a3b8" />
                            <Radar name="性能指标" dataKey="A" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                {/* Detailed Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {specs.map((spec, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="tech-card"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${spec.color} flex items-center justify-center shadow-lg`}>
                                    {spec.icon}
                                </div>
                                <h3 className="text-2xl font-bold">{spec.category}</h3>
                            </div>

                            <div className="space-y-3">
                                {spec.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                                        <span className="text-slate-400">{item.label}</span>
                                        <span className="font-bold text-right">
                                            <span className="text-magnetic-300">{item.value}</span>
                                            {item.unit && <span className="text-sm text-slate-500 ml-1">{item.unit}</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TechSpecs;
