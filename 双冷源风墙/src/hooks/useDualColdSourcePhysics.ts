import { useEffect, useRef, useState } from 'react';

type EffectiveCoolingMode = 'natural' | 'mechanical' | 'hybrid';
type CoolingMode = EffectiveCoolingMode | 'auto';

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
        this.integral = clamp(this.integral, -120, 120);
        const derivative = dt > 0 ? (error - this.prevError) / dt : 0;
        this.prevError = error;
        return this.kp * error + this.ki * this.integral + this.kd * derivative;
    }

    reset() {
        this.integral = 0;
        this.prevError = 0;
    }
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const rampTo = (current: number, target: number, maxStep: number) => {
    const delta = clamp(target - current, -maxStep, maxStep);
    return current + delta;
};

const saturationVaporPressure = (temperatureC: number) => 6.112 * Math.exp((17.67 * temperatureC) / (temperatureC + 243.5));

const rhFromAbsoluteHumidity = (temperatureC: number, absoluteHumidity: number) => {
    const partialPressure = (absoluteHumidity * 1013.25) / (621.97 + absoluteHumidity);
    const saturationPressure = saturationVaporPressure(temperatureC);
    if (saturationPressure <= 0) {
        return 50;
    }
    return (partialPressure / saturationPressure) * 100;
};

const heatExchangerEffectiveness = (cHot: number, cCold: number, ua: number) => {
    const cMin = Math.min(cHot, cCold);
    const cMax = Math.max(cHot, cCold);
    if (cMin <= 0 || cMax <= 0 || ua <= 0) {
        return 0;
    }

    const cr = clamp(cMin / cMax, 1e-6, 0.999);
    const ntu = ua / cMin;

    // Counter-flow epsilon-NTU relation.
    const numerator = 1 - Math.exp(-ntu * (1 - cr));
    const denominator = 1 - cr * Math.exp(-ntu * (1 - cr));
    if (denominator <= 0) {
        return clamp(1 - Math.exp(-ntu), 0, 1);
    }
    return clamp(numerator / denominator, 0, 1);
};

const MIN_FAN_RPM = 580;
const MAX_FAN_RPM = 1450;
const MIN_NATURAL_VALVE_OPENING = 5;
const MECHANICAL_COIL_LEAK_FRACTION = 0.03;
const COMPRESSOR_COUNT = 4;
const COMP_SET_RPM = 3000;
const COMP_MIN_RPM = 1200;
const COMP_MAX_RPM = 6000;
const COMP_PLATFORM_SECONDS = 180;
const DEHUMIDIFY_COMP_RPM = 3600;
const EMERGENCY_TEMP_SETPOINT = 38;

const AIR_CP = 1.005; // kJ/(kg*K) -> kW/K for kg/s
const WATER_CP = 4.186;
const NATURAL_COIL_UA_MIN = 8;
const NATURAL_COIL_UA_MAX = 28;
const EVAP_UA_MIN = 7;
const EVAP_UA_MAX = 22;

const initialEffectiveMode = (mode: CoolingMode): EffectiveCoolingMode => (mode === 'auto' ? 'hybrid' : mode);

const computeCfcDemand = (
    supplyAirTemp: number,
    returnAirTemp: number,
    hotAisleTemp: number,
    heatLoad: number,
    supplyTempSet: number,
    coolingWaterIn: number,
    emergencyActive: boolean,
    envPidCompensation: number
) => {
    const loadRatio = clamp(heatLoad / 200, 0, 1);
    const supplyScore = clamp((supplyAirTemp - supplyTempSet) / 6, 0, 1);
    const returnScore = clamp((returnAirTemp - (supplyTempSet + 4)) / 8, 0, 1);
    const hotAisleScore = clamp((hotAisleTemp - (supplyTempSet + 8)) / 10, 0, 1);
    const waterPenalty = clamp((coolingWaterIn - (returnAirTemp - 2)) / 12, 0, 1);

    let normalizedDemand =
        supplyScore * 0.36 +
        returnScore * 0.24 +
        hotAisleScore * 0.1 +
        loadRatio * 0.24 +
        waterPenalty * 0.06 +
        clamp(envPidCompensation / 30, -0.08, 0.18);

    if (supplyAirTemp < supplyTempSet - 0.8 && returnAirTemp < supplyTempSet + 3) {
        normalizedDemand *= 0.45;
    }
    if (emergencyActive) {
        normalizedDemand = 1;
    }

    return clamp(Math.round(1 + normalizedDemand * 99), 1, 100);
};

interface RuntimeState {
    effectiveMode: EffectiveCoolingMode;
    cfcDemandFiltered: number;
    filteredHeatLoad: number;
    filteredCwInlet: number;
    filteredSupplySet: number;
    modeHoldSeconds: number;
    dehumidifySeconds: number;
    emergencyExitTimer: number;
    quickStartActive: boolean;
    quickStartTimer: number;
    quickStartCaptured: boolean;
    wasCompressorActive: boolean;
    dehumidifyActive: boolean;
    emergencyActive: boolean;
    lowLoadActive: boolean;
    compressorRpm: number[];
    compressorOnSeconds: number[];
    activeCompressors: number;
}

export interface DualColdSourceState {
    compressorActive: boolean;
    highPressure: number;
    lowPressure: number;
    superheat: number;
    coolingWaterIn: number;
    coolingWaterOut: number;
    bypassValveOpening: number;
    highPressureValveOpening: number;
    eev1Opening: number;
    eev2Opening: number;
    supplyAirTemp: number;
    returnAirTemp: number;
    hotAisleTemp: number;
    compHz: number;
    fanSpeed: number;
    totalCooling: number;
    naturalCooling: number;
    dxCooling: number;
    evapTemp: number;
    condTemp: number;
    effectiveMode: EffectiveCoolingMode;
    activeCompressors: number;
    avgCompressorRpm: number;
    cfcDemand: number;
    returnHumidity: number;
    supplyHumidity: number;
    absoluteHumidity: number;
    dehumidifying: boolean;
    emergencyCooling: boolean;
    lowLoadMode: boolean;
    quickStartElapsed: number;
}

const createInitialState = (cwInletTemp: number, mode: CoolingMode): DualColdSourceState => ({
    compressorActive: false,
    highPressure: 15,
    lowPressure: 5.5,
    superheat: 6,
    coolingWaterIn: cwInletTemp,
    coolingWaterOut: cwInletTemp,
    bypassValveOpening: 100,
    highPressureValveOpening: 0,
    eev1Opening: 0,
    eev2Opening: 0,
    supplyAirTemp: 26,
    returnAirTemp: 26,
    hotAisleTemp: 27,
    compHz: 0,
    fanSpeed: MIN_FAN_RPM,
    totalCooling: 0,
    naturalCooling: 0,
    dxCooling: 0,
    evapTemp: 8,
    condTemp: 36,
    effectiveMode: initialEffectiveMode(mode),
    activeCompressors: 0,
    avgCompressorRpm: 0,
    cfcDemand: 1,
    returnHumidity: 55,
    supplyHumidity: 52,
    absoluteHumidity: 11,
    dehumidifying: false,
    emergencyCooling: false,
    lowLoadMode: false,
    quickStartElapsed: 0
});

const createRuntimeState = (
    mode: CoolingMode,
    heatLoad: number,
    supplyTempSet: number,
    cwInletTemp: number
): RuntimeState => ({
    effectiveMode: initialEffectiveMode(mode),
    cfcDemandFiltered: 1,
    filteredHeatLoad: heatLoad,
    filteredCwInlet: cwInletTemp,
    filteredSupplySet: supplyTempSet,
    modeHoldSeconds: 0,
    dehumidifySeconds: 0,
    emergencyExitTimer: 0,
    quickStartActive: false,
    quickStartTimer: 0,
    quickStartCaptured: false,
    wasCompressorActive: false,
    dehumidifyActive: false,
    emergencyActive: false,
    lowLoadActive: false,
    compressorRpm: [0, 0, 0, 0],
    compressorOnSeconds: [0, 0, 0, 0],
    activeCompressors: 0
});

export const useDualColdSourcePhysics = (
    mode: CoolingMode,
    heatLoad: number,
    supplyTempSet: number,
    cwInletTemp: number
) => {
    const initialState = useRef(createInitialState(cwInletTemp, mode));
    const stateRef = useRef<DualColdSourceState>(initialState.current);
    const runtimeRef = useRef<RuntimeState>(createRuntimeState(mode, heatLoad, supplyTempSet, cwInletTemp));
    const lastTimeRef = useRef(0);

    const valvePidRef = useRef(new SimplePID(1.9, 0.12, 0.35));
    const dxPidRef = useRef(new SimplePID(1.0, 0.09, 0.25));
    const supplyPidRef = useRef(new SimplePID(0.85, 0.06, 0.15));
    const environmentPidRef = useRef(new SimplePID(0.5, 0.03, 0.4));
    const eevPidRef = useRef(new SimplePID(1.15, 0.04, 0.15));

    const [stats, setStats] = useState<DualColdSourceState>(initialState.current);

    const paramsRef = useRef({ mode, heatLoad, supplyTempSet, cwInletTemp });
    useEffect(() => {
        paramsRef.current = { mode, heatLoad, supplyTempSet, cwInletTemp };
    }, [mode, heatLoad, supplyTempSet, cwInletTemp]);

    useEffect(() => {
        const runtime = runtimeRef.current;

        if (mode !== 'auto') {
            runtime.effectiveMode = mode;
        }

        runtime.modeHoldSeconds = 0;
        runtime.cfcDemandFiltered = stateRef.current.cfcDemand;

        valvePidRef.current.reset();
        dxPidRef.current.reset();
        supplyPidRef.current.reset();
        environmentPidRef.current.reset();
        eevPidRef.current.reset();
    }, [mode]);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = now;
            }

            const dt = clamp((now - lastTimeRef.current) / 1000, 0.1, 2.0);
            lastTimeRef.current = now;

            const { mode: requestedMode, heatLoad: requestedLoad, supplyTempSet: requestedSetpoint, cwInletTemp: requestedCwInlet } = paramsRef.current;
            const state = stateRef.current;
            const runtime = runtimeRef.current;

            runtime.filteredHeatLoad += (clamp(requestedLoad, 0, 220) - runtime.filteredHeatLoad) * clamp(dt / 12, 0, 1);
            runtime.filteredCwInlet += (requestedCwInlet - runtime.filteredCwInlet) * clamp(dt / 8, 0, 1);
            runtime.filteredSupplySet += (clamp(requestedSetpoint, 15, 30) - runtime.filteredSupplySet) * clamp(dt / 3.5, 0, 1);

            const effectiveCwIn = runtime.filteredCwInlet + (Math.random() - 0.5) * 0.2;
            const supplySet = runtime.filteredSupplySet;
            const loadRatio = clamp(runtime.filteredHeatLoad / 200, 0, 1);

            if (!runtime.dehumidifyActive && state.absoluteHumidity > 13.2) {
                runtime.dehumidifyActive = true;
                runtime.dehumidifySeconds = 0;
            }
            if (runtime.dehumidifyActive) {
                runtime.dehumidifySeconds += dt;
                if (state.absoluteHumidity < 10.2 && runtime.dehumidifySeconds > 40) {
                    runtime.dehumidifyActive = false;
                    runtime.dehumidifySeconds = 0;
                }
            }

            if (
                !runtime.emergencyActive &&
                state.returnAirTemp >= EMERGENCY_TEMP_SETPOINT &&
                state.supplyAirTemp > supplySet + 1
            ) {
                runtime.emergencyActive = true;
                runtime.emergencyExitTimer = 0;
            }
            if (runtime.emergencyActive) {
                const emergencyReleaseTarget = Math.min(EMERGENCY_TEMP_SETPOINT - 1, supplySet + 4);
                if (state.returnAirTemp < emergencyReleaseTarget) {
                    const overcoolBias = state.supplyAirTemp < supplySet - 1 ? 1.8 : 1;
                    const emergencyExitHold = state.supplyAirTemp < supplySet - 1 ? 15 : 30;
                    runtime.emergencyExitTimer += dt * overcoolBias;
                    if (runtime.emergencyExitTimer >= emergencyExitHold) {
                        runtime.emergencyActive = false;
                        runtime.emergencyExitTimer = 0;
                    }
                } else {
                    runtime.emergencyExitTimer = 0;
                }
            }

            const returnTarget = supplySet + 6;
            const envError = state.returnAirTemp - returnTarget;
            const envPidCompensation = environmentPidRef.current.update(envError, dt);

            let targetFanSpeed = MIN_FAN_RPM + loadRatio * (MAX_FAN_RPM - MIN_FAN_RPM);
            targetFanSpeed += envPidCompensation * 45;
            targetFanSpeed += (state.cfcDemand - 50) * 1.2;
            if (runtime.dehumidifyActive && runtime.dehumidifySeconds < 180) {
                targetFanSpeed = MIN_FAN_RPM + 40;
            }
            if (runtime.emergencyActive) {
                targetFanSpeed = MAX_FAN_RPM;
            }
            targetFanSpeed = clamp(targetFanSpeed, MIN_FAN_RPM, MAX_FAN_RPM);
            state.fanSpeed += (targetFanSpeed - state.fanSpeed) * clamp(dt / 2.2, 0, 1);

            const fanRatio = clamp((state.fanSpeed - MIN_FAN_RPM) / (MAX_FAN_RPM - MIN_FAN_RPM), 0, 1);
            const airMassFlow = 6 + fanRatio * 8;
            const airCapacityRate = Math.max(airMassFlow * AIR_CP, 1.2);

            const roomDisturbance = (Math.random() - 0.5) * (0.18 + 0.08 * loadRatio);
            const targetReturnAirTemp = state.supplyAirTemp + runtime.filteredHeatLoad / airCapacityRate + roomDisturbance;
            state.returnAirTemp += (targetReturnAirTemp - state.returnAirTemp) * clamp(dt / 5, 0, 1);

            const targetHotAisleTemp = state.returnAirTemp + 1 + runtime.filteredHeatLoad / 320;
            state.hotAisleTemp += (targetHotAisleTemp - state.hotAisleTemp) * clamp(dt / 8, 0, 1);

            const rawCfcDemand = computeCfcDemand(
                state.supplyAirTemp,
                state.returnAirTemp,
                state.hotAisleTemp,
                runtime.filteredHeatLoad,
                supplySet,
                effectiveCwIn,
                runtime.emergencyActive,
                envPidCompensation
            );
            runtime.cfcDemandFiltered += (rawCfcDemand - runtime.cfcDemandFiltered) * clamp(dt / 3.4, 0, 1);
            state.cfcDemand = clamp(Math.round(runtime.cfcDemandFiltered), 1, 100);

            const canUseNatural = effectiveCwIn + 1.2 < state.returnAirTemp;
            runtime.modeHoldSeconds += dt;

            if (requestedMode === 'auto') {
                if (runtime.modeHoldSeconds > 8) {
                    const currentMode = runtime.effectiveMode;
                    let nextMode: EffectiveCoolingMode = currentMode;

                    if (currentMode === 'natural') {
                        if (!canUseNatural || state.cfcDemand > 62) {
                            nextMode = state.cfcDemand > 82 ? 'mechanical' : 'hybrid';
                        }
                    } else if (currentMode === 'hybrid') {
                        if (canUseNatural && state.cfcDemand < 24) {
                            nextMode = 'natural';
                        } else if ((!canUseNatural && state.cfcDemand > 70) || state.cfcDemand > 86) {
                            nextMode = 'mechanical';
                        }
                    } else if (canUseNatural && state.cfcDemand < 70) {
                        nextMode = state.cfcDemand < 24 ? 'natural' : 'hybrid';
                    }

                    if (nextMode !== currentMode) {
                        runtime.effectiveMode = nextMode;
                        runtime.modeHoldSeconds = 0;
                    }
                }
            } else {
                runtime.effectiveMode = requestedMode;
                runtime.modeHoldSeconds = 0;
            }

            state.effectiveMode = runtime.effectiveMode;

            const naturalModeActive = runtime.effectiveMode === 'natural' || runtime.effectiveMode === 'hybrid';
            let valveTarget = naturalModeActive ? state.highPressureValveOpening : 0;

            if (naturalModeActive) {
                if (effectiveCwIn >= state.returnAirTemp - 0.2) {
                    valveTarget = MIN_NATURAL_VALVE_OPENING;
                    valvePidRef.current.reset();
                } else {
                    const valveError = state.supplyAirTemp - supplySet;
                    const valveAdjust = valvePidRef.current.update(valveError, dt);
                    valveTarget = clamp(state.highPressureValveOpening + valveAdjust * 2.3, MIN_NATURAL_VALVE_OPENING, 100);
                    if (state.supplyAirTemp > supplySet + 1.2) {
                        valveTarget = Math.max(valveTarget, 70);
                    }
                    if (state.supplyAirTemp > supplySet + 2.0) {
                        valveTarget = 100;
                    }
                }
            }

            state.highPressureValveOpening += (valveTarget - state.highPressureValveOpening) * clamp(dt / 1.8, 0, 1);
            state.highPressureValveOpening = clamp(state.highPressureValveOpening, 0, 100);

            let bypassTarget = 100 - state.highPressureValveOpening;
            if (runtime.effectiveMode === 'mechanical') {
                bypassTarget = Math.max(bypassTarget, 75);
            }
            if (effectiveCwIn > state.returnAirTemp + 0.8 && runtime.activeCompressors <= 1) {
                bypassTarget = 100;
            }
            state.bypassValveOpening += (bypassTarget - state.bypassValveOpening) * clamp(dt / 1.8, 0, 1);
            state.bypassValveOpening = clamp(state.bypassValveOpening, 0, 100);

            const totalWaterMassFlow = 4 + 3 * loadRatio + 1.2 * (state.cfcDemand / 100);
            const valveFlowFraction = state.highPressureValveOpening / 100;
            // Mechanical mode still keeps a small leakage flow through the coil branch.
            const coilFlowFraction = clamp(
                valveFlowFraction + (runtime.effectiveMode === 'mechanical' ? MECHANICAL_COIL_LEAK_FRACTION : 0),
                0,
                1
            );
            const waterMassFlowCoil = Math.max(0.12, totalWaterMassFlow * coilFlowFraction);
            const waterCapacityRateCoil = waterMassFlowCoil * WATER_CP;

            let naturalCoolingCapacity = 0;
            let airAfterNatural = state.returnAirTemp;

            if (coilFlowFraction > 0.001 && state.returnAirTemp > effectiveCwIn + 0.3) {
                const uaCoil =
                    (NATURAL_COIL_UA_MIN + (NATURAL_COIL_UA_MAX - NATURAL_COIL_UA_MIN) * fanRatio)
                    * (0.15 + 0.85 * Math.sqrt(clamp(coilFlowFraction, 0, 1)));

                const epsilonCoil = heatExchangerEffectiveness(airCapacityRate, waterCapacityRateCoil, uaCoil);
                const deltaT = state.returnAirTemp - effectiveCwIn;
                const qPotential = epsilonCoil * Math.min(airCapacityRate, waterCapacityRateCoil) * Math.max(0, deltaT);

                // Coil contact correction: high air speed lowers contact residence time.
                const contactFactor = clamp(1.08 - 0.22 * fanRatio, 0.75, 1.05);
                naturalCoolingCapacity = clamp(qPotential * contactFactor, 0, 140);

                airAfterNatural = state.returnAirTemp - naturalCoolingCapacity / airCapacityRate;
                airAfterNatural = Math.max(airAfterNatural, effectiveCwIn + 1.3);
            }

            runtime.lowLoadActive =
                (state.returnAirTemp < supplySet + 4 && fanRatio < 0.6 && state.cfcDemand < 28) ||
                (state.returnAirTemp < supplySet + 3.2 && runtime.filteredHeatLoad < 80);
            if (state.returnAirTemp > supplySet + 7 || state.cfcDemand > 45) {
                runtime.lowLoadActive = false;
            }

            let desiredCompressors = 0;
            if (runtime.effectiveMode !== 'natural') {
                if (state.cfcDemand < 18) {
                    desiredCompressors = runtime.effectiveMode === 'mechanical' ? 1 : 0;
                } else if (state.cfcDemand < 40) {
                    desiredCompressors = 1;
                } else if (state.cfcDemand < 63) {
                    desiredCompressors = 2;
                } else if (state.cfcDemand < 82) {
                    desiredCompressors = 3;
                } else {
                    desiredCompressors = 4;
                }

                if (runtime.effectiveMode === 'mechanical') {
                    desiredCompressors = Math.max(1, desiredCompressors);
                }
            }

            if (runtime.lowLoadActive) {
                desiredCompressors = Math.min(desiredCompressors, 2);
            }
            if (runtime.dehumidifyActive) {
                desiredCompressors = Math.max(desiredCompressors, 2);
            }
            if (runtime.emergencyActive) {
                desiredCompressors = COMPRESSOR_COUNT;
            }

            desiredCompressors = clamp(Math.round(desiredCompressors), 0, COMPRESSOR_COUNT);

            const supplyError = state.supplyAirTemp - supplySet;
            const dxPidOutput = dxPidRef.current.update(supplyError, dt);
            const supplyPidOutput = supplyPidRef.current.update(supplyError, dt);

            const cfcBaseRpm = COMP_MIN_RPM + state.cfcDemand * 42;
            let compressorTargetRpm = cfcBaseRpm + dxPidOutput * 260 + supplyPidOutput * 120;
            compressorTargetRpm = clamp(compressorTargetRpm, COMP_MIN_RPM, COMP_MAX_RPM);

            if (supplyError < -0.5) {
                compressorTargetRpm = Math.max(COMP_MIN_RPM, compressorTargetRpm - 300);
            }
            if (runtime.lowLoadActive && desiredCompressors <= 1 && !runtime.dehumidifyActive) {
                compressorTargetRpm = Math.min(compressorTargetRpm, 2600);
            }
            if (runtime.dehumidifyActive) {
                compressorTargetRpm = Math.max(compressorTargetRpm, DEHUMIDIFY_COMP_RPM);
            }
            if (runtime.emergencyActive) {
                compressorTargetRpm = COMP_MAX_RPM;
            }

            for (let index = 0; index < COMPRESSOR_COUNT; index += 1) {
                const shouldRun = index < desiredCompressors;

                if (shouldRun) {
                    runtime.compressorOnSeconds[index] += dt;
                } else {
                    runtime.compressorOnSeconds[index] = 0;
                }

                let rpmTarget = shouldRun ? compressorTargetRpm : 0;
                const inPlatformWindow = shouldRun && runtime.compressorOnSeconds[index] < COMP_PLATFORM_SECONDS && desiredCompressors > 1;
                if (inPlatformWindow) {
                    rpmTarget = COMP_SET_RPM;
                }

                const rampPerSecond = shouldRun ? (runtime.emergencyActive ? 1800 : 700) : 1400;
                runtime.compressorRpm[index] = rampTo(runtime.compressorRpm[index], rpmTarget, rampPerSecond * dt);
                if (!shouldRun && runtime.compressorRpm[index] < 60) {
                    runtime.compressorRpm[index] = 0;
                }
            }

            const runningCompressors = runtime.compressorRpm.filter((rpm) => rpm > 200);
            runtime.activeCompressors = runningCompressors.length;
            const avgCompressorRpm = runtime.activeCompressors > 0
                ? runningCompressors.reduce((sum, rpm) => sum + rpm, 0) / runtime.activeCompressors
                : 0;

            const compressorNowActive = runtime.activeCompressors > 0;
            if (!runtime.wasCompressorActive && compressorNowActive) {
                runtime.quickStartActive = true;
                runtime.quickStartCaptured = false;
                runtime.quickStartTimer = 0;
            }
            if (runtime.quickStartActive) {
                runtime.quickStartTimer += dt;
            }
            runtime.wasCompressorActive = compressorNowActive;

            state.compressorActive = compressorNowActive;
            state.activeCompressors = runtime.activeCompressors;
            state.avgCompressorRpm = avgCompressorRpm;
            state.compHz = avgCompressorRpm / 60;

            let dxCoolingCapacity = 0;
            let evapAirInTemp = runtime.effectiveMode === 'mechanical' ? state.returnAirTemp : airAfterNatural;

            const compressorLoadRatio = clamp(avgCompressorRpm / COMP_SET_RPM, 0, 1.9);
            const compressorCapacityBySpeed = runtime.compressorRpm.reduce((sum, rpm) => sum + (rpm / COMP_MAX_RPM) * 42, 0);

            const evapTempTarget = clamp(supplySet - 8 + (state.cfcDemand / 100) * 1.8, 2, 14);
            const forcedEvapTarget = runtime.emergencyActive ? 2 : evapTempTarget;
            state.evapTemp += (forcedEvapTarget - state.evapTemp) * clamp(dt / 4.5, 0, 1);
            state.evapTemp = clamp(state.evapTemp, 1.5, 16);

            if (compressorNowActive && runtime.effectiveMode !== 'natural') {
                const airCapacityPerEvap = airCapacityRate / 2;
                const refrigerantCapacityRate = 10 + 14 * compressorLoadRatio;
                const uaEvapEach =
                    (EVAP_UA_MIN + (EVAP_UA_MAX - EVAP_UA_MIN) * fanRatio)
                    * (0.35 + 0.65 * clamp(compressorLoadRatio, 0, 1.6));

                const epsilonEvap = heatExchangerEffectiveness(airCapacityPerEvap, refrigerantCapacityRate, uaEvapEach);
                const evapApproachTemp = state.evapTemp + 3.2;
                const qEachPotential = epsilonEvap * Math.min(airCapacityPerEvap, refrigerantCapacityRate) * Math.max(0, evapAirInTemp - evapApproachTemp);
                const qTotalPotential = qEachPotential * 2;

                dxCoolingCapacity = clamp(Math.min(qTotalPotential, compressorCapacityBySpeed), 0, 180);
            }

            const airAfterDx = clamp(evapAirInTemp - dxCoolingCapacity / airCapacityRate, state.evapTemp + 2.8, state.returnAirTemp);

            let targetSupplyTemp = state.returnAirTemp;
            if (runtime.effectiveMode === 'natural') {
                targetSupplyTemp = airAfterNatural;
            } else {
                targetSupplyTemp = airAfterDx;
            }

            const supplyTrim = clamp(supplyPidOutput * 0.25, -1.8, 1.8);
            targetSupplyTemp = clamp(targetSupplyTemp - supplyTrim, 8, state.returnAirTemp);
            state.supplyAirTemp += (targetSupplyTemp - state.supplyAirTemp) * clamp(dt / 2.4, 0, 1);

            state.naturalCooling = naturalCoolingCapacity;
            state.dxCooling = dxCoolingCapacity;
            state.totalCooling = naturalCoolingCapacity + dxCoolingCapacity;

            const coolingDemandKw = Math.max(0, (state.returnAirTemp - supplySet) * airCapacityRate);
            if (runtime.quickStartActive) {
                const targetCooling = Math.max(coolingDemandKw, 1);
                if (!runtime.quickStartCaptured && state.totalCooling >= targetCooling * 0.85) {
                    runtime.quickStartCaptured = true;
                    runtime.quickStartActive = false;
                    state.quickStartElapsed = runtime.quickStartTimer;
                } else if (runtime.quickStartTimer >= 300) {
                    runtime.quickStartActive = false;
                    state.quickStartElapsed = runtime.quickStartTimer;
                }
            }

            const compressorInputPower = runtime.compressorRpm.reduce((sum, rpm) => sum + (rpm / COMP_MAX_RPM) * 11, 0);
            const dxHeatRejected = dxCoolingCapacity + compressorInputPower;
            const totalWaterHeat = naturalCoolingCapacity + dxHeatRejected;

            state.coolingWaterIn = effectiveCwIn;

            let coolingWaterOutTarget = effectiveCwIn;
            if (totalWaterHeat > 0) {
                coolingWaterOutTarget = effectiveCwIn + totalWaterHeat / Math.max(totalWaterMassFlow * WATER_CP, 0.4);
            }

            if (compressorNowActive) {
                const condenserApproach = 5.5 + 4 * clamp(compressorLoadRatio, 0, 1.5);
                coolingWaterOutTarget = Math.max(coolingWaterOutTarget, state.condTemp - condenserApproach);
            }

            state.coolingWaterOut += (coolingWaterOutTarget - state.coolingWaterOut) * clamp(dt / 4, 0, 1);
            state.coolingWaterOut = clamp(state.coolingWaterOut, effectiveCwIn, 60);

            const condTempTarget = compressorNowActive
                ? state.coolingWaterOut + (5 + 5 * clamp(compressorLoadRatio, 0, 1.5))
                : state.coolingWaterOut + 3;

            state.condTemp += (condTempTarget - state.condTemp) * clamp(dt / 4.5, 0, 1);
            state.condTemp = clamp(state.condTemp, 20, 65);

            const highPressureTarget = 15 + (state.condTemp - 35) / 1.5;
            state.highPressure += (highPressureTarget - state.highPressure) * clamp(dt / 3, 0, 1);
            state.highPressure = clamp(state.highPressure, 8, 42);

            const lowPressureTarget = 5 + (state.evapTemp + 10) / 5;
            state.lowPressure += (lowPressureTarget - state.lowPressure) * clamp(dt / 3, 0, 1);
            state.lowPressure = clamp(state.lowPressure, 2.8, 12.5);

            const targetSuperheat = runtime.dehumidifyActive ? 7 : 6;
            const superheatNoise = (Math.random() - 0.5) * 0.2;
            state.superheat += (targetSuperheat + superheatNoise - state.superheat) * clamp(dt / 5, 0, 1);
            state.superheat = clamp(state.superheat, 3, 12);

            if (compressorNowActive) {
                const eevError = state.superheat - targetSuperheat;
                const eevAdjust = eevPidRef.current.update(eevError, dt);
                const eevTarget = clamp(48 - eevAdjust * 10 + state.cfcDemand * 0.15, 10, 95);
                state.eev1Opening += (eevTarget - state.eev1Opening) * clamp(dt / 2, 0, 1);
                state.eev2Opening = state.eev1Opening;
            } else {
                state.eev1Opening = 0;
                state.eev2Opening = 0;
                eevPidRef.current.reset();
            }

            let absoluteHumidity = state.absoluteHumidity;
            absoluteHumidity += (0.015 + 0.045 * loadRatio) * dt + (Math.random() - 0.5) * 0.015;

            const latentRemovalRate = dxCoolingCapacity * 0.007 + naturalCoolingCapacity * 0.0015 + (runtime.dehumidifyActive ? 0.08 : 0);
            absoluteHumidity = clamp(absoluteHumidity - latentRemovalRate * dt, 7, 18);

            state.absoluteHumidity = absoluteHumidity;
            const supplyAbsoluteHumidity = clamp(absoluteHumidity - Math.max(0, state.returnAirTemp - state.supplyAirTemp) * 0.09, 5, absoluteHumidity);
            state.returnHumidity = clamp(rhFromAbsoluteHumidity(state.returnAirTemp, absoluteHumidity), 20, 95);
            state.supplyHumidity = clamp(rhFromAbsoluteHumidity(state.supplyAirTemp, supplyAbsoluteHumidity), 20, 98);

            state.dehumidifying = runtime.dehumidifyActive;
            state.emergencyCooling = runtime.emergencyActive;
            state.lowLoadMode = runtime.lowLoadActive;

            if (runtime.dehumidifyActive && state.absoluteHumidity < 10.2 && runtime.dehumidifySeconds > 40) {
                runtime.dehumidifyActive = false;
                runtime.dehumidifySeconds = 0;
                state.dehumidifying = false;
            }

            setStats({ ...state });
        }, 500);

        return () => clearInterval(timer);
    }, []);

    return stats;
};
