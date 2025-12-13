# 🌡️ HVAC 模拟器 - 数据中心空调系统仿真平台

一个高度真实的数据中心 HVAC（暖通空调）系统物理仿真平台，支持间接蒸发冷却（IEC）和直膨制冷（DX）系统的实时模拟与可视化。

![HVAC Simulator](https://img.shields.io/badge/React-19.2.0-blue) ![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能特性

### 🎮 运行模式
- **干模式（Dry Mode）** - 纯显热交换
- **湿模式（Wet Mode）** - 蒸发冷却（接近湿球温度）
- **混合模式（Hybrid Mode）** - 智能切换 IEC + DX
- **强冷模式（DX Mode）** - 全功率机械制冷

### 🔬 物理仿真
- ✅ 真实的热力学计算（基于焓湿图）
- ✅ PID 控制算法（温度、风速、EEV 控制）
- ✅ 制冷剂循环模拟（压缩机、冷凝器、蒸发器、膨胀阀）
- ✅ 机房热平衡计算
- ✅ 室外温度扰动模拟（±0.5°C 随机波动）
- ✅ 设备响应延迟和热惯性

### 📊 实时监控
- 🌡️ **温度监控**：室外、回风、送风、芯体出风、排风
- 💨 **风量监控**：体积流量、质量流量、风机转速
- ❄️ **制冷量监控**：IEC 制冷量、DX 制冷量、总制冷量
- ⚡ **能效监控**：COP、功率消耗、制冷需求（CFC）
- 🔄 **冷媒循环**：高低压、冷凝/蒸发温度、过热度/过冷度

### 🎨 可视化界面
- 📈 **历史曲线图**：点击任意参数查看历史趋势
- 🎞️ **动画效果**：气流、水流、压缩机、喷淋系统
- 🎨 **温度色彩映射**：根据温度动态变化颜色
- 📱 **响应式设计**：支持桌面和移动设备

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 🌐 部署到网站

我们提供了多种部署方案，详见 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署（推荐）

#### 方案 1️⃣：Vercel（最简单）

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并部署
vercel login
vercel --prod
```

#### 方案 2️⃣：使用部署脚本

```bash
# 运行交互式部署脚本
./deploy.sh

# 或直接指定部署方式
./deploy.sh vercel    # 部署到 Vercel
./deploy.sh netlify   # 部署到 Netlify
./deploy.sh docker    # 使用 Docker 部署
./deploy.sh build     # 仅构建
```

#### 方案 3️⃣：GitHub Pages（自动部署）

1. 推送代码到 GitHub
2. GitHub Actions 会自动构建和部署
3. 在仓库设置中启用 GitHub Pages（选择 `gh-pages` 分支）

#### 方案 4️⃣：Docker 部署

```bash
# 构建镜像
docker build -t hvac-simulator .

# 运行容器
docker run -d -p 80:80 hvac-simulator

# 访问 http://localhost
```

## 📖 技术栈

- **前端框架**: React 19.2.0
- **构建工具**: Vite 7.2.4
- **动画库**: Framer Motion 12.23.24
- **图表库**: Recharts 3.5.1
- **样式**: TailwindCSS 3.4.17
- **图标**: Lucide React 0.554.0
- **物理计算**: 自研热力学引擎

## 🎯 使用说明

### 基本操作

1. **选择运行模式**：点击顶部的模式切换按钮
2. **调节参数**：
   - 室外温度（OA Temp）：-30°C ~ 50°C
   - 相对湿度（RH）：10% ~ 90%
   - 送风温度设定（SA Set）：16°C ~ 30°C
   - 机房热负载（Heat Load）：10kW ~ 200kW
3. **查看实时数据**：底部面板显示所有关键参数
4. **查看历史曲线**：点击任意参数卡片打开趋势图

### 高级设置

点击右上角的齿轮图标可以调整：
- 空气密度、比热容
- IEC 最大风量、效率参数
- DX 额定制冷量、COP、频率范围
- 机房热容量

## 🔧 系统架构

```
src/
├── components/          # React 组件
│   ├── HvacDiagram.jsx       # SVG 系统图
│   ├── EfficiencyPanel.jsx   # 性能面板
│   ├── AdvancedSettings.jsx  # 高级设置
│   ├── ChartModal.jsx        # 图表弹窗
│   └── ...
├── hooks/              # 自定义 Hooks
│   ├── useHvacPhysics.js     # 物理引擎核心
│   └── useHistoryData.js     # 历史数据管理
├── utils/              # 工具函数
│   └── index.js              # 颜色映射等
├── App.jsx             # 主应用组件
└── main.jsx            # 入口文件
```

## 📊 性能优化

- ✅ 使用 `useRef` 避免不必要的重渲染
- ✅ 模态框状态提升到 App 层级
- ✅ 历史数据限制在 300 个点（5 分钟）
- ✅ 物理计算间隔 700ms
- ✅ 调试日志节流（每 3 秒）

## 🐛 调试

打开浏览器控制台可以看到详细的系统状态日志：
- 温度概览
- 控制信号
- 能量与功率
- 冷媒循环参数

## 📝 更新日志

### v2.0.0 (2025-12-11)
- ✅ 修复芯体温度显示错误
- ✅ 添加多种部署方案支持
- ✅ 创建自动化部署脚本
- ✅ 添加 GitHub Actions 自动部署

### v1.0.0
- 🎉 初始版本发布
- ✅ 完整的 HVAC 物理仿真
- ✅ 四种运行模式
- ✅ 实时可视化

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，请通过 GitHub Issues 联系。

---

**Made with ❤️ for HVAC Engineers**
