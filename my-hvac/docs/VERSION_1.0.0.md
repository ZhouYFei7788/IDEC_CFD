# 间接蒸发冷仿真计算平台 - 版本记录

## 版本 1.0.0 - 完整功能版本
**发布日期**: 2025-12-13
**提交ID**: da2b7c8

### 功能特性

#### 🌡️ HVAC物理仿真
- IEC间接蒸发冷却 + DX直膨制冷混合系统
- 精确的湿球温度和换热效率计算
- 动态热负载响应
- 冷媒循环模拟(蒸发温度/冷凝温度/压力)

#### 🎮 运行模式
- **自动模式**: 智能切换IEC/DX，自动优化能效
- **干模式**: 仅使用干空气换热
- **湿模式**: 启用喷淋蒸发冷却
- **混合模式**: IEC+DX协同工作
- **DX模式**: 纯压缩机制冷

#### 📊 监控功能
- 实时温度监控 (送风/回风/冷通道/室外)
- 功率与能效监控 (总功耗/风机/压缩机/COP)
- 制冷输出监控 (总量/IEC/DX/CFC需求)
- 设备状态监控 (喷淋/压缩机/EEV/频率)

#### ⚠️ 告警系统
- 5级告警优先级 (P0-P4)
- 详细的告警原因与解决方案
- 告警历史记录与统计
- 实时告警提醒

#### 🔧 设备故障仿真
- 7种设备故障类型随机触发
- 故障影响实时作用于物理仿真
- 故障暂停/恢复功能
- 手动复位/批量清除

#### 📈 COP/PUE分析
- 送风温度设定点效率记录
- COP/PUE平均值与范围统计
- 效率排行榜(可按COP排序)
- 开始/暂停分析控制

### 技术栈
- React 19.2.0
- Vite 7.2.4
- Tailwind CSS 3.4.17
- Recharts 3.5.1
- Lucide React Icons
- PsychroLib (湿空气计算)

### 文件结构
```
my-hvac/
├── src/
│   ├── App.jsx                 # 主应用组件
│   ├── components/
│   │   ├── AlertCenter.jsx     # 告警监控中心
│   │   ├── EquipmentFaultsPanel.jsx  # 设备故障面板
│   │   ├── HvacDiagram.jsx     # HVAC动画图
│   │   ├── ClickableParameter.jsx    # 可点击参数
│   │   ├── AdvancedSettings.jsx      # 高级设置
│   │   └── ...
│   ├── hooks/
│   │   ├── useHvacPhysics.js   # 物理仿真核心
│   │   ├── useCopAnalysis.js   # COP分析
│   │   ├── useEquipmentFaults.js     # 设备故障
│   │   ├── useAlerts.js        # 告警系统
│   │   └── useHistoryData.js   # 历史数据
│   └── config/
│       └── alertRules.js       # 告警规则配置
└── ...
```

---

## 后续规划
- [ ] 多机组寻优功能
- [ ] 历史数据导出
- [ ] 更多故障类型
- [ ] 参数优化建议
- [ ] 移动端适配优化
