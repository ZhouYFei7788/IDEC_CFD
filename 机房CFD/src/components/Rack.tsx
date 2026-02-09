import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DIMS, COLORS } from '../constants';
import { getStateColor } from '../utils';
import type { RackData } from '../types';

interface RackProps {
    data: RackData;
    position: [number, number, number];
}

export function Rack({ data, position }: RackProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const color = getStateColor(data.state);

    // 简单的呼吸动画
    useFrame((state) => {
        if (meshRef.current && data.state !== 'NORMAL') {
            const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.3 + 0.7;
            meshRef.current.material.opacity = pulse;
        }
    });

    return (
        <group position={position}>
            {/* 机柜主体 */}
            <mesh ref={meshRef} position={[0, DIMS.RACK_HEIGHT / 2, 0]}>
                <boxGeometry args={[DIMS.RACK_WIDTH, DIMS.RACK_HEIGHT, DIMS.RACK_DEPTH]} />
                <meshStandardMaterial
                    color={data.state === 'ALARM' ? COLORS.RACK_ALARM : COLORS.RACK_BODY}
                    transparent={data.state !== 'NORMAL'}
                    opacity={1}
                />
            </mesh>

            {/* 状态指示灯 */}
            <mesh position={[0, DIMS.RACK_HEIGHT + 0.1, DIMS.RACK_DEPTH / 2]}>
                <sphereGeometry args={[0.05, 16, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>

            {/* 机柜标签 */}
            <mesh position={[0, DIMS.RACK_HEIGHT / 2, DIMS.RACK_DEPTH / 2 + 0.01]}>
                <planeGeometry args={[DIMS.RACK_WIDTH * 0.8, 0.2]} />
                <meshBasicMaterial color="#000" />
            </mesh>
        </group>
    );
}
