import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function HumanFace() {
  const faceRef = useRef<THREE.Group>(null);
  const leftBrainRef = useRef<THREE.Mesh>(null);
  const rightBrainRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    if (faceRef.current) {
      // Gentle floating animation
      faceRef.current.position.y = Math.sin(time.current * 0.5) * 0.1;
      faceRef.current.rotation.y = Math.sin(time.current * 0.3) * 0.05;
    }

    // Brain hemisphere animations
    if (leftBrainRef.current) {
      leftBrainRef.current.rotation.z = Math.sin(time.current * 1.2) * 0.1;
      leftBrainRef.current.position.x = -0.3 + Math.sin(time.current * 1.5) * 0.02;
    }
    
    if (rightBrainRef.current) {
      rightBrainRef.current.rotation.z = Math.cos(time.current * 1.2) * 0.1;
      rightBrainRef.current.position.x = 0.3 + Math.cos(time.current * 1.5) * 0.02;
    }
  });

  return (
    <group ref={faceRef} position={[0, 0, 0]}>
      {/* Human Head Base */}
      <Sphere args={[1.8, 64, 64]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.1}
          emissive="#FFFFFF"
          emissiveIntensity={0.05}
        />
      </Sphere>

      {/* Left Brain Hemisphere - Blue */}
      <Sphere 
        ref={leftBrainRef} 
        args={[0.8, 64, 64]} 
        position={[-0.3, 0.2, 0.1]}
      >
        <MeshDistortMaterial
          color="#00FFFF"
          transparent
          opacity={0.8}
          distort={0.3}
          speed={1.5}
          emissive="#00FFFF"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.2}
        />
      </Sphere>

      {/* Right Brain Hemisphere - Purple */}
      <Sphere 
        ref={rightBrainRef} 
        args={[0.8, 64, 64]} 
        position={[0.3, 0.2, 0.1]}
      >
        <MeshDistortMaterial
          color="#FF00FF"
          transparent
          opacity={0.8}
          distort={0.3}
          speed={1.5}
          emissive="#FF00FF"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.2}
        />
      </Sphere>

      {/* Brain Stem Connection */}
      <Sphere args={[0.2, 32, 32]} position={[0, -0.1, 0.2]}>
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.9}
          emissive="#FFFFFF"
          emissiveIntensity={0.4}
        />
      </Sphere>

      {/* Neural Pathways on Brain Surface */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 0.6 + Math.sin(time.current * 2 + i) * 0.1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 0.2 + Math.sin(time.current * 3 + i) * 0.05;
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.7}
            />
          </mesh>
        );
      })}

      {/* Glow Effects */}
      <pointLight
        color="#00FFFF"
        intensity={2}
        distance={10}
        position={[-0.3, 0.2, 0.1]}
      />
      <pointLight
        color="#FF00FF"
        intensity={2}
        distance={10}
        position={[0.3, 0.2, 0.1]}
      />
    </group>
  );
}
