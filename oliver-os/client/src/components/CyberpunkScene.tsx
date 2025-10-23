import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function CyberpunkScene() {
  const brainRef = useRef<THREE.Group>(null);
  const leftHemisphereRef = useRef<THREE.Mesh>(null);
  const rightHemisphereRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    if (brainRef.current) {
      // Complex brain rotation
      brainRef.current.rotation.y = time.current * 0.2;
      brainRef.current.rotation.x = Math.sin(time.current * 0.3) * 0.1;
      
      // Pulsing scale
      const scale = 1 + Math.sin(time.current * 3) * 0.08;
      brainRef.current.scale.setScalar(scale);
    }

    // Individual hemisphere animations
    if (leftHemisphereRef.current) {
      leftHemisphereRef.current.rotation.z = Math.sin(time.current * 1.5) * 0.2;
      leftHemisphereRef.current.position.x = -0.5 + Math.sin(time.current * 2) * 0.05;
    }
    
    if (rightHemisphereRef.current) {
      rightHemisphereRef.current.rotation.z = Math.cos(time.current * 1.5) * 0.2;
      rightHemisphereRef.current.position.x = 0.5 + Math.cos(time.current * 2) * 0.05;
    }
  });

  return (
    <group ref={brainRef} position={[0, 0, 0]}>
      {/* Left Hemisphere - Cyan with complex geometry */}
      <Sphere ref={leftHemisphereRef} args={[1.2, 128, 128]} position={[-0.8, 0, 0]}>
        <MeshDistortMaterial
          color="#00FFFF"
          transparent
          opacity={0.7}
          distort={0.4}
          speed={1.5}
          emissive="#00FFFF"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.3}
        />
      </Sphere>

      {/* Right Hemisphere - Magenta with complex geometry */}
      <Sphere ref={rightHemisphereRef} args={[1.2, 128, 128]} position={[0.8, 0, 0]}>
        <MeshDistortMaterial
          color="#FF00FF"
          transparent
          opacity={0.7}
          distort={0.4}
          speed={1.5}
          emissive="#FF00FF"
          emissiveIntensity={0.8}
          roughness={0.1}
          metalness={0.3}
        />
      </Sphere>

      {/* Central neural core */}
      <Sphere args={[0.4, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.9}
          emissive="#FFFFFF"
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>

      {/* Neural pathways - connecting lines */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 1.6, 8]} />
        <meshStandardMaterial
          color="#00FFFF"
          transparent
          opacity={0.6}
          emissive="#00FFFF"
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Glow effects */}
      <pointLight
        color="#00FFFF"
        intensity={2}
        distance={8}
        position={[-0.8, 0, 0]}
      />
      <pointLight
        color="#FF00FF"
        intensity={2}
        distance={8}
        position={[0.8, 0, 0]}
      />
      <pointLight
        color="#FFFFFF"
        intensity={1.5}
        distance={6}
        position={[0, 0, 0]}
      />

      {/* Particle system around brain */}
      {Array.from({ length: 50 }).map((_, i) => {
        const angle = (i / 50) * Math.PI * 2;
        const radius = 2 + Math.sin(time.current * 2 + i) * 0.3;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 3 + i) * 0.5;
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
    </group>
  );
}