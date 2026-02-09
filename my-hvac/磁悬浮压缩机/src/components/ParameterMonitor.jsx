import React from 'react';
import { Gauge, Thermometer, Droplets, Zap, Activity } from 'lucide-react';

/**
 * 参数卡片组件 - 简洁版
 */
const ParamCard = ({ label, value, unit, color, warning }) => (
    <div className={`text-center p-2 ${warning ? 'text-red-400' : ''}`}>
        <div className="text-xs text-slate-500">{label}</div>
        <div className={`text-lg font-bold ${color}`}>{value ?? '--'}</div>
        <div className="text-xs text-slate-600">{unit}</div>
    </div>
);

/**
 * 实时参数监控面板 - 简洁版
 */
export default function ParameterMonitor({ stats }) {
    const surgeWarning = stats?.surgeStatus === 'control' || stats?.surgeStatus === 'emergency';

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 压缩机参数 */}
                <div>
                    <h4 className="text-xs font-semibold text-cyan-400 mb-2 text-center border-b border-slate-800 pb-2">
                        压缩机
                    </h4>
                    <div className="grid grid-cols-4 gap-1">
                        <ParamCard label="转速" value={stats?.compSpeed} unit="RPM" color="text-cyan-400" />
                        <ParamCard label="频率" value={stats?.compFreq} unit="Hz" color="text-cyan-400" />
                        <ParamCard label="功率" value={stats?.compPower} unit="kW" color="text-yellow-400" />
                        <ParamCard label="电机温度" value={stats?.motorTemp} unit="°C" color="text-orange-400" warning={stats?.motorTemp > 70} />
                    </div>

                    {/* 磁悬浮轴承 */}
                    <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-3 gap-1 text-center text-xs">
                        <div>
                            <div className="text-slate-500">轴向位移</div>
                            <div className="text-cyan-400 font-mono">{stats?.axialPosition ?? 0} μm</div>
                        </div>
                        <div>
                            <div className="text-slate-500">径向位移</div>
                            <div className="text-cyan-400 font-mono">{stats?.radialPosition ?? 0} μm</div>
                        </div>
                        <div>
                            <div className="text-slate-500">轴承电流</div>
                            <div className="text-cyan-400 font-mono">{stats?.bearingCurrent ?? 0} A</div>
                        </div>
                    </div>
                </div>

                {/* 制冷循环参数 */}
                <div>
                    <h4 className="text-xs font-semibold text-purple-400 mb-2 text-center border-b border-slate-800 pb-2">
                        制冷循环
                    </h4>

                    {/* 三压力显示 */}
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="bg-red-500/10 rounded p-2 text-center">
                            <div className="text-xs text-slate-500">高压 Pc</div>
                            <div className="text-sm font-bold text-red-400">{stats?.highPressure ?? 0}</div>
                            <div className="text-xs text-slate-600">kPa</div>
                        </div>
                        <div className="bg-purple-500/10 rounded p-2 text-center">
                            <div className="text-xs text-slate-500">中压 Pm</div>
                            <div className="text-sm font-bold text-purple-400">{stats?.midPressure ?? 0}</div>
                            <div className="text-xs text-slate-600">kPa</div>
                        </div>
                        <div className="bg-blue-500/10 rounded p-2 text-center">
                            <div className="text-xs text-slate-500">低压 Pe</div>
                            <div className="text-sm font-bold text-blue-400">{stats?.lowPressure ?? 0}</div>
                            <div className="text-xs text-slate-600">kPa</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                        <div>
                            <span className="text-slate-500">压比: </span>
                            <span className="text-purple-400 font-bold">{stats?.pressureRatio ?? '--'}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">喘振裕度: </span>
                            <span className={`font-bold ${surgeWarning ? 'text-red-400' : 'text-green-400'}`}>
                                {stats?.surgeMargin ?? '--'}%
                            </span>
                        </div>
                    </div>

                    {/* 防喘振状态 */}
                    {surgeWarning && (
                        <div className={`mt-2 p-1.5 rounded text-xs text-center ${stats?.surgeStatus === 'emergency' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                            {stats?.surgeStatus === 'emergency' ? '⚠️ 紧急防喘振' : '⚡ 防喘振中'} TE5: {stats?.te5Opening}%
                        </div>
                    )}
                </div>

                {/* 换热器参数 */}
                <div>
                    <h4 className="text-xs font-semibold text-blue-400 mb-2 text-center border-b border-slate-800 pb-2">
                        换热器
                    </h4>
                    <div className="grid grid-cols-4 gap-1">
                        <ParamCard label="冷凝温度" value={stats?.condTemp} unit="°C" color="text-red-400" />
                        <ParamCard label="蒸发温度" value={stats?.evapTemp} unit="°C" color="text-blue-400" />
                        <ParamCard label="过热度" value={stats?.superheat} unit="°C" color="text-cyan-400" warning={stats?.superheat < 3} />
                        <ParamCard label="过冷度" value={stats?.subcool} unit="°C" color="text-orange-400" />
                    </div>

                    {/* 膨胀阀和液位 */}
                    <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-5 gap-1 text-center text-xs">
                        {['TE1', 'TE2', 'TE3', 'TE4', 'TE5'].map((te, i) => {
                            const value = stats?.[`te${i + 1}Opening`] ?? 0;
                            const isTE5 = te === 'TE5';
                            return (
                                <div key={te}>
                                    <div className="text-slate-500">{te}</div>
                                    <div className={isTE5 && value > 0 ? 'text-red-400' : 'text-slate-300'}>{value}%</div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 text-center text-xs">
                        <div>
                            <span className="text-slate-500">蒸发器液位: </span>
                            <span className="text-blue-400 font-bold">{stats?.evaLevel ?? 0}%</span>
                        </div>
                        <div>
                            <span className="text-slate-500">经济器液位: </span>
                            <span className="text-purple-400 font-bold">{stats?.ecoLevel ?? 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
