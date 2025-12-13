// src/config/alertRules.js
// HVAC系统告警规则配置 - P0到P4优先级系统

/**
 * 告警优先级定义
 * P0 - 紧急 (Critical): 系统即将崩溃，需要立即处理
 * P1 - 高 (High): 严重影响运行，需要尽快处理
 * P2 - 中 (Medium): 影响性能，需要关注
 * P3 - 低 (Low): 轻微偏差，建议优化
 * P4 - 信息 (Info): 提示信息，可选优化
 */

export const ALERT_LEVELS = {
    P0: {
        name: 'P0-紧急',
        color: '#dc2626',
        bgColor: '#dc262610',
        priority: 0,
        icon: '🚨'
    },
    P1: {
        name: 'P1-高',
        color: '#ea580c',
        bgColor: '#ea580c10',
        priority: 1,
        icon: '⚠️'
    },
    P2: {
        name: 'P2-中',
        color: '#f59e0b',
        bgColor: '#f59e0b10',
        priority: 2,
        icon: '⚡'
    },
    P3: {
        name: 'P3-低',
        color: '#3b82f6',
        bgColor: '#3b82f610',
        priority: 3,
        icon: 'ℹ️'
    },
    P4: {
        name: 'P4-信息',
        color: '#6b7280',
        bgColor: '#6b728010',
        priority: 4,
        icon: '💡'
    }
};

export const ALERT_RULES = {
    // 冷通道温度告警
    roomTemp: {
        name: '冷通道温度',
        unit: '°C',
        category: '温度',
        rules: [
            {
                condition: (value) => value > 35,
                level: 'P1',
                title: '冷通道温度严重过高',
                description: '冷通道温度超过32°C，严重超出数据中心标准',
                causes: [
                    '送风温度过高',
                    '制冷系统故障或能力不足',
                    '冷通道封闭失效',
                    '热负载异常增加'
                ],
                solutions: [
                    '立即切换到强冷DX模式',
                    '降低送风温度设定至最低(16-18°C)',
                    '最大化风机转速',
                    '检查冷通道封闭情况',
                    '考虑临时降低IT负载',
                    '启动备用空调系统'
                ],
                impact: '服务器可能触发高温保护并强制关机，导致业务中断'
            },
            {
                condition: (value) => value > 33,
                level: 'P2',
                title: '冷通道温度过高',
                description: '冷通道温度在30-32°C之间，超出ASHRAE推荐范围',
                causes: [
                    '送风温度偏高',
                    '制冷能力接近极限',
                    '气流组织不良'
                ],
                solutions: [
                    '切换到混合模式或DX模式',
                    '降低送风温度设定值',
                    '提高风机转速',
                    '检查冷热通道隔离'
                ],
                impact: '设备可靠性下降，可能出现性能降频'
            },
            {
                condition: (value) => value > 30,
                level: 'P3',
                title: '冷通道温度偏高',
                description: '冷通道温度在27-30°C之间，接近上限',
                causes: [
                    '送风温度设定较高',
                    '制冷需求增加',
                    '环境温度上升'
                ],
                solutions: [
                    '适当降低送风温度',
                    '监控温度变化趋势',
                    '准备增强制冷'
                ],
                impact: '接近温度上限，需要密切监控'
            },
            {
                condition: (value) => value > 28,
                level: 'P4',
                title: '冷通道温度略高',
                description: '冷通道温度在26-27°C之间，建议关注',
                causes: [
                    '送风温度设定在正常范围上限',
                    '热负载正常波动'
                ],
                solutions: [
                    '继续监控温度变化',
                    '评估是否需要调整设定值'
                ],
                impact: '温度在可接受范围内，但建议优化'
            },
            {
                condition: (value) => value < 18,
                level: 'P4',
                title: '冷通道温度过低',
                description: '冷通道温度低于18°C，可能造成能源浪费',
                causes: [
                    '送风温度设定过低',
                    '制冷过度'
                ],
                solutions: [
                    '提高送风温度设定值至20-22°C',
                    '降低制冷强度',
                    '优化能效比'
                ],
                impact: '能耗增加，运营成本上升，可能产生冷凝水'
            }
        ]
    },

    // 热通道温度告警
    raTemp: {
        name: '热通道温度',
        unit: '°C',
        category: '温度',
        rules: [
            {
                condition: (value) => value > 50,
                level: 'P0',
                title: '热通道温度极高-紧急',
                description: '热通道温度超过45°C，系统处于危险状态',
                causes: [
                    '制冷系统完全失效',
                    '送风温度极高',
                    '热负载严重超标',
                    '气流完全短路'
                ],
                solutions: [
                    '立即启动应急预案',
                    '考虑紧急关闭部分IT负载',
                    '检查空调系统是否故障',
                    '启动所有备用制冷设备',
                    '通知运维团队紧急处理'
                ],
                impact: '服务器即将触发紧急关机保护，业务将中断'
            },
            {
                condition: (value) => value > 42,
                level: 'P4',
                title: '热通道温度略高',
                description: '热通道温度在37-45°C之间，建议关注',
                causes: [
                    '送风温度较高',
                    '机房负载增加',
                    '制冷能力有限'
                ],
                solutions: [
                    '监控温度变化趋势',
                    '评估是否需要增强制冷',
                    '检查热负载分布'
                ],
                impact: '温度偏高但在可控范围，需要持续监控'
            },
            {
                condition: (value) => value < 22,
                level: 'P4',
                title: '热通道温度过低',
                description: '热通道温度低于22°C，可能存在测量问题',
                causes: [
                    '温度传感器故障',
                    '热负载极低',
                    '送风温度过低'
                ],
                solutions: [
                    '检查温度传感器',
                    '确认热负载是否正常',
                    '检查送风温度设定'
                ],
                impact: '可能存在测量异常或系统配置问题'
            }
        ]
    },

    // 送风温度告警
    saTemp: {
        name: '送风温度',
        unit: '°C',
        category: '温度',
        rules: [
            {
                condition: (value) => value > 35,
                level: 'P0',
                title: '送风温度极高-紧急',
                description: '送风温度超过30°C，制冷系统可能失效',
                causes: [
                    '室外温度极高且IEC失效',
                    'DX系统故障',
                    '制冷剂泄漏',
                    '压缩机故障'
                ],
                solutions: [
                    '立即检查DX系统运行状态',
                    '检查制冷剂压力',
                    '启动备用空调系统',
                    '联系维修人员',
                    '考虑临时降低IT负载'
                ],
                impact: '机房将快速升温，可能导致大规模设备宕机'
            },
            {
                condition: (value) => value > 32,
                level: 'P1',
                title: '送风温度严重过高',
                description: '送风温度在28-30°C之间，制冷能力严重不足',
                causes: [
                    '室外温度过高',
                    'DX制冷能力不足',
                    '风量过小',
                    '热负载过大'
                ],
                solutions: [
                    '立即切换到强冷DX模式',
                    '检查压缩机运行状态',
                    '增加风机转速',
                    '降低送风温度设定值'
                ],
                impact: '机房温度将持续上升，设备可能降频或宕机'
            },
            {
                condition: (value) => value > 28,
                level: 'P2',
                title: '送风温度偏高',
                description: '送风温度在25-28°C之间，需要关注',
                causes: [
                    '室外温度较高',
                    '制冷能力接近极限'
                ],
                solutions: [
                    '考虑切换到混合模式',
                    '适当提高风机转速',
                    '监控温度趋势'
                ],
                impact: '机房温度可能逐渐升高'
            },
            {
                condition: (value) => value < 15,
                level: 'P2',
                title: '送风温度过低',
                description: '送风温度低于15°C，可能导致结露',
                causes: [
                    'DX制冷过度',
                    '送风温度设定过低'
                ],
                solutions: [
                    '提高送风温度设定值',
                    '降低制冷强度',
                    '检查是否有结露现象'
                ],
                impact: '可能在风管和设备表面产生冷凝水'
            }
        ]
    },

    // 制冷需求告警
    cfc: {
        name: '制冷需求',
        unit: '%',
        category: '性能',
        rules: [
            {
                condition: (value) => value > 95,
                level: 'P1',
                title: '制冷需求极高',
                description: '制冷需求超过95%，系统满负荷运行',
                causes: [
                    '室外温度极高',
                    '热负载过大',
                    '送风温度设定过低'
                ],
                solutions: [
                    '确认已切换到强冷DX模式',
                    '适当提高送风温度设定值',
                    '检查系统是否有故障',
                    '考虑增加备用制冷设备'
                ],
                impact: '系统无冗余能力，任何故障都将导致温度失控'
            },
            {
                condition: (value) => value > 85,
                level: 'P2',
                title: '制冷需求很高',
                description: '制冷需求在85-95%之间，接近满负荷',
                causes: [
                    '室外温度很高',
                    '系统接近设计极限'
                ],
                solutions: [
                    '监控系统运行状态',
                    '准备应急措施',
                    '检查所有设备运行正常'
                ],
                impact: '系统冗余能力有限'
            },
            {
                condition: (value) => value > 70,
                level: 'P3',
                title: '制冷需求较高',
                description: '制冷需求在70-85%之间',
                causes: [
                    '室外温度较高',
                    '热负载正常波动'
                ],
                solutions: [
                    '持续监控',
                    '评估是否需要优化'
                ],
                impact: '系统运行正常但负荷较高'
            }
        ]
    },

    // 总制冷量告警
    capacity_kw: {
        name: '总制冷量',
        unit: 'kW',
        category: '性能',
        rules: [
            {
                condition: (value, stats, params) => {
                    const loadKw = params.qLoad / 1000;
                    return value < loadKw * 0.7;
                },
                level: 'P0',
                title: '制冷量严重不足',
                description: '总制冷量小于热负载的70%，系统即将失效',
                causes: [
                    '制冷系统故障',
                    '室外温度极高导致IEC完全失效',
                    'DX系统未启动或故障'
                ],
                solutions: [
                    '立即检查制冷系统状态',
                    '强制启动DX系统',
                    '检查制冷剂和压缩机',
                    '启动备用空调',
                    '考虑降低IT负载'
                ],
                impact: '机房温度将快速上升，可能导致大规模宕机'
            },
            {
                condition: (value, stats, params) => {
                    const loadKw = params.qLoad / 1000;
                    return value < loadKw * 0.85;
                },
                level: 'P1',
                title: '制冷量不足',
                description: '总制冷量小于热负载的85%',
                causes: [
                    '室外温度过高',
                    'DX系统能力不足',
                    '系统性能下降'
                ],
                solutions: [
                    '切换到强冷DX模式',
                    '最大化风机转速',
                    '检查系统运行参数'
                ],
                impact: '机房温度将持续上升'
            }
        ]
    },

    // 压缩机频率告警
    compHz: {
        name: '压缩机频率',
        unit: 'Hz',
        category: '设备',
        rules: [
            {
                condition: (value, stats) => stats.dxOn && value > 88,
                level: 'P2',
                title: '压缩机超高频运行',
                description: '压缩机频率超过88Hz，接近极限',
                causes: [
                    '制冷需求极高',
                    '室外温度过高'
                ],
                solutions: [
                    '适当提高送风温度设定值',
                    '监控压缩机运行状态',
                    '检查系统是否过载'
                ],
                impact: '压缩机寿命缩短，能耗极高'
            },
            {
                condition: (value, stats) => stats.dxOn && value > 85,
                level: 'P3',
                title: '压缩机高频运行',
                description: '压缩机频率在85-88Hz之间',
                causes: [
                    '制冷需求高',
                    '送风温度设定较低'
                ],
                solutions: [
                    '监控运行状态',
                    '评估是否需要优化设定值'
                ],
                impact: '长期高频运行可能影响寿命'
            }
        ]
    },

    // 风机转速告警
    fanSpeed_actual: {
        name: '风机转速',
        unit: '%',
        category: '设备',
        rules: [
            {
                condition: (value) => value > 98,
                level: 'P2',
                title: '风机满负荷运行',
                description: '风机转速超过98%，已达最大能力',
                causes: [
                    '需要最大风量',
                    '系统阻力可能过大'
                ],
                solutions: [
                    '检查过滤器是否堵塞',
                    '检查风道阻力',
                    '考虑清洗IEC芯体'
                ],
                impact: '无调节余量，噪音大，能耗高'
            },
            {
                condition: (value) => value < 25,
                level: 'P4',
                title: '风机低速运行',
                description: '风机转速低于25%',
                causes: [
                    '制冷需求低',
                    '风速设定过低'
                ],
                solutions: [
                    '确认当前工况是否合理',
                    '检查温度是否满足要求'
                ],
                impact: '换热效率可能降低'
            }
        ]
    }
};

/**
 * 检查参数是否触发告警
 */
export const checkAlert = (parameter, value, stats, params) => {
    const paramRules = ALERT_RULES[parameter];
    if (!paramRules || !paramRules.rules) return null;

    // 检查所有规则，返回第一个匹配的告警（优先级最高的）
    for (const rule of paramRules.rules) {
        if (rule.condition(value, stats, params)) {
            return {
                parameter,
                paramName: paramRules.name,
                category: paramRules.category,
                value,
                unit: paramRules.unit,
                level: rule.level,
                levelInfo: ALERT_LEVELS[rule.level],
                title: rule.title,
                description: rule.description,
                causes: rule.causes,
                solutions: rule.solutions,
                impact: rule.impact,
                timestamp: Date.now()
            };
        }
    }

    return null;
};

/**
 * 获取告警级别的颜色
 */
export const getAlertColor = (level) => {
    return ALERT_LEVELS[level]?.color || '#6b7280';
};

/**
 * 获取告警级别的背景色
 */
export const getAlertBgColor = (level) => {
    return ALERT_LEVELS[level]?.bgColor || '#6b728010';
};

/**
 * 获取告警级别的图标
 */
export const getAlertIcon = (level) => {
    return ALERT_LEVELS[level]?.icon || '•';
};
