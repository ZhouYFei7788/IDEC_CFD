import { HealthState, type ZoneData, type RackData } from './types';
import { DIMS } from './constants';

export const generateMockData = (): ZoneData[] => {
    const zones: ZoneData[] = [];
    const numZones = 3; // 减少到3个区域便于调试
    const racksPerRow = 5; // 减少到5个机柜

    for (let z = 0; z < numZones; z++) {
        const createRow = (prefix: string): RackData[] =>
            Array.from({ length: racksPerRow }).map((_, i) => {
                const rand = Math.random();
                const isAlarm = rand > 0.9;
                const isWarning = !isAlarm && rand > 0.7;

                return {
                    id: `${prefix}-${z + 1}-${i + 1}`,
                    state: isAlarm ? HealthState.ALARM : (isWarning ? HealthState.WARNING : HealthState.NORMAL),
                    loadKW: Math.floor(Math.random() * 20) + 10,
                    phaseLoad: {
                        L1: Math.floor(Math.random() * 100),
                        L2: Math.floor(Math.random() * 100),
                        L3: Math.floor(Math.random() * 100),
                    }
                };
            });

        zones.push({
            id: z,
            position: [z * 8, 0, 0], // 简化间距
            rows: {
                left: createRow('L'),
                right: createRow('R')
            }
        });
    }

    return zones;
};

export const getStateColor = (state: string) => {
    switch (state) {
        case HealthState.ALARM: return '#ef4444';
        case HealthState.WARNING: return '#f59e0b';
        case HealthState.NORMAL:
        default: return '#10b981';
    }
};
