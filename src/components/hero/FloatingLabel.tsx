import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingLabelProps {
    text: string;
    subtext?: string;
    position: [number, number, number];
    lineEnd: [number, number, number];
    color?: string;
    phaseOffset?: number;
}

const FloatingLabel: React.FC<FloatingLabelProps> = ({
    text,
    subtext,
    position,
    lineEnd,
    color = '#00ff88',
    phaseOffset = 0,
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const dotRef = useRef<THREE.Mesh>(null);
    const [fontUrl, setFontUrl] = useState<string | undefined>('/fonts/inter-regular.woff');

    useEffect(() => {
        // Check if /fonts/inter-regular.woff is valid and not returning Vite's index.html fallback
        fetch('/fonts/inter-regular.woff', { method: 'HEAD' })
            .then((res) => {
                const contentType = res.headers.get('content-type') || '';
                if (!res.ok || contentType.includes('text/html')) {
                    console.warn('[FloatingLabel] Local font missing or invalid content type. Trying CDN fallback.');
                    setFontUrl('https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-Regular.woff');
                }
            })
            .catch(() => {
                console.warn('[FloatingLabel] Local font fetch failed. Using default Roboto.');
                setFontUrl(undefined);
            });
    }, []);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (groupRef.current) {
            groupRef.current.position.y =
                position[1] + Math.sin(t * 0.6 + phaseOffset) * 0.06;
        }
        if (dotRef.current) {
            const mat = dotRef.current.material as THREE.MeshBasicMaterial;
            mat.opacity = 0.6 + Math.sin(t * 3 + phaseOffset) * 0.4;
        }
    });

    const linePoints: [number, number, number][] = [lineEnd, position];

    return (
        <group ref={groupRef}>
            {/* Connector line */}
            <Line
                points={linePoints}
                color={color}
                lineWidth={0.8}
                transparent
                opacity={0.35}
            />

            {/* End dot on device */}
            <mesh position={lineEnd} ref={dotRef}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
            </mesh>

            {/* Label container */}
            <group position={position}>
                {/* Background pill */}
                <mesh>
                    <planeGeometry args={[0.85, 0.28]} />
                    <meshBasicMaterial color="#050a14" transparent opacity={0.82} />
                </mesh>

                {/* Border line top */}
                <mesh position={[0, 0.14, 0.001]}>
                    <planeGeometry args={[0.85, 0.002]} />
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                </mesh>

                {/* Main label */}
                <Text
                    position={[0, 0.04, 0.01]}
                    fontSize={0.07}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                    font={fontUrl}
                >
                    {text}
                </Text>

                {/* Subtext */}
                {subtext && (
                    <Text
                        position={[0, -0.06, 0.01]}
                        fontSize={0.05}
                        color="#5a6478"
                        anchorX="center"
                        anchorY="middle"
                        font={fontUrl}
                    >
                        {subtext}
                    </Text>
                )}
            </group>
        </group>
    );
};

export default FloatingLabel;