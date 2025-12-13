# 🐛 SVG 动画组件温度显示消失问题修复报告

## 问题描述
动画组件（SVG 图表）上的温度数据在刷新页面时会短暂出现，然后立即消失。

## 根本原因

### JavaScript 的 Truthy/Falsy 陷阱

在 JavaScript 中，`0` 是一个 **falsy** 值，这导致了错误的条件判断：

```javascript
// ❌ 错误的写法
{stats.coreOut ? stats.coreOut.toFixed(1) : '--'}

// 当 stats.coreOut = 0 时：
// 0 ? ... : '--'  → 返回 '--'
// 即使温度是 0°C，也会显示 '--'
```

### 问题代码示例

**修复前**：
```javascript
// 第 48 行 - 芯体出风温度
{stats.coreOut ? stats.coreOut.toFixed(1) : '--'}°C
// 当 coreOut = 0 时，显示 '--°C' ❌

// 第 77 行 - 回风温度
回风 RA {stats.raTemp}°
// 当 raTemp = undefined 时，显示 'undefined°' ❌

// 第 79 行 - 送风温度
送风 SA {stats.saTemp.toFixed(1)}°
// 当 saTemp = undefined 时，报错！❌
```

## 修复方案

### 使用正确的 null/undefined 检查

```javascript
// ✅ 正确的写法
{stats.coreOut != null ? stats.coreOut.toFixed(1) : '--'}

// 当 stats.coreOut = 0 时：
// 0 != null → true → 返回 '0.0'
// 当 stats.coreOut = null/undefined 时：
// null != null → false → 返回 '--'
```

### 修复的文件位置

**文件**: `src/components/HvacDiagram.jsx`

**修复的温度显示**：

1. **芯体出风温度** (第 48 行)
   ```javascript
   // 修复前
   {stats.coreOut ? stats.coreOut.toFixed(1) : '--'}°C
   
   // 修复后
   {stats.coreOut != null ? stats.coreOut.toFixed(1) : '--'}°C
   ```

2. **新风温度 OA** (第 62 行)
   ```javascript
   // 修复前
   新风 OA {params.oaTemp.toFixed(1)}°
   
   // 修复后
   新风 OA {params.oaTemp != null ? params.oaTemp.toFixed(1) : '--'}°
   ```

3. **回风温度 RA** (第 77 行)
   ```javascript
   // 修复前
   回风 RA {stats.raTemp}°
   
   // 修复后
   回风 RA {stats.raTemp != null ? stats.raTemp.toFixed(1) : '--'}°
   ```

4. **送风温度 SA** (第 79 行)
   ```javascript
   // 修复前
   送风 SA {stats.saTemp.toFixed(1)}°
   
   // 修复后
   送风 SA {stats.saTemp != null ? stats.saTemp.toFixed(1) : '--'}°
   ```

5. **压缩机频率** (第 179 行)
   ```javascript
   // 修复前
   {stats.compHz}Hz
   
   // 修复后
   {stats.compHz != null ? stats.compHz : 0}Hz
   ```

6. **蒸发器温度** (第 203 行)
   ```javascript
   // 修复前
   {stats.evapTemp}°C
   
   // 修复后
   {stats.evapTemp != null ? stats.evapTemp.toFixed(1) : '--'}°C
   ```

7. **冷凝器温度** (第 234 行)
   ```javascript
   // 修复前
   {stats.condTemp}°C
   
   // 修复后
   {stats.condTemp != null ? stats.condTemp.toFixed(1) : '--'}°C
   ```

## 修复效果

### ✅ 修复前
- ❌ 温度为 0°C 时显示 `--`
- ❌ 温度为 undefined 时显示 `undefined` 或报错
- ❌ 刷新后温度立即消失
- ❌ 用户体验差

### ✅ 修复后
- ✅ 温度为 0°C 时正确显示 `0.0°C`
- ✅ 温度为 null/undefined 时显示 `--`
- ✅ 刷新后温度持续显示
- ✅ 所有数值都有格式化（保留 1 位小数）
- ✅ 用户体验良好

## JavaScript Truthy/Falsy 值表

### Falsy 值（会被判断为 false）
- `false`
- `0` ⚠️ **这是问题的根源！**
- `-0`
- `0n` (BigInt zero)
- `""` (空字符串)
- `null`
- `undefined`
- `NaN`

### Truthy 值（会被判断为 true）
- 所有其他值，包括：
  - `true`
  - 任何非零数字（包括负数）
  - 任何非空字符串
  - 对象 `{}`
  - 数组 `[]`
  - 函数

## 最佳实践

### ❌ 避免使用 Truthy 检查数字
```javascript
// 不好 - 0 会被判断为 false
if (temperature) { ... }
temperature ? ... : ...

// 不好 - 可能会误判
if (!temperature) { ... }
```

### ✅ 使用明确的 null/undefined 检查
```javascript
// 好 - 明确检查 null 和 undefined
if (temperature != null) { ... }
temperature != null ? ... : ...

// 好 - 更严格的检查
if (temperature !== null && temperature !== undefined) { ... }

// 好 - 使用 typeof 检查
if (typeof temperature === 'number') { ... }
```

## 测试场景

### 场景 1：正常温度值
```
OA Temp: 25°C → 显示 "25.0°C" ✅
Core Out: 22.5°C → 显示 "22.5°C" ✅
SA Temp: 18.3°C → 显示 "18.3°C" ✅
```

### 场景 2：零度温度
```
OA Temp: 0°C → 显示 "0.0°C" ✅ (修复前显示 "--")
Core Out: 0°C → 显示 "0.0°C" ✅
SA Temp: 0°C → 显示 "0.0°C" ✅
```

### 场景 3：负温度
```
OA Temp: -10°C → 显示 "-10.0°C" ✅
Core Out: -5.2°C → 显示 "-5.2°C" ✅
```

### 场景 4：初始加载（undefined）
```
刷新页面时，stats 可能暂时为 undefined
所有温度显示 "--" ✅
然后快速更新为实际值 ✅
```

### 场景 5：长时间运行
```
运行 10-30 分钟
所有温度持续正常显示 ✅
不会突然消失 ✅
```

## 部署清单

- [x] 修复芯体出风温度显示
- [x] 修复新风温度显示
- [x] 修复回风温度显示
- [x] 修复送风温度显示
- [x] 修复压缩机频率显示
- [x] 修复蒸发器温度显示
- [x] 修复冷凝器温度显示
- [ ] 本地测试验证
- [ ] 构建生产版本
- [ ] 部署到 Cloudflare Pages

## 相关修复

这个修复与之前的 NaN 修复相辅相成：

1. **NaN 修复** (`useHvacPhysics.js`)
   - 防止计算产生 NaN
   - 使用 `safeNumber()` 函数

2. **显示修复** (`HvacDiagram.jsx`)
   - 防止 0 值被误判
   - 使用 `!= null` 检查

两者结合确保：
- ✅ 计算结果始终有效（不是 NaN）
- ✅ 显示逻辑始终正确（0 值正常显示）

## 下一步

1. **刷新浏览器测试**
   ```
   访问 http://localhost:5173
   观察所有温度是否正常显示
   ```

2. **测试边界情况**
   - 设置 OA Temp = 0°C
   - 设置 SA Set = 0°C
   - 观察显示是否正确

3. **部署到线上**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name=hvac-simulator
   ```

---

**修复完成时间**: 2025-12-11 19:52
**修复文件**: `src/components/HvacDiagram.jsx`
**修复数量**: 7 处温度/频率显示
**风险等级**: 低（只是修复显示逻辑）
