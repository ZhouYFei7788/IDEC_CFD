// src/utils/exportExcel.js
import * as XLSX from 'xlsx';

/**
 * 将运行日志数据导出为Excel文件
 * @param {Array} history - 历史数据数组
 * @param {Object} params - 当前参数设置
 * @param {string} mode - 当前运行模式
 * @param {Object} systemSpecs - 系统规格参数（可选）
 */
export const exportToExcel = (history, params, mode, systemSpecs = null) => {
    if (!history || history.length === 0) {
        alert('没有可导出的数据，请等待系统运行一段时间后再试。');
        return;
    }

    // 完整的列标题映射（中英文对照）- 包含所有可能的参数
    const columnMapping = {
        // 时间信息
        time: '时间',
        timestamp: '时间戳(ms)',

        // 温度参数
        oaTemp: '室外温度(°C)',
        wb: '湿球温度(°C)',
        raTemp: '回风温度(°C)',
        roomTemp: '机房温度(°C)',
        saTemp: '送风温度(°C)',
        coreOut: '芯体出风温度(°C)',
        eaTemp: '排风温度(°C)',
        condTemp: '冷凝温度(°C)',
        evapTemp: '蒸发温度(°C)',

        // 湿度参数
        oaRh: '室外相对湿度(%)',

        // 设备状态
        sprayOn: '喷淋状态',
        dxOn: '压缩机状态',

        // 压缩机参数
        compHz: '压缩机频率(Hz)',
        eevOpening: '电子膨胀阀开度(step)',
        compPower: '压缩机功率(W)',

        // 风机参数
        fanSpeed_actual: '实际风机转速(%)',
        fanSpeed: '设定风机转速(%)',

        // 控制参数
        cfc: '制冷需求CFC(%)',
        cfcSmooth: 'CFC平滑值(%)',
        saSet: '送风温度设定(°C)',
        qLoad: '机房热负载(W)',
        dxWanted: '压缩机请求状态',
        dxLockReason: '锁定原因',
        fanSpeedTarget: '目标风速(%)',
        overcool: '过冷状态',

        // 风量参数
        airflow_kgs: '质量流量(kg/s)',
        airflow_m3h: '体积流量(m³/h)',

        // 制冷量参数
        capacity_kw: '总制冷量(kW)',
        Q_iec_kw: 'IEC制冷量(kW)',
        Q_dx_kw: 'DX制冷量(kW)',

        // 功率与能效
        power_kw: '总功率(kW)',
        cop: 'COP能效比',

        // 冷媒循环参数
        highPress: '高压(kPa)',
        lowPress: '低压(kPa)',
        superheat: '过热度(°C)',
        subcool: '过冷度(°C)',

        // 错误信息
        error: '错误信息',
    };

    // 动态收集所有出现过的字段
    const allFields = new Set();
    history.forEach(record => {
        Object.keys(record).forEach(key => allFields.add(key));
    });

    // 转换数据格式 - 包含所有字段
    const exportData = history.map((record, index) => {
        const row = { '序号': index + 1 };

        // 首先按照columnMapping的顺序添加已知字段
        Object.keys(columnMapping).forEach(key => {
            if (record.hasOwnProperty(key)) {
                let value = record[key];
                // 布尔值转换为中文
                if (typeof value === 'boolean') {
                    value = value ? '开启' : '关闭';
                }
                // null/undefined 转换为空字符串
                if (value === null || value === undefined) {
                    value = '';
                }
                row[columnMapping[key]] = value;
            }
        });

        // 然后添加未在映射中的其他字段
        allFields.forEach(key => {
            if (!columnMapping.hasOwnProperty(key) && key !== 'timestamp' && key !== 'time') {
                let value = record[key];
                if (typeof value === 'boolean') {
                    value = value ? '开启' : '关闭';
                }
                if (value === null || value === undefined) {
                    value = '';
                }
                // 使用原始字段名
                row[`[其他]${key}`] = value;
            }
        });

        return row;
    });

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 创建运行日志工作表
    const logSheet = XLSX.utils.json_to_sheet(exportData);

    // 设置列宽
    const headers = Object.keys(exportData[0] || {});
    const colWidths = headers.map(header => ({
        wch: Math.max(header.length * 2, 14)
    }));
    logSheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, logSheet, '运行日志');

    // 创建参数设置工作表
    const settingsData = [
        { 参数分类: '环境参数', 参数名称: '室外温度设定', 数值: params.oaTemp, 单位: '°C' },
        { 参数分类: '环境参数', 参数名称: '室外湿度设定', 数值: params.oaRh, 单位: '%' },
        { 参数分类: '控制参数', 参数名称: '送风温度设定', 数值: params.saSet, 单位: '°C' },
        { 参数分类: '控制参数', 参数名称: '风机转速设定', 数值: params.fanSpeed, 单位: '%' },
        { 参数分类: '负载参数', 参数名称: '机房热负载', 数值: params.qLoad / 1000, 单位: 'kW' },
        { 参数分类: '运行信息', 参数名称: '运行模式', 数值: getModeLabel(mode), 单位: '' },
        { 参数分类: '运行信息', 参数名称: '导出时间', 数值: new Date().toLocaleString(), 单位: '' },
        { 参数分类: '运行信息', 参数名称: '数据点数量', 数值: history.length, 单位: '条' },
        { 参数分类: '运行信息', 参数名称: '记录时长', 数值: calculateDuration(history), 单位: '' },
    ];

    // 如果有systemSpecs，添加系统规格参数
    if (systemSpecs) {
        settingsData.push({ 参数分类: '---', 参数名称: '--- 系统规格 ---', 数值: '', 单位: '' });

        if (systemSpecs.AIR) {
            settingsData.push({ 参数分类: '空气参数', 参数名称: '空气密度', 数值: systemSpecs.AIR.DENSITY, 单位: 'kg/m³' });
            settingsData.push({ 参数分类: '空气参数', 参数名称: '比热容', 数值: systemSpecs.AIR.CP, 单位: 'J/(kg·K)' });
            settingsData.push({ 参数分类: '空气参数', 参数名称: '海拔修正系数', 数值: systemSpecs.AIR.ALTITUDE_CORRECTION, 单位: '' });
        }

        if (systemSpecs.IEC) {
            settingsData.push({ 参数分类: 'IEC参数', 参数名称: '最大风量', 数值: systemSpecs.IEC.MAX_AIRFLOW, 单位: 'm³/h' });
            settingsData.push({ 参数分类: 'IEC参数', 参数名称: '风机额定功率', 数值: systemSpecs.IEC.FAN_RATED_POWER, 单位: 'kW' });
            if (systemSpecs.IEC.DRY_MODE) {
                settingsData.push({ 参数分类: 'IEC参数', 参数名称: '干模式基础效率', 数值: systemSpecs.IEC.DRY_MODE.BASE_EFF, 单位: '' });
                settingsData.push({ 参数分类: 'IEC参数', 参数名称: '干模式效率衰减', 数值: systemSpecs.IEC.DRY_MODE.DEGRADATION, 单位: '' });
            }
            if (systemSpecs.IEC.WET_MODE) {
                settingsData.push({ 参数分类: 'IEC参数', 参数名称: '湿模式基础效率', 数值: systemSpecs.IEC.WET_MODE.BASE_EFF, 单位: '' });
                settingsData.push({ 参数分类: 'IEC参数', 参数名称: '湿模式效率衰减', 数值: systemSpecs.IEC.WET_MODE.DEGRADATION, 单位: '' });
            }
            if (systemSpecs.IEC.SPRAY_WATER_CONS) {
                settingsData.push({ 参数分类: 'IEC参数', 参数名称: '喷淋水耗', 数值: systemSpecs.IEC.SPRAY_WATER_CONS, 单位: 'L/h' });
            }
        }

        if (systemSpecs.DX) {
            settingsData.push({ 参数分类: 'DX参数', 参数名称: '额定制冷量', 数值: systemSpecs.DX.RATED_CAPACITY / 1000, 单位: 'kW' });
            settingsData.push({ 参数分类: 'DX参数', 参数名称: '额定COP', 数值: systemSpecs.DX.RATED_COP, 单位: '' });
            settingsData.push({ 参数分类: 'DX参数', 参数名称: '最小频率', 数值: systemSpecs.DX.MIN_FREQ, 单位: 'Hz' });
            settingsData.push({ 参数分类: 'DX参数', 参数名称: '最大频率', 数值: systemSpecs.DX.MAX_FREQ, 单位: 'Hz' });
        }

        if (systemSpecs.THERMAL) {
            settingsData.push({ 参数分类: '热力学参数', 参数名称: '机房热容量', 数值: systemSpecs.THERMAL.MASS, 单位: 'J/K' });
        }
    }

    const settingsSheet = XLSX.utils.json_to_sheet(settingsData);
    settingsSheet['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, settingsSheet, '参数设置');

    // 创建统计摘要工作表
    const statsData = calculateStatistics(history);
    const statsSheet = XLSX.utils.json_to_sheet(statsData);
    statsSheet['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, statsSheet, '统计摘要');

    // 生成文件名（包含时间戳和模式）
    const now = new Date();
    const filename = `HVAC运行日志_${getModeLabel(mode)}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}.xlsx`;

    // 导出文件
    XLSX.writeFile(workbook, filename);

    console.log(`✅ 成功导出 ${history.length} 条运行记录到 ${filename}`);
};

/**
 * 获取模式标签
 */
function getModeLabel(mode) {
    const labels = {
        auto: '自动模式',
        dry: '干模式',
        wet: '湿模式',
        hybrid: '混合模式',
        dx: '强冷DX模式'
    };
    return labels[mode] || mode;
}

/**
 * 计算记录时长
 */
function calculateDuration(history) {
    if (history.length < 2) return '不足';
    const first = history[0].timestamp;
    const last = history[history.length - 1].timestamp;
    const durationMs = last - first;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}小时${minutes % 60}分${seconds % 60}秒`;
    } else if (minutes > 0) {
        return `${minutes}分${seconds % 60}秒`;
    } else {
        return `${seconds}秒`;
    }
}

/**
 * 计算统计数据 - 包含所有数值型字段
 */
function calculateStatistics(history) {
    if (history.length === 0) return [];

    // 完整的数值型字段列表
    const numericKeys = [
        'oaTemp', 'wb', 'raTemp', 'roomTemp', 'saTemp', 'coreOut', 'eaTemp',
        'condTemp', 'evapTemp',
        'compHz', 'eevOpening', 'compPower',
        'fanSpeed_actual', 'fanSpeedTarget', 'cfc', 'cfcSmooth',
        'airflow_kgs', 'airflow_m3h',
        'capacity_kw', 'Q_iec_kw', 'Q_dx_kw',
        'power_kw', 'cop',
        'highPress', 'lowPress', 'superheat', 'subcool'
    ];

    const labels = {
        oaTemp: '室外温度(°C)',
        wb: '湿球温度(°C)',
        raTemp: '回风温度(°C)',
        roomTemp: '机房温度(°C)',
        saTemp: '送风温度(°C)',
        coreOut: '芯体出风温度(°C)',
        eaTemp: '排风温度(°C)',
        condTemp: '冷凝温度(°C)',
        evapTemp: '蒸发温度(°C)',
        compHz: '压缩机频率(Hz)',
        eevOpening: '电子膨胀阀开度(step)',
        compPower: '压缩机功率(W)',
        fanSpeed_actual: '实际风机转速(%)',
        fanSpeedTarget: '目标风速(%)',
        cfc: '制冷需求CFC(%)',
        cfcSmooth: 'CFC平滑值(%)',
        airflow_kgs: '质量流量(kg/s)',
        airflow_m3h: '体积流量(m³/h)',
        capacity_kw: '总制冷量(kW)',
        Q_iec_kw: 'IEC制冷量(kW)',
        Q_dx_kw: 'DX制冷量(kW)',
        power_kw: '总功率(kW)',
        cop: 'COP能效比',
        highPress: '高压(kPa)',
        lowPress: '低压(kPa)',
        superheat: '过热度(°C)',
        subcool: '过冷度(°C)',
    };

    const stats = [];

    numericKeys.forEach(key => {
        const values = history
            .map(r => r[key])
            .filter(v => typeof v === 'number' && isFinite(v));

        if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(
                values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
            );

            stats.push({
                参数名称: labels[key] || key,
                最小值: Number(min.toFixed(2)),
                最大值: Number(max.toFixed(2)),
                平均值: Number(avg.toFixed(2)),
                标准差: Number(stdDev.toFixed(2)),
                数据点: values.length
            });
        }
    });

    // 添加布尔值统计
    const boolKeys = ['sprayOn', 'dxOn'];
    const boolLabels = {
        sprayOn: '喷淋开启率',
        dxOn: '压缩机开启率'
    };

    boolKeys.forEach(key => {
        const values = history.map(r => r[key]).filter(v => typeof v === 'boolean');
        if (values.length > 0) {
            const onCount = values.filter(v => v === true).length;
            const rate = (onCount / values.length * 100);
            stats.push({
                参数名称: boolLabels[key] || key,
                最小值: '-',
                最大值: '-',
                平均值: `${rate.toFixed(1)}%`,
                标准差: '-',
                数据点: values.length
            });
        }
    });

    return stats;
}
