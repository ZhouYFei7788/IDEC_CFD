# 版本管理说明

## 当前项目版本

### 主版本：真实物理模型
- **文件**: `src/hooks/useHvacPhysics.js`
- **特点**: 包含真实物理限制和设备保护
- **IEC额定**: 60kW (最大72kW)
- **适用**: 生产环境、设备选型、性能评估

### 备份版本：简化物理模型
- **文件**: `src/hooks/useHvacPhysics.v3.backup.js`
- **特点**: 理想化计算，无高温衰减
- **IEC上限**: 100kW (硬限制)
- **适用**: 教学演示、快速原型

## 版本历史

```
v1.backup - 最早期版本
v2.backup - 优化控制逻辑版本
v3.backup - 简化物理模型（2025-12-12备份）
current   - 真实物理模型（2025-12-12升级）
```

## 快速切换

### 切换到简化模型
```bash
cp src/hooks/useHvacPhysics.v3.backup.js src/hooks/useHvacPhysics.js
```

### 切换到真实模型
```bash
# 如果之前保存了真实模型
cp src/hooks/useHvacPhysics.realistic.js src/hooks/useHvacPhysics.js

# 或者重新应用修改（参考 REALISTIC_PHYSICS_UPGRADE.md）
```

## 文档索引

1. **REALISTIC_PHYSICS_UPGRADE.md** - 真实物理模型升级说明
2. **IEC_DRY_MODE_CALCULATION.md** - IEC干模式制冷量计算分析
3. **TESTING_GUIDE.md** - 测试指南和版本对比
4. **ALERT_CENTER_GUIDE.md** - P0-P4告警系统使用指南
5. **ALERT_SYSTEM_SUMMARY.md** - 告警系统升级总结

## 推荐配置

### 开发/测试环境
- 可以使用简化模型
- 快速验证功能
- 理想化展示

### 生产/演示环境
- **必须使用真实模型**
- 准确反映设备性能
- 包含安全保护机制

## 注意事项

⚠️ **重要**: 真实模型和简化模型的主要差异在高负载工况下才明显。正常工况下（负载<60kW）两者表现基本一致。

✅ **建议**: 默认使用真实模型，除非有特殊需求。
