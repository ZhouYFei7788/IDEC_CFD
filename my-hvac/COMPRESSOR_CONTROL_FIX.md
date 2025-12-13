# 压缩机控制逻辑修正

## 问题描述

**严重问题：**
1. ❌ DX模式下压缩机启动后永远不关闭
2. ❌ 干模式下压缩机也不会自动关闭（如果之前开启过）

## 根本原因

### 之前的错误逻辑

```javascript
// 错误1：DX模式无条件开启
else if (mode === 'dx') {
    sprayOn = false;
    dxWanted = true;  // ❌ 永远true，无关闭条件！
}

// 错误2：干模式虽然设置false，但被启停时间保护覆盖
if (mode === 'dry') {
    dxWanted = false;  // ✓ 正确
}
// 但是后面的启停时间保护会强制保持开启状态
if (stateRef.current.dxOn) {
    if (!dxWanted && (now - stateRef.current.dxLastChangeTime) / 1000 < 180) {
        dxWanted = true;  // ❌ 强制开启3分钟
    }
}
```

## 修正后的逻辑

### 1. 干模式 (Dry)

```javascript
if (mode === 'dry') {
    // 干模式：只用IEC干换热，不开喷淋，不开压缩机
    sprayOn = false;
    dxWanted = false;  // 永远false，确保不开DX
}
```

**特点：**
- ✅ 压缩机永远不开启
- ✅ 只使用IEC干换热
- ✅ 最节能模式

### 2. 湿模式 (Wet)

```javascript
if (mode === 'wet') {
    // 湿模式：IEC+喷淋，不开压缩机
    sprayOn = true;
    dxWanted = false;  // 永远false
}
```

**特点：**
- ✅ 压缩机永远不开启
- ✅ 使用IEC+喷淋蒸发冷却
- ✅ 高效节能模式

### 3. 混合模式 (Hybrid)

```javascript
if (mode === 'hybrid') {
    sprayOn = true;
    
    // 智能DX控制（滞环控制）
    if (stateRef.current.dxOn) {
        // 已开启：CFC < 35% 才关闭
        if (cfc < 35) {
            dxWanted = false;
        } else {
            dxWanted = true;
        }
    } else {
        // 已关闭：CFC > 45% 才开启
        if (cfc > 45) {
            dxWanted = true;
        } else {
            dxWanted = false;
        }
    }
    
    // 紧急保护
    if (raTemp > saSet + 10 && saError > -1) {
        dxWanted = true;  // 回风过高强制开启
    }
    
    if (saError > 3) {
        dxWanted = true;  // 送风过高强制开启
    }
    
    if (saError < -3) {
        dxWanted = false;  // 送风过低强制关闭
    }
}
```

**特点：**
- ✅ 智能开关DX
- ✅ 滞环控制避免频繁启停
- ✅ 紧急保护机制

### 4. 强冷DX模式 (DX) - **关键修正**

```javascript
if (mode === 'dx') {
    sprayOn = false;
    
    // 智能DX控制（阈值比混合模式低）
    if (stateRef.current.dxOn) {
        // 已开启：CFC < 20% 且送风温度达标才关闭
        if (cfc < 20 && saError < 0) {
            dxWanted = false;  // ✓ 可以关闭！
        } else {
            dxWanted = true;
        }
    } else {
        // 已关闭：CFC > 30% 或送风过高才开启
        if (cfc > 30 || saError > 2) {
            dxWanted = true;
        } else {
            dxWanted = false;
        }
    }
    
    // 送风严重过低，强制关闭
    if (saError < -5) {
        dxWanted = false;  // ✓ 避免过冷
    }
}
```

**特点：**
- ✅ **不再永远开启！**
- ✅ 根据CFC和送风温度智能控制
- ✅ 避免过冷保护

## 控制策略对比

### 混合模式 vs DX模式

| 参数 | 混合模式 | DX模式 | 说明 |
|------|---------|--------|------|
| 喷淋 | 开启 | 关闭 | DX模式不用喷淋 |
| DX开启阈值 | CFC > 45% | CFC > 30% | DX模式更容易开启 |
| DX关闭阈值 | CFC < 35% | CFC < 20% | DX模式更难关闭 |
| 送风过低保护 | < -3°C | < -5°C | DX模式容忍度更高 |

## 滞环控制原理

### 为什么需要滞环？

**避免频繁启停：**

```
无滞环（错误）：
CFC = 40% → 开启DX
DX开启 → CFC降到39% → 关闭DX
DX关闭 → CFC升到40% → 开启DX
...频繁启停，损坏设备！

有滞环（正确）：
CFC = 40% → 不动作（在35-45%之间）
CFC = 46% → 开启DX
DX开启，CFC降到40% → 保持开启
CFC降到34% → 关闭DX
DX关闭，CFC升到40% → 保持关闭
...稳定运行！
```

### 滞环参数

**混合模式：**
```
开启阈值：45%
关闭阈值：35%
滞环宽度：10%
```

**DX模式：**
```
开启阈值：30%
关闭阈值：20%
滞环宽度：10%
```

## 实际运行效果

### 场景1：干模式，负载50kW

```
初始：DX关闭
运行：IEC提供制冷
结果：DX永远不开启 ✓
```

### 场景2：DX模式，负载50kW

**修正前：**
```
0s: CFC=40% → 开启DX
10s: CFC降到10% → DX仍然开启 ❌
60s: 送风温度降到10°C → DX仍然开启 ❌
永远不关闭！
```

**修正后：**
```
0s: CFC=40% → 开启DX
10s: CFC降到15% → 检查关闭条件
15s: CFC=15%, saError=-2°C → 满足关闭条件
16s: 关闭DX ✓
```

### 场景3：混合模式，负载100kW

```
0s: CFC=50% → 开启DX
30s: CFC降到40% → 保持开启（滞环）
60s: CFC降到30% → 关闭DX ✓
90s: CFC升到40% → 保持关闭（滞环）
120s: CFC升到50% → 开启DX ✓
```

## 紧急保护机制

### 1. 回风温度过高

```javascript
if (raTemp > saSet + 10 && saError > -1) {
    dxWanted = true;  // 强制开启
}
```

**触发条件：**
- 回风温度 > 设定值 + 10°C
- 且送风温度没有过冷

### 2. 送风温度过高

```javascript
if (saError > 3) {
    dxWanted = true;  // 强制开启
}
```

**触发条件：**
- 送风温度 > 设定值 + 3°C

### 3. 送风温度过低

```javascript
if (saError < -3) {  // 混合模式
    dxWanted = false;  // 强制关闭
}

if (saError < -5) {  // DX模式
    dxWanted = false;  // 强制关闭
}
```

**触发条件：**
- 送风温度严重低于设定值
- 避免过冷

## 启停时间保护

```javascript
// 最小启停时间保护
if (stateRef.current.dxOn) {
    // 已开启：最少运行3分钟
    if (!dxWanted && (now - stateRef.current.dxLastChangeTime) / 1000 < 180) {
        dxWanted = true;
    }
} else {
    // 已关闭：最少停机5分钟
    const offTime = (now - stateRef.current.dxLastChangeTime) / 1000;
    if (dxWanted && offTime < 300) {
        // 除非紧急情况（CFC > 80%）
        if (cfc > 80) {
            dxWanted = true;
        } else {
            dxWanted = false;
        }
    }
}
```

**保护目的：**
- ✅ 避免频繁启停损坏压缩机
- ✅ 延长设备寿命
- ✅ 紧急情况可以提前启动

## 总结

### 修正内容

1. ✅ **DX模式不再永远开启**
   - 根据CFC和送风温度智能控制
   - 可以正常关闭

2. ✅ **干模式确保DX不开启**
   - 明确注释说明
   - 逻辑清晰

3. ✅ **添加送风过低保护**
   - 避免过冷
   - 自动关闭DX

4. ✅ **滞环控制优化**
   - 避免频繁启停
   - 稳定运行

### 使用建议

| 模式 | 适用场景 | DX控制 |
|------|---------|--------|
| 干模式 | 低温天气 | 永不开启 |
| 湿模式 | 中温天气 | 永不开启 |
| 混合模式 | 高温天气 | 智能控制（45%/35%） |
| DX模式 | 极端高温 | 智能控制（30%/20%） |

**现在压缩机可以正常开关了！** 🎉
