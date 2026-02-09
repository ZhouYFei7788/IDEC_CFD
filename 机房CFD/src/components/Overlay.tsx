import { COLORS } from '../constants';

interface OverlayProps {
    onRefresh: () => void;
    lastUpdate: number;
}

export function Overlay({ onRefresh, lastUpdate }: OverlayProps) {
    return (
        <div className="overlay">
            {/* 标题卡片 */}
            <div className="card">
                <h1>数据中心 3D 可视化</h1>
                <div className="legend">
                    <div className="legend-item">
                        <span className="dot" style={{ backgroundColor: COLORS.STATE_NORMAL }}></span>
                        <span>正常</span>
                    </div>
                    <div className="legend-item">
                        <span className="dot" style={{ backgroundColor: COLORS.STATE_WARNING }}></span>
                        <span>警告</span>
                    </div>
                    <div className="legend-item">
                        <span className="dot" style={{ backgroundColor: COLORS.STATE_ALARM }}></span>
                        <span>告警</span>
                    </div>
                </div>
            </div>

            {/* 控制卡片 */}
            <div className="card controls">
                <button onClick={onRefresh} className="refresh-btn">
                    🔄 刷新数据
                </button>
                <div className="timestamp">
                    更新: {new Date(lastUpdate).toLocaleTimeString()}
                </div>
            </div>

            {/* 帮助提示 */}
            <div className="help">
                <p>💡 鼠标左键旋转 | 右键平移 | 滚轮缩放</p>
            </div>
        </div>
    );
}
