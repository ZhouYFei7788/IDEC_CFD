import { useState, useEffect, useRef } from 'react';

// Simple PID Controller
class SimplePID {
    kp: number;
    ki: number;
    kd: number;
    integral: number;
    prevError: number;

    constructor(kp: number, ki: number, kd: number) {
        this.kp = kp;
        this.ki = ki;
        this.kd = kd;
        this.integral = 0;
        this.prevError = 0;
    }

    update(error: number, dt: number) {
        this.integral += error * dt;
        // Anti-windup
        this.integral = Math.max(-100, Math.min(100, this.integral));
        const derivative = (error - this.prevError) / dt;
        this.prevError = error;
        return this.kp * error + this.ki * this.integral + this.kd * derivative;
    }

    reset() {
        this.integral = 0;
        this.prevError = 0;
    }
}

export interface DualColdSourceState {
    compressorActive: boolean;
    highPressure: number;
    lowPressure: number;
    superheat: number;
    coolingWaterIn: number;
    coolingWaterOut: number;
    bypassValveOpening: number;
    highPressureValveOpening: number; // 2-way valve
    eev1Opening: number;
    eev2Opening: number;
    supplyAirTemp: number;
    returnAirTemp: number;
    hotAisleTemp: number;
    compHz: number;
}

export const useDualColdSourcePhysics = (
    mode: 'natural' | 'mechanical' | 'hybrid',
    heatLoad: number, // kW
    supplyTempSet: number, // 目标送风温度 °C
    cwInletTemp: number // 冷却水进水温度 °C (用户手动控制)
) => {
    const initialState: DualColdSourceState = {
        compressorActive: false,
        highPressure: 15.0,
        lowPressure: 5.0,
        superheat: 5.0,
        coolingWaterIn: cwInletTemp,
        coolingWaterOut: cwInletTemp,
        bypassValveOpening: 100,
        highPressureValveOpening: 0,
        eev1Opening: 0,
        eev2Opening: 0,
        supplyAirTemp: 26,
        returnAirTemp: 26,
        hotAisleTemp: 26,
        compHz: 0
    };

    const stateRef = useRef<DualColdSourceState>(initialState);
    const lastTimeRef = useRef(0);
    const valvePidRef = useRef(new SimplePID(2.0, 0.1, 0.5));
    const [stats, setStats] = useState<DualColdSourceState>(initialState);

    // 使用 ref 跟踪可变参数，这样 setInterval 可以读取最新值而不需要重建定时器
    const paramsRef = useRef({ mode, heatLoad, supplyTempSet, cwInletTemp });
    useEffect(() => {
        paramsRef.current = { mode, heatLoad, supplyTempSet, cwInletTemp };
    }, [mode, heatLoad, supplyTempSet, cwInletTemp]);

    // 当模式切换时重置 PID
    useEffect(() => {
        valvePidRef.current.reset();
    }, [mode]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = now;
            }
            const dt = Math.max(0.1, Math.min((now - lastTimeRef.current) / 1000, 2.0));
            lastTimeRef.current = now;

            // 从 ref 读取最新参数 (无需重建 interval)
            const { mode: curMode, heatLoad: curLoad, supplyTempSet: curSet, cwInletTemp: curCwIn } = paramsRef.current;

            const state = stateRef.current;

            // 1. 冷却水进水温度 (用户手动控制，加微小波动)
            const effectiveCwIn = curCwIn + (Math.random() - 0.5) * 0.3;

            // 2. 空气侧动力学
            const airflowCapacity = 20; // kW/K
            const targetHotAisle = state.supplyAirTemp + curLoad / airflowCapacity;

            // 热通道温度惯性跟踪
            state.hotAisleTemp += (targetHotAisle - state.hotAisleTemp) * (dt / 8);

            // 回风温度混合自热通道
            state.returnAirTemp += (state.hotAisleTemp - 1 - state.returnAirTemp) * (dt / 4);

            // 3. 制冷控制逻辑
            let naturalCoolingCapacity = 0;
            let dxCoolingCapacity = 0;
            let targetSupplyTemp = state.returnAirTemp;

            if (curMode === 'natural' || curMode === 'hybrid') {
                // PID 控制二通阀开度
                const error = state.supplyAirTemp - curSet;
                const valveChange = valvePidRef.current.update(error, dt);
                state.highPressureValveOpening = Math.max(0, Math.min(100, state.highPressureValveOpening + valveChange * 2));
                state.bypassValveOpening = Math.max(0, Math.min(100, 100 - state.highPressureValveOpening));

                // 自然冷却能力取决于水温与回风温差
                const deltaT = Math.max(0, state.returnAirTemp - effectiveCwIn);
                const maxWaterCooling = deltaT * 50;
                naturalCoolingCapacity = maxWaterCooling * (state.highPressureValveOpening / 100);

                if (curMode === 'natural') {
                    const minAchievableTemp = effectiveCwIn + 2;
                    const tempDrop = naturalCoolingCapacity / airflowCapacity;
                    targetSupplyTemp = Math.max(minAchievableTemp, state.returnAirTemp - tempDrop);
                }
            } else {
                state.highPressureValveOpening = Math.max(0, state.highPressureValveOpening - 10 * dt);
                state.bypassValveOpening = Math.max(0, Math.min(100, 100 - state.highPressureValveOpening));
                valvePidRef.current.reset();
            }

            if (curMode === 'mechanical' || curMode === 'hybrid') {
                state.compressorActive = true;

                let currentTempIfNoDX = state.returnAirTemp;
                if (curMode === 'hybrid') {
                    const tempDrop = naturalCoolingCapacity / airflowCapacity;
                    currentTempIfNoDX = state.returnAirTemp - tempDrop;
                }

                const dxError = currentTempIfNoDX - curSet;

                if (dxError > 0.5) {
                    state.compHz = Math.min(90, state.compHz + 2 * dt);
                } else if (dxError < -0.5) {
                    state.compHz = Math.max(20, state.compHz - 2 * dt);
                }

                if (dxError < -2) {
                    state.compHz = 0;
                    state.compressorActive = false;
                }

                dxCoolingCapacity = (state.compHz / 90) * 120;
                const dxTempDrop = dxCoolingCapacity / airflowCapacity;
                targetSupplyTemp = currentTempIfNoDX - dxTempDrop;

                if (state.compressorActive && state.compHz > 0) {
                    state.highPressure = 18 + (state.compHz / 90) * 8 + (effectiveCwIn - 25) * 0.2;
                    state.lowPressure = 4 + (targetSupplyTemp - 15) * 0.1;
                    state.superheat = 5 + (Math.random() - 0.5);
                    state.eev1Opening = 30 + (state.compHz / 90) * 60;
                    state.eev2Opening = 30 + (state.compHz / 90) * 60;
                } else {
                    state.highPressure += (12 - state.highPressure) * dt * 0.1;
                    state.lowPressure += (12 - state.lowPressure) * dt * 0.1;
                    state.eev1Opening = 0;
                    state.eev2Opening = 0;
                }
            } else {
                state.compressorActive = false;
                state.compHz = 0;
                state.highPressure += (12 - state.highPressure) * dt * 0.1;
                state.lowPressure += (12 - state.lowPressure) * dt * 0.1;
                state.eev1Opening = 0;
                state.eev2Opening = 0;
            }

            // 送风温度热惯性
            state.supplyAirTemp += (targetSupplyTemp - state.supplyAirTemp) * (dt / 3);

            // 水温
            state.coolingWaterIn = effectiveCwIn;
            if (state.highPressureValveOpening > 0 && (curMode === 'natural' || curMode === 'hybrid')) {
                const waterDeltaT = naturalCoolingCapacity / 25;
                state.coolingWaterOut = effectiveCwIn + waterDeltaT;
            } else if (state.compressorActive) {
                const heatRejected = dxCoolingCapacity * 1.3;
                const waterDeltaT = heatRejected / 25;
                state.coolingWaterOut = effectiveCwIn + waterDeltaT;
            } else {
                state.coolingWaterOut += (effectiveCwIn - state.coolingWaterOut) * dt * 0.1;
            }

            // 触发渲染
            setStats({ ...stateRef.current });
        }, 500);

        return () => clearInterval(timer);
    }, []); // 空依赖：interval 只创建一次，通过 paramsRef 读取最新参数

    return stats;
};
