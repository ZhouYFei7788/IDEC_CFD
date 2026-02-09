# 数据中心 2.5D 孪生视图

一个基于 React Three Fiber 的数据中心可视化系统，展示 HAC (Hot Aisle Containment) 热通道封闭架构。

## 功能特性

### 🏢 核心功能
- **2.5D 等轴测视图**：使用正交相机实现专业的工程视图
- **HAC 区域可视化**：完整展示热通道封闭架构
- **实时监控**：机柜状态、PDU 负载、三相电力监控
- **动态气流效果**：使用自定义 Shader 实现冷热气流可视化
- **列头柜监控**：实时显示三相负载均衡状态

### 🎨 视觉效果
- **状态指示灯**：
  - 🟢 绿色 - 正常运行
  - 🟡 黄色 - 负载警告
  - 🔴 红色 - 严重告警
- **三相电力可视化**：
  - L1 相位 - 红色
  - L2 相位 - 黄色
  - L3 相位 - 蓝色
- **动画效果**：
  - 气流流动动画
  - 状态灯呼吸效果
  - 平滑的相机控制

### 🔧 技术架构

#### 前端技术栈
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Three.js** - 3D 渲染引擎
- **React Three Fiber** - React 的 Three.js 渲染器
- **React Three Drei** - R3F 工具库
- **Vite** - 构建工具

#### 核心组件
1. **HACZone** - HAC 区域容器
2. **CabinetHead** - 列头柜监控面板
3. **Airflow** - 气流效果（Shader 材质）
4. **CableTray** - 电缆桥架
5. **Scene** - 主场景管理器
6. **Overlay** - HTML UI 叠加层

## 安装与运行

### 环境要求
- Node.js >= 16
- npm >= 7

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

访问 http://localhost:5173

### 生产构建
```bash
npm run build
```

构建产物在 `dist` 目录

### 预览生产构建
```bash
npm run preview
```

## 项目结构

```
机房CFD/
├── src/
│   ├── App.tsx          # 主应用组件
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局样式
├── public/              # 静态资源
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── tsconfig.json        # TypeScript 配置
└── vite.config.ts       # Vite 配置
```

## 配置说明

### 场景配置 (DIMS)
```typescript
const DIMS = {
  RACK_WIDTH: 1.2,        // 机柜宽度
  RACK_HEIGHT: 3.5,       // 机柜高度
  RACK_DEPTH: 1.5,        // 机柜深度
  AISLE_WIDTH: 2.5,       // 通道宽度
  ROW_SPACING: 2.0,       // 机柜间距
  CABINET_HEAD_WIDTH: 1.5 // 列头柜宽度
};
```

### 颜色配置 (COLORS)
```typescript
const COLORS = {
  FLOOR: '#2a2a2a',           // 地板
  RACK_BODY: '#1e293b',       // 机柜主体
  HAC_GLASS: '#0ea5e9',       // HAC 透明顶棚
  STATE_NORMAL: '#10b981',    // 正常状态
  STATE_WARNING: '#f59e0b',   // 警告状态
  STATE_ALARM: '#ef4444',     // 告警状态
  L1: '#ef4444',              // L1 相位
  L2: '#eab308',              // L2 相位
  L3: '#3b82f6'               // L3 相位
};
```

### 数据模型

#### ZoneData
```typescript
interface ZoneData {
  id: number;
  position: [number, number, number];
  rows: {
    left: RackData[];
    right: RackData[];
  };
}
```

#### RackData
```typescript
interface RackData {
  id: string;
  state: HealthState;
  loadKW: number;
  phaseLoad: PhaseLoad;
}
```

## 性能优化

### 已实施的优化
1. **Instanced Rendering** - 使用 `<Instances>` 批量渲染机柜
2. **useMemo** - 缓存计算结果
3. **useRef** - 避免不必要的重渲染
4. **DPR 限制** - 限制设备像素比为 [1, 2]
5. **正交相机** - 使用正交投影减少计算

### 性能建议
- 在低端设备上减少 Zone 数量（当前 6 个）
- 减少每排机柜数量（当前 8 个）
- 降低 Shader 复杂度
- 使用 LOD (Level of Detail) 系统

## 自定义开发

### 添加新的监控指标
1. 在 `RackData` 接口中添加新字段
2. 更新 `generateMockData` 函数
3. 在 `CabinetHead` 组件中添加显示逻辑

### 修改气流效果
编辑 `AirflowShaderMaterial` 的 Fragment Shader：
```glsl
float pattern = sin(vUv.y * 20.0 - time * 3.0) * 0.5 + 0.5;
```

### 调整相机视角
修改 `Canvas` 组件的 camera 属性：
```tsx
<Canvas
  orthographic
  camera={{ 
    position: [50, 50, 50],  // 相机位置
    zoom: 20,                 // 缩放级别
    near: 0.1, 
    far: 1000 
  }}
>
```

## 常见问题

### Q: 字体加载失败？
A: 确保网络连接正常，组件使用 Google Fonts 的 Noto Sans SC。

### Q: 性能较差？
A: 尝试减少 Zone 数量或机柜数量，或降低 DPR。

### Q: Shader 不工作？
A: 检查浏览器是否支持 WebGL 2.0。

## 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

需要 WebGL 2.0 支持。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请提交 Issue。
