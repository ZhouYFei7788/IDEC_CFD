// src/hooks/useHistoryData.js
import { useRef, useEffect } from 'react';

/**
 * Hook to track parameter history for charting
 * @param {Object} stats - Current stats object
 * @param {number} maxPoints - Maximum number of data points to keep
 * @returns {Array} - Array of historical data points
 */
export const useHistoryData = (stats, maxPoints = 300) => {
    const historyRef = useRef([]);
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        const now = Date.now();

        // Only update if enough time has passed (throttle to every 700ms to match update interval)
        if (now - lastUpdateRef.current < 700) {
            return;
        }

        lastUpdateRef.current = now;

        // Create new data point
        const dataPoint = {
            timestamp: now,
            time: new Date(now).toLocaleTimeString(),
            ...stats
        };

        // Add to history
        historyRef.current = [...historyRef.current, dataPoint];

        // Keep only last maxPoints
        if (historyRef.current.length > maxPoints) {
            historyRef.current = historyRef.current.slice(-maxPoints);
        }

    }, [stats]);

    return historyRef.current;
};
