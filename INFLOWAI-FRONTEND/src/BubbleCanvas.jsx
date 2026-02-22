import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Float, Sparkles } from '@react-three/drei';
import Bubble from './Bubble';

export default function BubbleCanvas() {
  return (
    <div className="w-[300px] h-[300px] absolute inset-0 -top-8 -left-8 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        {/* Environmental lighting for reflections */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#9F7AEA" />
        <directionalLight position={[-10, -10, -5]} intensity={1} color="#4299E1" />
        <Environment preset="city" />

        {/* Floating Bubble */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <Bubble />
        </Float>

        {/* Small sparkling particles around it */}
        <Sparkles count={40} scale={4} size={2} speed={0.4} opacity={0.5} color="#E2E8F0" />
      </Canvas>
    </div>
  );
}
