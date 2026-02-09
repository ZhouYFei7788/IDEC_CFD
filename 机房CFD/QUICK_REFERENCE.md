# 快速参考 - 数据中心 3D 可视化

## 🎯 当前状态

✅ **项目已完全重构**
- 模块化架构
- 简化的 3D 场景
- 美观的 UI
- 调试工具

## 📁 文件结构

```
src/
├── components/
│   ├── Rack.tsx       - 单个机柜（带状态灯和动画）
│   ├── Zone.tsx       - 机柜区域（左右两排）
│   ├── Scene.tsx      - 3D 场景（光照、网格、坐标轴）
│   └── Overlay.tsx    - UI 界面（图例、控制）
├── types.ts           - TypeScript 类型定义
├── constants.ts       - 颜色和尺寸常量
├── utils.ts           - 工具函数（数据生成）
├── App.tsx            - 主应用组件
├── App.css            - 应用样式
├── index.css          - 全局样式
└── main.tsx           - 入口文件
```

## 🎨 自定义配置

### 修改区域数量
`src/utils.ts`:
```tsx
const numZones = 3; // 改为你想要的数量
```

### 修改机柜数量
`src/utils.ts`:
```tsx
const racksPerRow = 5; // 每排机柜数量
```

### 修改颜色
`src/constants.ts`:
```tsx
export const COLORS = {
  RACK_BODY: '#3b82f6',  // 机柜颜色
  RACK_ALARM: '#ef4444', // 告警颜色
  // ...
};
```

### 修改尺寸
`src/constants.ts`:
```tsx
export const DIMS = {
  RACK_WIDTH: 0.6,    // 机柜宽度
  RACK_HEIGHT: 2.0,   // 机柜高度
  RACK_DEPTH: 0.8,    // 机柜深度
  // ...
};
```

### 修改相机位置
`src/App.tsx`:
```tsx
camera={{ 
  position: [15, 10, 15], // [x, y, z]
  fov: 50,                // 视野角度
}}
```

## 🔧 常用操作

### 添加新组件
1. 在 `src/components/` 创建新文件
2. 导出 React 组件
3. 在需要的地方导入使用

### 添加新功能
1. 在 `src/utils.ts` 添加工具函数
2. 在 `src/types.ts` 添加类型定义
3. 在组件中使用

### 调试
- 查看右下角坐标轴
- 查看左上角 FPS
- 打开浏览器控制台

## 🎮 交互说明

| 操作 | 功能 |
|------|------|
| 左键拖拽 | 旋转视角 |
| 右键拖拽 | 平移场景 |
| 滚轮 | 缩放 |
| 刷新按钮 | 重新生成数据 |

## 🚀 性能优化

### 如果 FPS 低
1. 减少区域数量
2. 减少机柜数量
3. 降低 DPR: `dpr={[1, 1]}`
4. 关闭阴影: 移除 `shadows` 属性

### 如果加载慢
1. 使用 `Suspense` 包裹组件
2. 懒加载大型资源
3. 优化几何体复杂度

## 📦 依赖说明

| 包 | 用途 |
|----|------|
| `three` | 3D 引擎 |
| `@react-three/fiber` | React 渲染器 |
| `@react-three/drei` | 辅助组件库 |
| `@react-three/postprocessing` | 后期效果 |
| `leva` | 调试面板 |

## 🎨 组件说明

### Rack (机柜)
- 显示单个机柜
- 状态指示灯
- 呼吸动画（告警时）

### Zone (区域)
- 包含左右两排机柜
- 地面标记
- 区域边框

### Scene (场景)
- 光照系统
- 地面网格
- 坐标轴辅助
- 相机控制

### Overlay (UI)
- 标题和图例
- 控制按钮
- 帮助提示

## 🐛 故障排除

### 黑屏
1. 检查相机位置
2. 检查光照强度
3. 检查 WebGL 支持

### 看不到模型
1. 尝试旋转视角
2. 尝试缩放
3. 检查控制台错误

### 性能差
1. 减少对象数量
2. 降低分辨率
3. 关闭后期效果

## 💡 最佳实践

1. **保持组件小而专注**
2. **使用 TypeScript 类型**
3. **提取常量到配置文件**
4. **使用 useMemo 优化性能**
5. **添加适当的注释**

## 📞 获取帮助

1. 查看浏览器控制台
2. 查看 REFACTORING.md
3. 查看 TROUBLESHOOTING.md
4. 检查 Three.js 文档

---

**更新时间**: 2025-12-13  
**版本**: 2.0.0 (重构版)
