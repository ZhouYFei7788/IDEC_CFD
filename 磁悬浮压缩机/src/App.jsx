/**
 * 磁悬浮冷水机组仿真平台
 * 基于 TECS2/SL-CA-E 0853-S CFD仿真报告
 */
import React, { useState } from 'react';
import { useCompressorPhysics } from './hooks/useCompressorPhysics';
import ChillerDiagram from './components/ChillerDiagram';
import ControlPanel from './components/ControlPanel';
import ParameterMonitor from './components/ParameterMonitor';

function App() {
    // 控制参数
    const [params, setParams] = useState({
        ambientTemp: 35,         // 室外温度 °C
        waterInletTemp: 12,      // 回水温度 °C
        waterOutletSetpoint: 7,  // 出水设定 °C
        loadPercent: 100,        // 负荷百分比 %
        mode: 'auto'             // 运行模式
    });

    // 物理仿真
    const stats = useCompressorPhysics(params);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* 标题栏 - 简洁版 */}
                <header className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-white">
                        磁悬浮冷水机组仿真平台
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        TECS2/SL-CA-E 0853-S | R134a 制冷循环
                    </p>

                    {/* 系统状态和COP */}
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stats?.running ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm text-slate-400">{stats?.running ? '运行中' : '停机'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-slate-400">COP: </span>
                            <span className="text-green-400 font-bold">{stats?.cop ?? '--'}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-slate-400">制冷量: </span>
                            <span className="text-cyan-400 font-bold">{stats?.capacity ?? '--'} kW</span>
                        </div>
                    </div>
                </header>

                {/* 控制面板 */}
                <div className="mb-4">
                    <ControlPanel params={params} setParams={setParams} stats={stats} />
                </div>

                {/* 交互式系统图 - 居中 */}
                <div className="h-[550px] mb-4">
                    <ChillerDiagram stats={stats} />
                </div>

                {/* 参数监控 */}
                <div>
                    <ParameterMonitor stats={stats} />
                </div>

                {/* 简洁页脚 */}
                <footer className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
                    三压力节点物理仿真 | 防喘振控制 | 闪蒸罐经济器
                </footer>
            </div>
        </div>
    );
}

export default App;
