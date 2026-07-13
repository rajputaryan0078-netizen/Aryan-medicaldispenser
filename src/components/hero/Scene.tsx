
import React, { useRef, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import MedicalDispenser3D from './MedicalDispenser3D';
import FloatingNode from './FloatingNode';
import FloatingLabel from './FloatingLabel';
import { FloatingNodeData } from '../../types/dispenser';

interface SceneProps {
    mouseX: number;
    mouseY: number;
    isHovered: boolean;
}

const floatingNodes: FloatingNodeData[] = [
    {
        id: 'accuracy',
        label: 'Dispense Accuracy',
        value: '99.9%',
        status: 'nominal',
        position: [2.1, 0.9, 0],
    },
    {
        id: 'latency',
        label: 'Sync Latency',
        value: '1.2s',
        unit: 'avg',
        status: 'nominal',
        position: [2.1, 0.2, 0],
    },
    {
        id: 'stock',
        label: 'Stock Level',
        value: '87%',
        status: 'nominal',
        position: [-2.2, 0.6, 0],
    },
    {
        id: 'temp',
        label: 'Device Temp',
        value: '38 C',
        status: 'nominal',
        position: [-2.2, -0.2, 0],
    },
    {
        id: 'wifi',
        label: 'WiFi Signal',
        value: '-42 dBm',
        status: 'nominal',
        position: [2.1, -0.5, 0],
    },
];

const Scene: React.FC<SceneProps> = ({ mouseX, mouseY, isHovered }) => {
    const groupRef = useRef<THREE.Group>(null);
    const { camera } = useThree();
    
    const rotationTimeRef = useRef(0);
    const lastTimeRef = useRef(0);

    useFrame((state) => {
        const currentRealTime = state.clock.getElapsedTime();
        if (lastTimeRef.current === 0) {
            lastTimeRef.current = currentRealTime;
        }
        const delta = currentRealTime - lastTimeRef.current;
        lastTimeRef.current = currentRealTime;

        // Rocking rotation pauses when hovered
        if (!isHovered) {
            rotationTimeRef.current += delta;
        }

        const t = rotationTimeRef.current;
        // Oscillate between -15deg and +15deg on Y axis, period of 6s
        // 15 degrees = 0.2618 radians
        const targetRotationY = Math.sin(t * (Math.PI * 2 / 6)) * 0.2618;

        // Smooth camera parallax with mouse
        const targetX = mouseX * 0.6;
        const targetY = mouseY * 0.3;
        camera.position.x += (targetX - camera.position.x) * 0.04;
        camera.position.y += (targetY - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);

        if (groupRef.current) {
            groupRef.current.rotation.y = targetRotationY;
        }
    });

    return (
        <>
            {/* Ambient light: white, intensity 0.6 */}
            <ambientLight color="#ffffff" intensity={0.6} />
            
            {/* Directional light: white, position (5, 10, 5), intensity 0.8 */}
            <directionalLight
                position={[5, 10, 5]}
                intensity={0.8}
                color="#ffffff"
            />
            
            {/* Point light in clinical blue (#185FA5) from the left side, intensity 0.3 */}
            <pointLight
                position={[-3, 0, 2]}
                intensity={0.3}
                color="#185FA5"
            />

            {/* Background stars */}
            <Stars
                radius={30}
                depth={20}
                count={800}
                factor={1.2}
                saturation={0}
                fade
                speed={0.3}
            />

            {/* Environment for reflections */}
            <Suspense fallback={null}>
                <Environment resolution={256}>
                    <ambientLight intensity={0.4} />
                    <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[12, 12]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </mesh>
                    <mesh position={[-6, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                        <planeGeometry args={[12, 12]} />
                        <meshBasicMaterial color="#185FA5" toneMapped={false} />
                    </mesh>
                    <mesh position={[6, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
                        <planeGeometry args={[12, 12]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </mesh>
                </Environment>
            </Suspense>

            <group ref={groupRef}>
                {/* Main dispenser/vending machine */}
                <MedicalDispenser3D position={[0, -0.1, 0]} isHovered={isHovered} />

                {/* Floating data nodes */}
                {floatingNodes.map((node) => (
                    <FloatingNode key={node.id} data={node} />
                ))}

                {/* Floating labels with connectors */}
                <FloatingLabel
                    text="Firebase connected"
                    subtext="Real-time sync active"
                    position={[-1.8, 1.4, 0.2]}
                    lineEnd={[-0.45, 0.8, 0.3]}
                    color="#185FA5"
                    phaseOffset={0}
                />

                <FloatingLabel
                    text="ESP32 online"
                    subtext="Firmware v2.4.1"
                    position={[1.8, 1.4, 0.2]}
                    lineEnd={[0.45, 0.5, 0.3]}
                    color="#185FA5"
                    phaseOffset={1.2}
                />

                <FloatingLabel
                    text="HIPAA compliant"
                    subtext="256-bit encryption"
                    position={[0, -1.7, 0.2]}
                    lineEnd={[0, -1.2, 0.3]}
                    color="#3B6D11"
                    phaseOffset={2.1}
                />
            </group>
        </>
    );
};

export default Scene;
