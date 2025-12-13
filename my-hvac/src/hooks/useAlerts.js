// src/hooks/useAlerts.js
import { useMemo, useRef, useEffect } from 'react';
import { checkAlert } from '../config/alertRules';

/**
 * Hook to manage alerts with history tracking
 * @param {Object} stats - Current system statistics
 * @param {Object} params - System parameters
 * @returns {Object} - Current alerts and alert history
 */
export const useAlerts = (stats, params) => {
    const alertHistoryRef = useRef([]);
    const activeAlertsRef = useRef({});
    const lastCheckRef = useRef({});

    // 检查当前告警
    const currentAlerts = useMemo(() => {
        const result = {};
        const now = Date.now();

        // 需要监控的参数
        const parametersToCheck = [
            'saTemp',
            'raTemp',
            'roomTemp',
            'cfc',
            'capacity_kw',
            'compHz',
            'fanSpeed_actual'
        ];

        parametersToCheck.forEach(parameter => {
            const value = stats[parameter];
            if (value != null && !isNaN(value)) {
                const alert = checkAlert(parameter, value, stats, params);

                if (alert) {
                    result[parameter] = alert;

                    // 如果是新告警或级别变化，添加到历史记录
                    const lastAlert = activeAlertsRef.current[parameter];
                    if (!lastAlert || lastAlert.level !== alert.level) {
                        alertHistoryRef.current.push({
                            ...alert,
                            id: `${parameter}_${now}`,
                            triggeredAt: now,
                            clearedAt: null,
                            status: 'active'
                        });

                        // 限制历史记录数量
                        if (alertHistoryRef.current.length > 100) {
                            alertHistoryRef.current = alertHistoryRef.current.slice(-100);
                        }
                    }
                } else {
                    // 告警已清除
                    const lastAlert = activeAlertsRef.current[parameter];
                    if (lastAlert) {
                        // 在历史记录中标记为已清除
                        const historyItem = alertHistoryRef.current
                            .reverse()
                            .find(item =>
                                item.parameter === parameter &&
                                item.status === 'active'
                            );

                        if (historyItem) {
                            historyItem.clearedAt = now;
                            historyItem.status = 'cleared';
                            historyItem.duration = now - historyItem.triggeredAt;
                        }

                        alertHistoryRef.current.reverse();
                    }
                }
            }
        });

        activeAlertsRef.current = result;
        return result;
    }, [stats, params]);

    // 统计信息
    const statistics = useMemo(() => {
        const alertArray = Object.values(currentAlerts);

        return {
            total: alertArray.length,
            byLevel: {
                P0: alertArray.filter(a => a.level === 'P0').length,
                P1: alertArray.filter(a => a.level === 'P1').length,
                P2: alertArray.filter(a => a.level === 'P2').length,
                P3: alertArray.filter(a => a.level === 'P3').length,
                P4: alertArray.filter(a => a.level === 'P4').length
            },
            byCategory: alertArray.reduce((acc, alert) => {
                acc[alert.category] = (acc[alert.category] || 0) + 1;
                return acc;
            }, {}),
            history: {
                total: alertHistoryRef.current.length,
                active: alertHistoryRef.current.filter(a => a.status === 'active').length,
                cleared: alertHistoryRef.current.filter(a => a.status === 'cleared').length
            }
        };
    }, [currentAlerts]);

    return {
        currentAlerts,
        alertHistory: alertHistoryRef.current,
        statistics
    };
};
