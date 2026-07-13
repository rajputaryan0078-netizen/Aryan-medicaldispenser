import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { FloatingNodeData } from '../../types/dispenser';

interface FloatingNodeProps {
  data: FloatingNodeData;
  time?: number;
}

const statusColors: Record<string, string> = {
  nominal: '#00ff88',
  warning: '#ffaa00',
  critical: '#ff4444',
};

const FloatingNode: React.FC<FloatingNodeProps> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [fontUrl, setFontUrl] = useState<string | undefined>('/fonts/inter-regular.woff');

  useEffect(() => {
    // Check if local font is accessible and not an HTML fallback page
    fetch('/fonts/inter-regular.woff', { method: 'HEAD' })
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || contentType.includes('text/html')) {
          console.warn('[FloatingNode] Local font missing/invalid. Trying CDN fallback.');
          setFontUrl('https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-Regular.woff');
        }
      })
      .catch(() => {
        console.warn('[FloatingNode] Local font fetch failed. Using default Roboto.');
        setFontUrl(undefined);
      });
  }, []);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      const offset = data.id.charCodeAt(0) * 0.5;
      groupRef.current.position.y =
        data.position[1] + Math.sin(t * 0.8 + offset) * 0.08;
      groupRef.current.rotation.y = Math.sin(t * 0.3 + offset) * 0.05;
    }
    if (glowRef.current) {
      const t = clock.getElapsedTime();
      const offset = data.id.charCodeAt(0) * 0.5;
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.15 + Math.sin(t * 2 + offset) * 0.08;
    }
  });

  const color = statusColors[data.status] || '#00ff88';

  return (
    <group
      ref={groupRef}
      position={data.position}
    >
      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>

      {/* Main panel */}
      <RoundedBox args={[0.9, 0.38, 0.06]} radius={0.05} smoothness={4}>
        <meshPhysicalMaterial
          color="#0a0f1a"
          metalness={0.3}
          roughness={0.1}
          transparent
          opacity={0.88}
          envMapIntensity={0.5}
        />
      </RoundedBox>

      {/* Border glow */}
      <RoundedBox args={[0.92, 0.4, 0.055]} radius={0.05} smoothness={4}>
        <meshBasicMaterial color={color} transparent opacity={0.25} wireframe />
      </RoundedBox>

      {/* Status dot */}
      <mesh position={[-0.35, 0.0, 0.04]}>
        <sphereGeometry args={[0.03, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Label text */}
      <Text
        position={[-0.08, 0.07, 0.05]}
        fontSize={0.065}
        color="#8892a4"
        anchorX="left"
        anchorY="middle"
        font={fontUrl}
      >
        {data.label}
      </Text>

      {/* Value text */}
      <Text
        position={[-0.08, -0.06, 0.05]}
        fontSize={0.09}
        color={color}
        anchorX="left"
        anchorY="middle"
        font={fontUrl}
      >
        {data.value}
        {data.unit ? ` ${data.unit}` : ''}
      </Text>
    </group>
  );
};

export default FloatingNode;

