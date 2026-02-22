import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function Bubble() {
  const meshRef = useRef();

  // Custom iridescence-like colors
  const color = useMemo(() => new THREE.Color("#9F7AEA"), []); // Purple
  const color2 = useMemo(() => new THREE.Color("#4299E1"), []); // Blue
  const color3 = useMemo(() => new THREE.Color("#E2E8F0"), []); // Whiteish

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    // Base slow rotation
    let targetRotationX = t * 0.02;
    let targetRotationY = t * 0.05;

    // Base subtle floating
    let targetPositionY = Math.sin(t * 0.5) * 0.05;
    let targetPositionX = 0;

    // React to mouse
    // state.pointer is normalized between -1 and 1
    const mouseX = state.pointer.x;
    const mouseY = state.pointer.y;

    targetRotationX += mouseY * 0.5; // Look up down
    targetRotationY += mouseX * 0.5; // Look left right

    targetPositionX += mouseX * 0.2; // Move slightly towards mouse
    targetPositionY += mouseY * 0.2; // Move slightly towards mouse

    // Smoothly interpolate current transforms to targets
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotationX, 0.1);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, 0.1);
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetPositionX, 0.1);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetPositionY, 0.1);

    // Abstract slow color pulse
    const lerpFactor = (Math.sin(t * 0.5) + 1) / 2;
    meshRef.current.material.color.lerpColors(color, color2, lerpFactor);
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={0.8}>
      <MeshDistortMaterial
        color="#ffffff"
        envMapIntensity={1}
        clearcoat={0.8}
        clearcoatRoughness={0}
        metalness={0.4}
        roughness={0.1}
        transmission={0.9} // Glass-like
        thickness={0.5}
        distort={0.15} // Very subtle distortion
        speed={0.5} // Slow morphing
      />
    </Sphere>
  );
}
