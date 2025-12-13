// src/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// class name merging utility
export const cn = (...inputs) => twMerge(clsx(inputs));

// 简化的 R410A 压力 (MPa) 查表模拟
export const getSatPressure = (tempC) => {
    // 简单拟合: P = 0.0002T^2 + 0.024T + 0.8 (Rough approx for demo)
    if (tempC < -50) return 0;
    return (0.00022 * tempC * tempC + 0.023 * tempC + 0.75).toFixed(2);
};

export const calculateWetBulb = (T, rh) => {
    return (
        T * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
        Math.atan(T + rh) -
        Math.atan(rh - 1.676331) +
        0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
        4.686035
    );
};

// 气流颜色计算
export const getAirColor = (temp) => {
    if (temp > 32) return "#ef4444"; // Red
    if (temp > 26) return "#f59e0b"; // Orange
    if (temp > 22) return "#60a5fa"; // Light Blue
    return "#3b82f6"; // Deep Blue
};
