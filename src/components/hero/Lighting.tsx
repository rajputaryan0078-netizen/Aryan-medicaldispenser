import React from 'react';

const Lighting: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#0088ff" />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff88" />
      <spotLight
        position={[0, 8, 2]}
        angle={0.6}
        penumbra={1}
        intensity={2}
        color="#ffffff"
        castShadow
      />
    </>
  );
};

export default Lighting;
