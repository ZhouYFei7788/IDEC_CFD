// src/components/ParameterChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const ParameterChart = ({ data, parameter, label, unit, color = '#3b82f6' }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-full w-full flex items-center justify-center text-slate-500 text-sm">
                正在收集数据...
            </div>
        );
    }

    // 显示所有数据点，但X轴标签间隔显示
    const displayData = data;

    return (
        <div className="w-full h-full bg-slate-900/50 rounded-lg p-3">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        interval="preserveStartEnd"
                        angle={-15}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis
                        stroke="#64748b"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        width={60}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '8px',
                            fontSize: '13px',
                            padding: '8px 12px'
                        }}
                        labelStyle={{ color: '#cbd5e1', fontWeight: 'bold' }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey={parameter}
                        stroke={color}
                        name={`${label} (${unit})`}
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                        activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#1e293b' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ParameterChart;
