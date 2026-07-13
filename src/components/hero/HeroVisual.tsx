import React, { useRef, useState, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerformanceMonitor } from '@react-three/drei';
import { motion } from 'framer-motion';
import Scene from './Scene';

interface HeroVisualProps {
  className?: string;
}

const HeroVisual: React.FC<HeroVisualProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [dpr, setDpr] = useState(1.5);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMouseX(x);
      setMouseY(y);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setMouseX(0);
    setMouseY(0);
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseLeave();
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    >
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1.1,
        }}
        dpr={dpr}
        style={{
          background: '#f0f4f8',
          backgroundImage: 'radial-gradient(#e2e5ea 1.5px, transparent 1.5px)',
          backgroundSize: '20px 20px',
          borderRadius: '16px',
          border: '1px solid #e2e5ea',
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(Math.min(window.devicePixelRatio, 2))}
        />
        <Suspense fallback={null}>
          <Scene mouseX={mouseX} mouseY={mouseY} isHovered={isHovered} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>

      {/* Live indicator */}
      <motion.div
        className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 
                   bg-white/80 backdrop-blur-md border border-[#e2e5ea] rounded-full 
                   px-3 py-1.5 pointer-events-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#639922]" />
        </span>
        <span className="text-xs text-[#6b7280] font-mono tracking-wider">
          Live preview
        </span>
      </motion.div>
    </motion.div>
  );
};

export default HeroVisual;
