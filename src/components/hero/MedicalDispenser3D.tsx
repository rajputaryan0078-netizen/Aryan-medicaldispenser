import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MedicalDispenserProps {
    position?: [number, number, number];
    isHovered?: boolean;
}

// -------------------------------------------------------------
// Component for a 3D Capsule Pill (Procedural box + spheres)
// -------------------------------------------------------------
interface CapsuleProps {
    position: [number, number, number];
    rotation: [number, number, number];
    color1: string;
    color2: string;
}

const Capsule: React.FC<CapsuleProps> = ({ position, rotation, color1, color2 }) => {
    return (
        <group position={position} rotation={rotation}>
            {/* First half */}
            <mesh position={[0, 0.012, 0]}>
                <cylinderGeometry args={[0.009, 0.009, 0.024, 8]} />
                <meshPhysicalMaterial color={color1} roughness={0.1} metalness={0.1} />
            </mesh>
            <mesh position={[0, 0.024, 0]}>
                <sphereGeometry args={[0.009, 8, 8]} />
                <meshPhysicalMaterial color={color1} roughness={0.1} metalness={0.1} />
            </mesh>
            {/* Second half */}
            <mesh position={[0, -0.012, 0]}>
                <cylinderGeometry args={[0.009, 0.009, 0.024, 8]} />
                <meshPhysicalMaterial color={color2} roughness={0.1} metalness={0.1} />
            </mesh>
            <mesh position={[0, -0.024, 0]}>
                <sphereGeometry args={[0.009, 8, 8]} />
                <meshPhysicalMaterial color={color2} roughness={0.1} metalness={0.1} />
            </mesh>
        </group>
    );
};

// -------------------------------------------------------------
// Component for an individual transparent compartment showing pills
// -------------------------------------------------------------
interface CompartmentProps {
    position: [number, number, number];
    status: 'nominal' | 'warning' | 'critical';
    dispenseZ?: number;
    pillColors: [string, string];
    label: string;
    fontUrl?: string;
}

const Compartment: React.FC<CompartmentProps> = ({
    position,
    status,
    dispenseZ = 0,
    pillColors,
    label,
    fontUrl
}) => {
    const x = position[0];
    const y = position[1];
    const z = position[2] + dispenseZ;

    // Map status to LED color
    const ledColor = status === 'nominal' ? '#00C853' : status === 'warning' ? '#F5A623' : '#FF3D00';

    return (
        <group position={[x, y, z]}>
            {/* Transparent Window Box */}
            <RoundedBox args={[0.18, 0.16, 0.16]} radius={0.01} smoothness={3}>
                <meshPhysicalMaterial 
                    color="#ffffff" 
                    transparent 
                    opacity={0.18} 
                    roughness={0.1}
                    metalness={0.1}
                    transmission={0.9}
                    thickness={0.05}
                />
            </RoundedBox>

            {/* Silver trim border */}
            <RoundedBox args={[0.182, 0.162, 0.162]} radius={0.01} smoothness={3}>
                <meshBasicMaterial color="#a8b2c0" transparent opacity={0.3} wireframe />
            </RoundedBox>

            {/* Status LED Light under slot */}
            <mesh position={[0, -0.09, 0.08]}>
                <sphereGeometry args={[0.01, 8, 8]} />
                <meshBasicMaterial color={ledColor} />
            </mesh>

            {/* 3D Capsule Pills inside (only if not empty/critical) */}
            {status !== 'critical' && (
                <group position={[0, -0.04, 0]}>
                    <Capsule 
                        position={[-0.03, 0, -0.02]} 
                        rotation={[Math.PI / 2, 0.3, 0.5]} 
                        color1={pillColors[0]} 
                        color2={pillColors[1]} 
                    />
                    <Capsule 
                        position={[0.02, 0.01, 0.02]} 
                        rotation={[0.2, 0.8, -0.4]} 
                        color1={pillColors[0]} 
                        color2={pillColors[1]} 
                    />
                    {status === 'nominal' && (
                        <Capsule 
                            position={[0.0, -0.01, -0.01]} 
                            rotation={[-0.5, 0.2, 1.1]} 
                            color1={pillColors[0]} 
                            color2={pillColors[1]} 
                        />
                    )}
                </group>
            )}

            {/* Small slot address label */}
            <Text
                position={[0, -0.12, 0.092]}
                fontSize={0.024}
                color="#8892a4"
                anchorX="center"
                anchorY="top"
                font={fontUrl}
            >
                {label}
            </Text>
        </group>
    );
};

// -------------------------------------------------------------
// Component for ESP32 edge microcontroller exposed on side panel
// -------------------------------------------------------------
const ESP32Board: React.FC = () => {
    const ledRef1 = useRef<THREE.Mesh>(null);
    const ledRef2 = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (ledRef1.current) {
            const m = ledRef1.current.material as THREE.MeshBasicMaterial;
            m.opacity = 0.4 + Math.sin(t * 8) * 0.4; // pulse fast (WiFi indicator)
        }
        if (ledRef2.current) {
            const m = ledRef2.current.material as THREE.MeshBasicMaterial;
            m.opacity = 0.5 + Math.sin(t * 3) * 0.3; // pulse slow (heartbeat indicator)
        }
    });

    return (
        <group position={[0.49, -0.05, 0.301]}>
            {/* Green PCB board */}
            <mesh>
                <planeGeometry args={[0.3, 0.24]} />
                <meshPhysicalMaterial color="#0b5c2c" roughness={0.3} metalness={0.1} />
            </mesh>
            {/* White silk-screen boundary */}
            <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[0.28, 0.22]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.2} wireframe />
            </mesh>
            {/* ESP32 Main MCU SoC Chip (metallic black) */}
            <mesh position={[0, 0.02, 0.008]}>
                <boxGeometry args={[0.1, 0.08, 0.01]} />
                <meshPhysicalMaterial color="#1a1d23" roughness={0.2} metalness={0.6} />
            </mesh>
            {/* Metal shield/Antenna trace */}
            <mesh position={[0.07, 0.06, 0.008]}>
                <boxGeometry args={[0.04, 0.06, 0.01]} />
                <meshPhysicalMaterial color="#d1d5db" roughness={0.1} metalness={0.9} />
            </mesh>
            {/* Exposed gold traces */}
            {[-0.04, -0.01, 0.02].map((xOffset, i) => (
                <mesh key={i} position={[xOffset, -0.06, 0.002]}>
                    <planeGeometry args={[0.006, 0.06]} />
                    <meshBasicMaterial color="#eab308" />
                </mesh>
            ))}
            {/* Status LEDs */}
            {/* WiFi Activity LED (Blue) */}
            <mesh ref={ledRef1} position={[-0.1, 0.08, 0.009]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshBasicMaterial color="#185FA5" transparent />
            </mesh>
            {/* Power LED (Green) */}
            <mesh ref={ledRef2} position={[-0.1, 0.05, 0.009]}>
                <sphereGeometry args={[0.008, 8, 8]} />
                <meshBasicMaterial color="#00C853" transparent />
            </mesh>
            {/* Pins Headers (bottom/top) */}
            {Array.from({ length: 6 }).map((_, i) => (
                <group key={i} position={[-0.11 + i * 0.044, -0.1, 0.008]}>
                    <mesh>
                        <cylinderGeometry args={[0.003, 0.003, 0.015, 6]} />
                        <meshPhysicalMaterial color="#fbbf24" metalness={0.9} />
                    </mesh>
                </group>
            ))}
            {/* Title Tag */}
            <Text
                position={[0, -0.08, 0.01]}
                fontSize={0.024}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
            >
                ESP32 Edge MCU
            </Text>
        </group>
    );
};

// -------------------------------------------------------------
// Component for floating, bobbing elements next to right panel
// -------------------------------------------------------------
const FloatingElements: React.FC = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        if (groupRef.current) {
            // Bob up and down with sine wave
            groupRef.current.position.y = Math.sin(t * 1.5) * 0.08;
            // Rotate the group elements slightly
            groupRef.current.rotation.y = t * 0.4;
        }
    });

    return (
        <group ref={groupRef}>
            {/* Floating Blue Medicine Bottle */}
            <group position={[0.95, 0.25, 0.2]} rotation={[0.2, 0.5, 0.1]}>
                <mesh>
                    <cylinderGeometry args={[0.05, 0.05, 0.15, 12]} />
                    <meshPhysicalMaterial color="#185FA5" roughness={0.1} metalness={0.2} transparent opacity={0.9} />
                </mesh>
                <mesh position={[0, 0.08, 0]}>
                    <cylinderGeometry args={[0.052, 0.052, 0.025, 12]} />
                    <meshPhysicalMaterial color="#ffffff" roughness={0.1} />
                </mesh>
            </group>

            {/* Floating Thermometer / Syringe shape */}
            <group position={[0.9, -0.2, 0.2]} rotation={[0.4, -0.2, -0.5]}>
                {/* Syringe barrel */}
                <mesh>
                    <cylinderGeometry args={[0.015, 0.015, 0.16, 10]} />
                    <meshPhysicalMaterial color="#7EC8E3" roughness={0.3} transparent opacity={0.7} />
                </mesh>
                {/* Plunger */}
                <mesh position={[0, -0.1, 0]}>
                    <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
                    <meshPhysicalMaterial color="#ffffff" roughness={0.2} />
                </mesh>
                {/* Plunger top */}
                <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.025, 0.025, 0.008, 8]} />
                    <meshPhysicalMaterial color="#ffffff" roughness={0.2} />
                </mesh>
                {/* Needle */}
                <mesh position={[0, 0.1, 0]}>
                    <cylinderGeometry args={[0.002, 0.002, 0.04, 6]} />
                    <meshPhysicalMaterial color="#cccccc" metalness={1} roughness={0.1} />
                </mesh>
            </group>
        </group>
    );
};

// -------------------------------------------------------------
// Main Vending Machine Component (NexDose upgrade)
// -------------------------------------------------------------
const MedicalDispenser3D: React.FC<MedicalDispenserProps> = ({
    position = [0, 0, 0],
    isHovered = false,
}) => {
    const [fontUrl, setFontUrl] = useState<string | undefined>('/fonts/inter-regular.woff');

    useEffect(() => {
        fetch('/fonts/inter-regular.woff', { method: 'HEAD' })
            .then((res) => {
                const contentType = res.headers.get('content-type') || '';
                if (!res.ok || contentType.includes('text/html')) {
                    setFontUrl('https://cdn.jsdelivr.net/npm/@xz/fonts@1/serve/src/inter/Inter-Regular.woff');
                }
            })
            .catch(() => {
                setFontUrl(undefined);
            });
    }, []);

    // Dispensing States
    const [dispenseZ, setDispenseZ] = useState(0);
    const [isFlashing, setIsFlashing] = useState(false);
    const [floatTextOpacity, setFloatTextOpacity] = useState(0);
    const [floatTextY, setFloatTextY] = useState(0);

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();
        const cycle = time % 4; // 4 second dispensing loop

        if (cycle < 0.5) {
            // Slide forward by 0.3 over 0.5s
            const p = cycle / 0.5;
            setDispenseZ(0.3 * p);
            setIsFlashing(true);
            setFloatTextOpacity(0);
        } else if (cycle >= 0.5 && cycle < 0.8) {
            // Hold at 0.3s
            setDispenseZ(0.3);
            setIsFlashing(true);
            // Floating text starts rising
            const textTime = cycle - 0.5; // 0.0s to 0.3s
            setFloatTextY(0.4 + textTime * 0.6); // starts at shelf height (0.4)
            setFloatTextOpacity(1);
        } else if (cycle >= 0.8 && cycle < 1.3) {
            // Return to 0.0 over 0.5s (0.8s to 1.3s)
            const p = (1.3 - cycle) / 0.5;
            setDispenseZ(0.3 * p);
            setIsFlashing(true);
            // Floating text continues rising and begins to fade
            const textTime = cycle - 0.5; // 0.3s to 0.8s
            setFloatTextY(0.4 + textTime * 0.6);
            setFloatTextOpacity(Math.max(0, 1 - (textTime - 0.3) / 0.7));
        } else if (cycle >= 1.3 && cycle < 1.5) {
            // Finished dispensing, reset item
            setDispenseZ(0);
            setIsFlashing(false);
            // Floating text fades completely
            const textTime = cycle - 0.5; // 0.8s to 1.0s
            setFloatTextY(0.4 + textTime * 0.6);
            setFloatTextOpacity(Math.max(0, 1 - (textTime - 0.3) / 0.7));
        } else {
            // Dormant phase
            setDispenseZ(0);
            setIsFlashing(false);
            setFloatTextOpacity(0);
        }
    });

    const shelfHeights = [0.9, 0.65, 0.4, 0.15, -0.1, -0.35];

    // Item layouts for the 6 shelves
    const shelfItemsConfig = useMemo(() => [
        // Shelf 1 (y = 0.9)
        [
            { status: 'nominal', pillColors: ['#dd6b20', '#ffffff'], label: 'SLOT 11' },
            { status: 'nominal', pillColors: ['#319795', '#ffffff'], label: 'SLOT 12' },
            { status: 'nominal', pillColors: ['#3B6D11', '#ffffff'], label: 'SLOT 13' },
            { status: 'nominal', pillColors: ['#185FA5', '#ffffff'], label: 'SLOT 14' }
        ],
        // Shelf 2 (y = 0.65)
        [
            { status: 'nominal', pillColors: ['#e53e3e', '#ffffff'], label: 'SLOT 21' },
            { status: 'nominal', pillColors: ['#185FA5', '#ffffff'], label: 'SLOT 22' },
            { status: 'warning', pillColors: ['#e2e8f0', '#F5A623'], label: 'SLOT 23' },
            { status: 'nominal', pillColors: ['#8b5cf6', '#ffffff'], label: 'SLOT 24' }
        ],
        // Shelf 3 (y = 0.4) - Row 3 contains the animated middle item at slot 2 (index 1)
        [
            { status: 'nominal', pillColors: ['#185FA5', '#ffffff'], label: 'SLOT 31' },
            { status: 'nominal', pillColors: ['#3B6D11', '#ffffff'], label: 'SLOT 32' }, // Slot 2 - will animate
            { status: 'nominal', pillColors: ['#185FA5', '#ffffff'], label: 'SLOT 33' },
            { status: 'nominal', pillColors: ['#f59e0b', '#ffffff'], label: 'SLOT 34' }
        ],
        // Shelf 4 (y = 0.15)
        [
            { status: 'warning', pillColors: ['#ec4899', '#ffffff'], label: 'SLOT 41' },
            { status: 'nominal', pillColors: ['#185FA5', '#ffffff'], label: 'SLOT 42' },
            { status: 'critical', pillColors: ['#10b981', '#ffffff'], label: 'SLOT 43' },
            { status: 'nominal', pillColors: ['#6b7280', '#ffffff'], label: 'SLOT 44' }
        ],
        // Shelf 5 (y = -0.1)
        [
            { status: 'nominal', pillColors: ['#f43f5e', '#ffffff'], label: 'SLOT 51' },
            { status: 'nominal', pillColors: ['#319795', '#ffffff'], label: 'SLOT 52' },
            { status: 'nominal', pillColors: ['#06b6d4', '#ffffff'], label: 'SLOT 53' },
            { status: 'nominal', pillColors: ['#ffffff', '#185FA5'], label: 'SLOT 54' }
        ],
        // Shelf 6 (y = -0.35)
        [
            { status: 'nominal', pillColors: ['#f59e0b', '#ffffff'], label: 'SLOT 61' },
            { status: 'nominal', pillColors: ['#84cc16', '#ffffff'], label: 'SLOT 62' },
            { status: 'warning', pillColors: ['#185FA5', '#e2e8f0'], label: 'SLOT 63' },
            { status: 'critical', pillColors: ['#a855f7', '#ffffff'], label: 'SLOT 64' }
        ]
    ], []);

    const columnXCoords = [-0.60, -0.36, -0.12, 0.12];

    return (
        <group position={position}>
            {/* Ground Shadow */}
            <mesh position={[0, -1.32, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.8, 0.9]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.2} />
            </mesh>

            {/* Vending Machine Cabinet Body: Light sky blue (#7EC8E3) */}
            <RoundedBox args={[1.4, 2.52, 0.6]} radius={0.03} smoothness={5}>
                <meshPhysicalMaterial 
                    color="#7EC8E3" 
                    roughness={0.15} 
                    metalness={0.15} 
                    envMapIntensity={1.2}
                />
            </RoundedBox>

            {/* Border frame around unit: Thin white/silver outline */}
            <mesh position={[0, 1.25, 0.301]}>
                <boxGeometry args={[1.38, 0.02, 0.01]} />
                <meshPhysicalMaterial color="#e2e5ea" metalness={0.8} roughness={0.1} />
            </mesh>
            <mesh position={[0, -1.25, 0.301]}>
                <boxGeometry args={[1.38, 0.02, 0.01]} />
                <meshPhysicalMaterial color="#e2e5ea" metalness={0.8} roughness={0.1} />
            </mesh>
            <mesh position={[-0.69, 0, 0.301]}>
                <boxGeometry args={[0.02, 2.52, 0.01]} />
                <meshPhysicalMaterial color="#e2e5ea" metalness={0.8} roughness={0.1} />
            </mesh>
            <mesh position={[0.69, 0, 0.301]}>
                <boxGeometry args={[0.02, 2.52, 0.01]} />
                <meshPhysicalMaterial color="#e2e5ea" metalness={0.8} roughness={0.1} />
            </mesh>

            {/* 4 Chrome Feet at bottom corners */}
            {[
                [-0.6, -1.29, 0.23],
                [0.6, -1.29, 0.23],
                [-0.6, -1.29, -0.23],
                [0.6, -1.29, -0.23]
            ].map((pos, i) => (
                <mesh key={i} position={pos as [number, number, number]}>
                    <cylinderGeometry args={[0.035, 0.035, 0.06, 12]} />
                    <meshPhysicalMaterial color="#c0c8d8" metalness={1.0} roughness={0.05} />
                </mesh>
            ))}

            {/* FRONT GLASS DISPLAY AREA (Left 70% of machine width: width = 0.98, center = -0.21) */}
            {/* Shelves & Shelf Labels */}
            {shelfHeights.map((sh, idx) => (
                <group key={idx}>
                    {/* Metal Shelf */}
                    <mesh position={[-0.21, sh, 0.08]}>
                        <boxGeometry args={[0.94, 0.015, 0.4]} />
                        <meshPhysicalMaterial color="#8a9ba8" roughness={0.3} metalness={0.6} />
                    </mesh>

                    {/* Shelf edge status strip (green flash on row 3 (idx = 2)) */}
                    <mesh position={[-0.21, sh, 0.281]}>
                        <planeGeometry args={[0.94, 0.006]} />
                        <meshBasicMaterial 
                            color={(idx === 2 && isFlashing) ? '#00C853' : '#a2a8b0'} 
                        />
                    </mesh>
                </group>
            ))}

            {/* Compartment items showing 3D pills, transparent window boxes, and status LEDs */}
            {shelfHeights.map((sh, shelfIdx) => (
                <group key={`compartments-${shelfIdx}`}>
                    {columnXCoords.map((cx, colIdx) => {
                        const config = shelfItemsConfig[shelfIdx]?.[colIdx];
                        if (!config) return null;

                        // Animate shelf row 3, slot 2 (shelfIdx = 2, colIdx = 1)
                        const offsetZ = (shelfIdx === 2 && colIdx === 1) ? dispenseZ : 0;

                        return (
                            <Compartment 
                                key={`comp-${colIdx}`}
                                position={[cx, sh + 0.07, 0.1]}
                                status={config.status as any}
                                dispenseZ={offsetZ}
                                pillColors={config.pillColors as [string, string]}
                                label={config.label}
                                fontUrl={fontUrl}
                            />
                        );
                    })}
                </group>
            ))}

            {/* Glass panel sheet with blue tint and 15% opacity white overlay reflection */}
            <group position={[-0.21, 0.275, 0.282]}>
                {/* Slight blue glass sheet */}
                <mesh>
                    <planeGeometry args={[0.96, 1.35]} />
                    <meshPhysicalMaterial 
                        color="#d5ebf5" 
                        transparent 
                        opacity={0.2} 
                        roughness={0.15}
                        metalness={0.1}
                    />
                </mesh>
                {/* Reflection white overlay */}
                <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[0.96, 1.35]} />
                    <meshBasicMaterial 
                        color="#ffffff" 
                        transparent 
                        opacity={0.15} 
                    />
                </mesh>
            </group>

            {/* RIGHT SIDE PANEL OF MACHINE (30% width strip centered at x = 0.49, width = 0.42) */}
            {/* Top Right: Orange/Amber square QR Panel */}
            <group position={[0.49, 0.85, 0.301]}>
                {/* Orange Background */}
                <mesh>
                    <planeGeometry args={[0.22, 0.22]} />
                    <meshBasicMaterial color="#F5A623" />
                </mesh>
                {/* QR Code White Card */}
                <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[0.18, 0.18]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
                {/* Procedural QR Code blocks (grid) */}
                <group position={[-0.06, 0.06, 0.002]}>
                    {[[0,0], [0,1], [0,4], [1,0], [1,3], [2,2], [3,1], [3,4], [4,0], [4,3], [4,4]].map(([r, c], i) => (
                        <mesh key={i} position={[c * 0.03, -r * 0.03, 0]}>
                            <planeGeometry args={[0.024, 0.024]} />
                            <meshBasicMaterial color="#000000" />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Touchscreen display panel */}
            <group position={[0.49, 0.52, 0.301]}>
                {/* Bezel */}
                <mesh>
                    <planeGeometry args={[0.3, 0.34]} />
                    <meshBasicMaterial color="#333333" />
                </mesh>
                {/* Dark Gray Screen */}
                <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[0.26, 0.3]} />
                    <meshBasicMaterial color="#1a1d23" />
                </mesh>
                {/* Blue pill bottle icon inside screen */}
                <group position={[-0.05, 0.06, 0.002]}>
                    <mesh>
                        <cylinderGeometry args={[0.024, 0.024, 0.06, 8]} />
                        <meshBasicMaterial color="#185FA5" />
                    </mesh>
                    <mesh position={[0, 0.035, 0]}>
                        <cylinderGeometry args={[0.026, 0.026, 0.012, 8]} />
                        <meshBasicMaterial color="#ffffff" />
                    </mesh>
                </group>
                {/* Text lines simulator */}
                <group position={[0.03, 0.06, 0.002]}>
                    {[-0.01, -0.03, -0.05, -0.07, -0.09].map((yOffset, i) => (
                        <mesh key={i} position={[0, yOffset, 0]}>
                            <planeGeometry args={[0.13, 0.006]} />
                            <meshBasicMaterial color="#6b7280" />
                        </mesh>
                    ))}
                </group>
            </group>

            {/* Exposed ESP32 Board representation under display */}
            <ESP32Board />

            {/* Bottom Coin Return/Restock slot */}
            <group position={[0.49, -0.32, 0.301]}>
                <mesh>
                    <planeGeometry args={[0.14, 0.1]} />
                    <meshBasicMaterial color="#333333" />
                </mesh>
                <mesh position={[0, 0, 0.001]}>
                    <planeGeometry args={[0.1, 0.07]} />
                    <meshBasicMaterial color="#1a1d23" />
                </mesh>
                <Text
                    position={[0, 0.08, 0.002]}
                    fontSize={0.03}
                    color="#6b7280"
                    anchorX="center"
                    anchorY="middle"
                    font={fontUrl}
                >
                    Coin Return
                </Text>
            </group>

            {/* Floating Elements (Bobbing syringe and blue bottle outside the machine right border) */}
            <FloatingElements />

            {/* BOTTOM SECTION OF THE MACHINE */}
            {/* PUSH Plate: black, white bold text */}
            <group position={[0.12, -0.92, 0.301]}>
                <mesh>
                    <planeGeometry args={[0.88, 0.22]} />
                    <meshBasicMaterial color="#1a1d23" />
                </mesh>
                <Text
                    position={[0, 0, 0.001]}
                    fontSize={0.08}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    font={fontUrl}
                    fontWeight="bold"
                >
                    PUSH
                </Text>
            </group>

            {/* Large white medical cross (+) on the blue body next to PUSH */}
            <group position={[-0.45, -0.92, 0.301]}>
                {/* Vertical bar */}
                <mesh>
                    <planeGeometry args={[0.045, 0.16]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
                {/* Horizontal bar */}
                <mesh>
                    <planeGeometry args={[0.16, 0.045]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            </group>

            {/* Dispensing Slot cutout tray under push plate */}
            <group position={[0, -1.15, 0.28]}>
                {/* Hollow chamber */}
                <mesh>
                    <boxGeometry args={[0.4, 0.12, 0.16]} />
                    <meshPhysicalMaterial color="#080b11" roughness={0.8} />
                </mesh>
                {/* Dispensed capsule inside tray during active dispensing */}
                {isFlashing && (
                    <Capsule 
                        position={[0, -0.03, 0.02]} 
                        rotation={[0, 0.5, Math.PI / 2]} 
                        color1="#3B6D11" 
                        color2="#ffffff" 
                    />
                )}
            </group>

            {/* Dot pattern decoration on lower blue body */}
            <group position={[0, -0.63, 0.301]}>
                {[-0.45, -0.22, 0, 0.22, 0.45].map((dx) => (
                    <group key={dx} position={[dx, 0, 0]}>
                        <mesh position={[0, 0.04, 0]}>
                            <circleGeometry args={[0.012, 8]} />
                            <meshBasicMaterial color="#5caecb" />
                        </mesh>
                        <mesh position={[0, -0.04, 0]}>
                            <circleGeometry args={[0.012, 8]} />
                            <meshBasicMaterial color="#5caecb" />
                        </mesh>
                    </group>
                ))}
            </group>

            {/* Floating "+1 dispensed" text that rises and fades out */}
            {floatTextOpacity > 0 && (
                <Text
                    position={[-0.36, floatTextY, 0.32]}
                    fontSize={0.065}
                    anchorX="center"
                    anchorY="middle"
                    font={fontUrl}
                    fontWeight="bold"
                >
                    +1 dispensed
                    <meshBasicMaterial color="#00C853" opacity={floatTextOpacity} transparent />
                </Text>
            )}

            {/* Gentle highlight glow on machine border when hovered */}
            {isHovered && (
                <RoundedBox args={[1.42, 2.54, 0.62]} radius={0.032} smoothness={5}>
                    <meshBasicMaterial 
                        color="#7EC8E3" 
                        transparent 
                        opacity={0.35} 
                        wireframe 
                    />
                </RoundedBox>
            )}
        </group>
    );
};

export default MedicalDispenser3D;
