import { Rack } from './Rack';
import { DIMS } from '../constants';
import type { ZoneData } from '../types';

interface ZoneProps {
    data: ZoneData;
}

export function Zone({ data }: ZoneProps) {
    const rowLength = data.rows.left.length * DIMS.ROW_SPACING;

    return (
        <group position={data.position}>
            {/* 地面标记 */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[rowLength / 2, 0.01, 0]}>
                <planeGeometry args={[rowLength + 1, DIMS.AISLE_WIDTH + 2]} />
                <meshStandardMaterial color="#2a2a2a" />
            </mesh>

            {/* 左排机柜 */}
            <group position={[0, 0, -DIMS.AISLE_WIDTH / 2]}>
                {data.rows.left.map((rack, i) => (
                    <Rack
                        key={rack.id}
                        data={rack}
                        position={[i * DIMS.ROW_SPACING, 0, 0]}
                    />
                ))}
            </group>

            {/* 右排机柜 */}
            <group position={[0, 0, DIMS.AISLE_WIDTH / 2]}>
                {data.rows.right.map((rack, i) => (
                    <Rack
                        key={rack.id}
                        data={rack}
                        position={[i * DIMS.ROW_SPACING, 0, 0]}
                    />
                ))}
            </group>

            {/* 区域边框 */}
            <lineSegments>
                <edgesGeometry
                    args={[
                        new THREE.BoxGeometry(rowLength + 1, 0.1, DIMS.AISLE_WIDTH + 2)
                    ]}
                />
                <lineBasicMaterial color="#666" />
            </lineSegments>
        </group>
    );
}
