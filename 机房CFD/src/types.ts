// 类型定义
export const HealthState = {
    NORMAL: 'NORMAL',
    WARNING: 'WARNING',
    ALARM: 'ALARM'
} as const;

export type HealthStateType = typeof HealthState[keyof typeof HealthState];

export interface PhaseLoad {
    L1: number;
    L2: number;
    L3: number;
}

export interface RackData {
    id: string;
    state: HealthStateType;
    loadKW: number;
    phaseLoad: PhaseLoad;
}

export interface ZoneData {
    id: number;
    position: [number, number, number];
    rows: {
        left: RackData[];
        right: RackData[];
    };
}
