# 项目文件结构说明（my-hvac）

## src/
- **App.jsx**：主入口组件，负责整体布局、模式切换、参数控制以及渲染 `HvacDiagram` 与 `EfficiencyPanel`。已使用 `useHvacPhysics` Hook 抽离物理计算逻辑。
- **App.jsx.bak**：原始 `App.jsx` 的备份文件，已不再使用，可安全删除。
- **App.css**：旧的局部样式文件，现已迁移至 Tailwind CSS，文件内容基本为空，可删除。
- **main.jsx**：React 应用的根渲染文件，挂载 `UltimateIECDxDemo` 到页面根节点。
- **index.css**：全局样式文件，定义基础的字体、颜色等全局 CSS 变量。
- **utils.js**：工具函数集合，包含 `cn`（类名合并）、`getSatPressure`、`calculateWetBulb`、`getAirColor` 等通用计算与样式工具。
- **hooks/useHvacPhysics.js**：自定义 Hook，封装了所有 HVAC 相关的物理计算（湿球温度、回风温度、DX 参数等），返回 `stats` 对象供组件使用。

## src/components/
- **WindStream.jsx**：风流可视化组件，使用 SVG 路径和动画实现气流的贝塞尔曲线、颜色渐变、粒子效果等。
- **EfficiencyPanel.jsx**：底部信息面板，展示模式、温度、湿度、压缩机转速等实时数据。
- **HvacDiagram.jsx**：主 SVG 可视化组件，负责绘制整个 HVAC 系统的结构（芯体、蒸发器、冷凝器、压缩机、膨胀阀、管路、喷雾系统等），并通过 `WindStream` 渲染空气流动。

## 其他文件
- **package.json、vite.config.ts、tsconfig.json** 等项目配置文件，属于项目必需。
- **node_modules/**、**dist/** 等生成目录，属于构建产物。

## 可删除的文件
- `src/App.jsx.bak`（备份文件）
- `src/App.css`（已不再使用的旧样式文件）

> 删除上述文件后，项目仍能正常编译运行，所有功能均已迁移至新的组件与 Hook 中。
