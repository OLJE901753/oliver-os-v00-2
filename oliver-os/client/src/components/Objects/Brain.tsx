import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface BrainProps {
  position: [number, number, number];
  focused: boolean;
  onClick: () => void;
  data?: {
    cpu: number;
    memory: number;
    processes: number;
  };
}

export function Brain({ position, focused, onClick }: BrainProps) {
  const leftHemisphereRef = useRef<THREE.Mesh>(null);
  const rightHemisphereRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    if (!leftHemisphereRef.current || !rightHemisphereRef.current) return;
    time.current += delta;
    
    // Pulse animation
    const scale = 1 + Math.sin(time.current * 3) * 0.05;
    const finalScale = focused ? 1.5 : scale;
    
    leftHemisphereRef.current.scale.setScalar(finalScale);
    rightHemisphereRef.current.scale.setScalar(finalScale);
    
    // Rotation when focused
    if (focused) {
      leftHemisphereRef.current.rotation.y += delta * 0.5;
      rightHemisphereRef.current.rotation.y += delta * 0.5;
    }

    // Subtle breathing effect
    const breathe = 1 + Math.sin(time.current * 2) * 0.02;
    leftHemisphereRef.current.scale.y = finalScale * breathe;
    rightHemisphereRef.current.scale.y = finalScale * breathe;
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Left Hemisphere - Cyan */}
      <Sphere ref={leftHemisphereRef} args={[1, 64, 64]} position={[-0.5, 0, 0]}>
        <MeshDistortMaterial
          color="#00FFFF"
          transparent
          opacity={0.8}
          distort={0.3}
          speed={2}
          emissive="#00FFFF"
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Right Hemisphere - Magenta */}
      <Sphere ref={rightHemisphereRef} args={[1, 64, 64]} position={[0.5, 0, 0]}>
        <MeshDistortMaterial
          color="#FF00FF"
          transparent
          opacity={0.8}
          distort={0.3}
          speed={2}
          emissive="#FF00FF"
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Central connection */}
      <Sphere args={[0.3, 32, 32]} position={[0, 0, 0]}>
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.6}
        />
      </Sphere>
      
      {/* Glow Effect */}
      <pointLight 
        color={focused ? "#FFFFFF" : "#00FFFF"} 
        intensity={focused ? 2 : 1} 
        distance={5} 
      />
      
      {/* Neural pathways */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color="#00FFFF"
          transparent
          opacity={0.1}
          wireframe
        />
      </mesh>
    </group>
  );
}
