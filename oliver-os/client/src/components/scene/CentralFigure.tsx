import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { IcosahedronGeometry } from 'three';
import { WireframePulseShader } from '../../shaders/WireframePulseShader';
import * as THREE from 'three';

interface CentralFigureProps {
  position?: [number, number, number];
  scale?: number;
}

export function CentralFigure({ position = [0, 0, 0], scale = 1 }: CentralFigureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create high-poly geometry for smooth wireframe effect
  const geometry = useMemo(() => {
    // Using IcosahedronGeometry as placeholder - replace with loaded GLTF/FBX model
    return new IcosahedronGeometry(1.5, 4); // High subdivision for smooth wireframe
  }, []);
  
  // Create shader material with reduced glow for accessibility
  const shaderMaterial = useMemo(() => {
    const shader = { ...WireframePulseShader };
    // Reduce glow intensity for accessibility
    shader.uniforms.uGlowIntensity.value = 0.6;
    return new THREE.ShaderMaterial(shader);
  }, []);
  
  useFrame((state) => {
    if (shaderRef.current) {
      // Update time uniform for animation
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    
    if (meshRef.current) {
      // Gentle rotation animation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={shaderMaterial}
      position={position}
      scale={[scale, scale, scale]}
    >
      {/* Minimal wireframe overlay for definition */}
      <meshBasicMaterial
        color="#FF00FF"
        transparent
        opacity={0.2}
        wireframe
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}