import { useState, useEffect } from 'react';
import './App.css';

// 配置
const CONFIG = {
  HAC_UNITS: 3,           // HAC单元数量
  RACKS_PER_ROW: 12,      // 每排12个机柜
  RACK: { w: 30, h: 40 }, // 2D尺寸（像素）
  SPACING: 35,            // 机柜间距
  COLD_AISLE: 60,         // 冷通道宽度
  HOT_AISLE: 80,          // 热通道宽度
  UNIT_GAP: 150,          // HAC单元之间的间距
  COLORS: {
    L1: '#ff3333',
    L2: '#ffdd33',
    L3: '#3366ff',
    COLD: '#00d4ff',
    HOT: '#ff4400',
    NORMAL: '#3b82f6',
    WARNING: '#ffaa00',
    ALARM: '#ff0000',
  }
};

interface RackData {
  status: 'normal' | 'warning' | 'alarm';
  load: number;
  temp: number;
}

// 生成机柜数据
function generateRackData(): RackData {
  const rand = Math.random();
  return {
    status: rand > 0.92 ? 'alarm' : rand > 0.85 ? 'warning' : 'normal',
    load: Math.random() * 25 + 15,
    temp: Math.random() * 10 + 20,
  };
}

// 机柜组件
function Rack({ x, y, data, scale = 1 }: { x: number; y: number; data: RackData; scale?: number }) {
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (data.status !== 'normal') {
      const interval = setInterval(() => {
        setPulse(prev => (prev + 0.1) % (Math.PI * 2));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [data.status]);

  const color = data.status === 'alarm'
    ? CONFIG.COLORS.ALARM
    : data.status === 'warning'
      ? CONFIG.COLORS.WARNING
      : CONFIG.COLORS.NORMAL;

  const opacity = data.status !== 'normal' ? 0.5 + Math.sin(pulse) * 0.3 : 1;
  const glowIntensity = data.status !== 'normal' ? 5 + Math.sin(pulse) * 3 : 2;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 机柜主体 */}
      <rect
        x={0}
        y={0}
        width={CONFIG.RACK.w * scale}
        height={CONFIG.RACK.h * scale}
        fill="#1a1a2e"
        stroke={color}
        strokeWidth={2}
        opacity={opacity}
        filter={`drop-shadow(0 0 ${glowIntensity}px ${color})`}
        rx={3}
      />

      {/* 前面板 */}
      <rect
        x={3}
        y={3}
        width={CONFIG.RACK.w * scale - 6}
        height={CONFIG.RACK.h * scale - 6}
        fill="url(#rackGradient)"
        opacity={0.3}
        rx={2}
      />

      {/* 状态指示灯 */}
      <circle
        cx={CONFIG.RACK.w * scale / 2}
        cy={CONFIG.RACK.h * scale - 5}
        r={3}
        fill={color}
        filter={`drop-shadow(0 0 ${glowIntensity}px ${color})`}
      />

      {/* 散热孔装饰 */}
      {[...Array(3)].map((_, i) => (
        <line
          key={i}
          x1={5}
          y1={8 + i * 10}
          x2={CONFIG.RACK.w * scale - 5}
          y2={8 + i * 10}
          stroke={color}
          strokeWidth={1}
          opacity={0.2}
        />
      ))}
    </g>
  );
}

// 电缆组件
function PowerCables({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <g>
      {/* L1 红相 */}
      <line
        x1={x1}
        y1={y1 - 8}
        x2={x2}
        y2={y2 - 8}
        stroke={CONFIG.COLORS.L1}
        strokeWidth={3}
        opacity={0.8}
        filter={`drop-shadow(0 0 3px ${CONFIG.COLORS.L1})`}
      />

      {/* L2 黄相 */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={CONFIG.COLORS.L2}
        strokeWidth={3}
        opacity={0.8}
        filter={`drop-shadow(0 0 3px ${CONFIG.COLORS.L2})`}
      />

      {/* L3 蓝相 */}
      <line
        x1={x1}
        y1={y1 + 8}
        x2={x2}
        y2={y2 + 8}
        stroke={CONFIG.COLORS.L3}
        strokeWidth={3}
        opacity={0.8}
        filter={`drop-shadow(0 0 3px ${CONFIG.COLORS.L3})`}
      />
    </g>
  );
}

// 气流粒子
function AirflowParticles({ x, y, width, height, isHot }: {
  x: number;
  y: number;
  width: number;
  height: number;
  isHot: boolean;
}) {
  const [particles, setParticles] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    const initialParticles = Array.from({ length: 20 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      id: i,
    }));
    setParticles(initialParticles);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: isHot ? p.x : (p.x + 2) % width,
        y: isHot ? (p.y - 2 + height) % height : p.y,
      })));
    }, 50);

    return () => clearInterval(interval);
  }, [width, height, isHot]);

  const color = isHot ? CONFIG.COLORS.HOT : CONFIG.COLORS.COLD;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {particles.map(p => (
        <circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={color}
          opacity={0.6}
          filter={`drop-shadow(0 0 2px ${color})`}
        />
      ))}
    </g>
  );
}

// 列头柜
function CabinetPanel({ x, y, unitId, avgLoad }: {
  x: number;
  y: number;
  unitId: number;
  avgLoad: number;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 柜体 */}
      <rect
        x={0}
        y={0}
        width={60}
        height={120}
        fill="#0a0a1a"
        stroke="#00ffff"
        strokeWidth={2}
        rx={5}
        filter="drop-shadow(0 0 10px #00ffff)"
      />

      {/* 显示屏 */}
      <rect
        x={5}
        y={5}
        width={50}
        height={80}
        fill="#001a33"
        stroke="#00ffff"
        strokeWidth={1}
        rx={3}
      />

      {/* 文字 */}
      <text
        x={30}
        y={25}
        textAnchor="middle"
        fill="#00ffff"
        fontSize={12}
        fontWeight="bold"
      >
        HAC-{unitId + 1}
      </text>

      <text
        x={30}
        y={40}
        textAnchor="middle"
        fill="#aaaaaa"
        fontSize={9}
      >
        列头柜监控
      </text>

      <text
        x={30}
        y={65}
        textAnchor="middle"
        fill="#00ff00"
        fontSize={18}
        fontWeight="bold"
      >
        {avgLoad} kW
      </text>

      {/* 状态指示灯 */}
      <circle
        cx={30}
        cy={100}
        r={8}
        fill="#00ff00"
        filter="drop-shadow(0 0 8px #00ff00)"
      />
    </g>
  );
}

// HAC单元
function HACUnit({ unitId, x, y }: { unitId: number; x: number; y: number }) {
  const [racks] = useState(() =>
    Array.from({ length: CONFIG.RACKS_PER_ROW * 4 }, generateRackData)
  );

  const avgLoad = Math.round(racks.reduce((sum, r) => sum + r.load, 0) / racks.length);
  const rowLen = CONFIG.RACKS_PER_ROW * CONFIG.SPACING;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 背景区域 */}
      <rect
        x={-20}
        y={-CONFIG.COLD_AISLE - CONFIG.RACK.h - 20}
        width={rowLen + 100}
        height={CONFIG.COLD_AISLE * 2 + CONFIG.HOT_AISLE + CONFIG.RACK.h * 4 + 40}
        fill="rgba(10, 10, 26, 0.3)"
        stroke="rgba(0, 255, 255, 0.2)"
        strokeWidth={1}
        rx={10}
      />

      {/* 冷通道标记 */}
      <rect
        x={0}
        y={-CONFIG.COLD_AISLE - CONFIG.RACK.h}
        width={rowLen}
        height={CONFIG.COLD_AISLE}
        fill={CONFIG.COLORS.COLD}
        opacity={0.1}
        stroke={CONFIG.COLORS.COLD}
        strokeWidth={1}
        strokeDasharray="5,5"
      />

      {/* 热通道标记 */}
      <rect
        x={0}
        y={-CONFIG.RACK.h}
        width={rowLen}
        height={CONFIG.HOT_AISLE + CONFIG.RACK.h * 2}
        fill={CONFIG.COLORS.HOT}
        opacity={0.1}
        stroke={CONFIG.COLORS.HOT}
        strokeWidth={1}
        strokeDasharray="5,5"
      />

      {/* 冷通道标记（下方） */}
      <rect
        x={0}
        y={CONFIG.HOT_AISLE + CONFIG.RACK.h}
        width={rowLen}
        height={CONFIG.COLD_AISLE}
        fill={CONFIG.COLORS.COLD}
        opacity={0.1}
        stroke={CONFIG.COLORS.COLD}
        strokeWidth={1}
        strokeDasharray="5,5"
      />

      {/* 第一排机柜（冷通道外侧） */}
      {racks.slice(0, CONFIG.RACKS_PER_ROW).map((rack, i) => (
        <Rack
          key={`row1-${i}`}
          x={i * CONFIG.SPACING}
          y={-CONFIG.COLD_AISLE - CONFIG.RACK.h}
          data={rack}
        />
      ))}

      {/* 第二排机柜（热通道外侧） */}
      {racks.slice(CONFIG.RACKS_PER_ROW, CONFIG.RACKS_PER_ROW * 2).map((rack, i) => (
        <Rack
          key={`row2-${i}`}
          x={i * CONFIG.SPACING}
          y={-CONFIG.RACK.h}
          data={rack}
        />
      ))}

      {/* 第三排机柜（热通道内侧） */}
      {racks.slice(CONFIG.RACKS_PER_ROW * 2, CONFIG.RACKS_PER_ROW * 3).map((rack, i) => (
        <Rack
          key={`row3-${i}`}
          x={i * CONFIG.SPACING}
          y={CONFIG.HOT_AISLE}
          data={rack}
        />
      ))}

      {/* 第四排机柜（冷通道外侧） */}
      {racks.slice(CONFIG.RACKS_PER_ROW * 3).map((rack, i) => (
        <Rack
          key={`row4-${i}`}
          x={i * CONFIG.SPACING}
          y={CONFIG.HOT_AISLE + CONFIG.COLD_AISLE}
          data={rack}
        />
      ))}

      {/* 电缆 */}
      <PowerCables
        x1={0}
        y1={-CONFIG.COLD_AISLE - CONFIG.RACK.h - 10}
        x2={rowLen}
        y2={-CONFIG.COLD_AISLE - CONFIG.RACK.h - 10}
      />
      <PowerCables
        x1={0}
        y1={CONFIG.HOT_AISLE + CONFIG.COLD_AISLE + CONFIG.RACK.h + 10}
        x2={rowLen}
        y2={CONFIG.HOT_AISLE + CONFIG.COLD_AISLE + CONFIG.RACK.h + 10}
      />

      {/* 气流粒子 - 热通道 */}
      <AirflowParticles
        x={0}
        y={-CONFIG.RACK.h}
        width={rowLen}
        height={CONFIG.HOT_AISLE + CONFIG.RACK.h * 2}
        isHot={true}
      />

      {/* 气流粒子 - 冷通道（上） */}
      <AirflowParticles
        x={0}
        y={-CONFIG.COLD_AISLE - CONFIG.RACK.h}
        width={rowLen}
        height={CONFIG.COLD_AISLE}
        isHot={false}
      />

      {/* 气流粒子 - 冷通道（下） */}
      <AirflowParticles
        x={0}
        y={CONFIG.HOT_AISLE + CONFIG.RACK.h}
        width={rowLen}
        height={CONFIG.COLD_AISLE}
        isHot={false}
      />

      {/* 列头柜 */}
      <CabinetPanel
        x={rowLen + 20}
        y={-CONFIG.RACK.h}
        unitId={unitId}
        avgLoad={avgLoad}
      />
    </g>
  );
}

export default function App() {
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const rowLen = CONFIG.RACKS_PER_ROW * CONFIG.SPACING;
  const totalWidth = CONFIG.HAC_UNITS * (rowLen + CONFIG.UNIT_GAP + 100);
  const totalHeight = CONFIG.COLD_AISLE * 2 + CONFIG.HOT_AISLE + CONFIG.RACK.h * 4 + 100;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewBox(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(2, prev.scale * delta))
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - viewBox.x, y: e.clientY - viewBox.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setViewBox(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className="app">
      <div className="overlay">
        <div className="card">
          <h1>数据中心 HAC 可视化</h1>
          <div className="legend">
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: CONFIG.COLORS.L1 }}></span>
              <span>L1 红相</span>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: CONFIG.COLORS.L2 }}></span>
              <span>L2 黄相</span>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: CONFIG.COLORS.L3 }}></span>
              <span>L3 蓝相</span>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: CONFIG.COLORS.COLD }}></span>
              <span>冷通道</span>
            </div>
            <div className="legend-item">
              <span className="dot" style={{ backgroundColor: CONFIG.COLORS.HOT }}></span>
              <span>热通道</span>
            </div>
          </div>
        </div>
      </div>

      <div className="help">
        <p>💡 拖拽平移 | 滚轮缩放 | 每个HAC单元: 12机柜 x 4排</p>
      </div>

      <div
        className="canvas-container"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${-viewBox.x / viewBox.scale} ${-viewBox.y / viewBox.scale} ${window.innerWidth / viewBox.scale} ${window.innerHeight / viewBox.scale}`}
          style={{ background: '#000510' }}
        >
          <defs>
            {/* 机柜渐变 */}
            <linearGradient id="rackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a4d6e" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#0a4d6e" stopOpacity={0.1} />
            </linearGradient>

            {/* 网格图案 */}
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#003333" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* 背景网格 */}
          <rect
            x={-500}
            y={-500}
            width={totalWidth + 1000}
            height={totalHeight + 1000}
            fill="url(#grid)"
          />

          {/* 渲染HAC单元 */}
          <g transform={`translate(${window.innerWidth / viewBox.scale / 2 - totalWidth / 2}, ${window.innerHeight / viewBox.scale / 2 - totalHeight / 2 + 100})`}>
            {Array.from({ length: CONFIG.HAC_UNITS }).map((_, i) => (
              <HACUnit
                key={i}
                unitId={i}
                x={i * (rowLen + CONFIG.UNIT_GAP + 100)}
                y={0}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}
