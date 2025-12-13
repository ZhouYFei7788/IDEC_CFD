# HVAC Physics 版本备份说明

## 📦 备份版本

### v2.backup.js - 智能控制版本
**文件**: `src/hooks/useHvacPhysics.v2.backup.js`  
**日期**: 2025-11-29  
**描述**: 当前稳定版本，包含智能控制系统

#### 主要特性
- ✅ CFC (Call For Cooling) 制冷需求计算
- ✅ 智能送风温度调节（±5°C基于机房温度）
- ✅ 动态风速调节（40%-150%）
- ✅ 压缩机滞环控制
- ✅ PID温度控制
- ✅ 热惯性模拟（1秒时间常数）
- ✅ 详细制冷量输出（总量、IEC、DX）
- ✅ 0.7秒更新间隔

#### 控制逻辑
1. **CFC计算**: 基于raTemp vs 45°C目标
2. **送风温度**:
   - raTemp > 55°C → saSet - 5°C
   - raTemp < 45°C → saSet
   - 45-55°C → 线性插值
3. **风速调节**:
   - CFC < 30% → 60%基准风速
   - CFC 30-70% → 100%基准风速
   - CFC > 70% → 150%基准风速（超频）
4. **压缩机**: 
   - CFC > 60% 或 raTemp > 55°C → 开启
   - CFC < 40% 且 raTemp < 45°C → 关闭
   - 其他 → 保持（滞环）
5. **EEV**: 简单模式（开50%/关0%）

---

### v1.backup.js - 原始版本
**文件**: `src/hooks/useHvacPhysics.v1.backup.js`  
**日期**: 之前  
**描述**: 原始复杂版本，包含详细物理模型

---

## 🔄 如何恢复备份

### 恢复v2版本（当前版本）
```bash
cp src/hooks/useHvacPhysics.v2.backup.js src/hooks/useHvacPhysics.js
```

### 恢复v1版本（原始版本）
```bash
cp src/hooks/useHvacPhysics.v1.backup.js src/hooks/useHvacPhysics.js
```

---

## 📝 版本对比

| 特性 | v1 (原始) | v2 (当前) |
|------|-----------|-----------|
| 代码行数 | ~500行 | ~330行 |
| CFC计算 | 无 | ✅ 有 |
| 智能控制 | 无 | ✅ 有 |
| 风速范围 | 0-100% | 40-150% |
| PID控制 | ✅ 有 | ✅ 有 |
| EEV控制 | 复杂 | 简化 |
| 更新间隔 | 1000ms | 700ms |
| 热惯性 | 多个 | 简化 |

---

## 💾 备份文件位置

```
src/hooks/
├── useHvacPhysics.js           # 当前使用
├── useHvacPhysics.v1.backup.js # 原始版本
└── useHvacPhysics.v2.backup.js # 智能控制版本 ⭐ 最新备份
```

---

## ⚠️ 注意事项

1. **不要删除备份文件**
2. **修改前先备份**
3. **测试后再部署**

---

## 🚀 推荐使用

**当前推荐**: v2.backup.js  
**原因**: 
- 代码更简洁
- 智能控制更实用
- 性能更好
- 易于维护
备份完成: Fri Dec 12 18:09:19 CST 2025
- v3.backup: 简化物理模型版本 (2025-12-12)
