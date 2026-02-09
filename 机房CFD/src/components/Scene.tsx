import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { Zone } from './Zone';
import type { ZoneData } from '../types';

interface SceneProps {
    zones: ZoneData[];
}

export function Scene({ zones }: SceneProps) {
    return (
        <>
            {/* 相机控制 */}
            <OrbitControls
                makeDefault
                minDistance={5}
                maxDistance={50}
            />

            {/* 辅助坐标轴 - 帮助调试 */}
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport />
            </GizmoHelper>

            {/* 环境光 */}
            <ambientLight intensity={0.5} />

            {/* 主光源 */}
            <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
            />

            {/* 补光 */}
            <directionalLight
                position={[-10, 10, -5]}
                intensity={0.3}
            />

            {/* 地面网格 */}
            <Grid
                args={[50, 50]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#444"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#666"
                fadeDistance={30}
                fadeStrength={1}
                followCamera={false}
            />

            {/* 渲染所有区域 */}
            <group position={[-10, 0, 0]}>
                {zones.map((zone) => (
                    <Zone key={zone.id} data={zone} />
                ))}
            </group>
        </>
    );
}
