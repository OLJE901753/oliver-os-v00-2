import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RoboticHandsProps {
  position?: [number, number, number];
}

export function RoboticHands({ position = [0, -3, 2] }: RoboticHandsProps) {
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const keyboardRef = useRef<THREE.Mesh>(null);
  
  // Create metallic material
  const metallicMaterial = new THREE.MeshStandardMaterial({
    color: '#333333',
    metalness: 0.8,
    roughness: 0.2,
    emissive: '#111111',
    emissiveIntensity: 0.1
  });
  
  // Create glowing accent material
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: '#FF00FF',
    metalness: 0.9,
    roughness: 0.1,
    emissive: '#FF00FF',
    emissiveIntensity: 0.3
  });
  
  useFrame((state) => {
    if (leftHandRef.current) {
      // Subtle hand movement
      leftHandRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
      leftHandRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
    }
    
    if (rightHandRef.current) {
      rightHandRef.current.position.y = Math.cos(state.clock.elapsedTime * 2) * 0.02;
      rightHandRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 1.5) * 0.03;
    }
    
    if (keyboardRef.current) {
      // Subtle keyboard glow animation
      const glowIntensity = 0.1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      if (keyboardRef.current.material instanceof THREE.MeshStandardMaterial) {
        keyboardRef.current.material.emissiveIntensity = glowIntensity;
      }
    }
  });
  
  return (
    <group position={position}>
      {/* Left Hand */}
      <group ref={leftHandRef} position={[-2, 0, 0]}>
        {/* Hand base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.3]} />
          <primitive object={metallicMaterial} />
        </mesh>
        
        {/* Wrist joint with glow */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <primitive object={glowMaterial} />
        </mesh>
        
        {/* Fingers */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-0.2 + i * 0.1, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.3, 0.08]} />
            <primitive object={metallicMaterial} />
          </mesh>
        ))}
      </group>
      
      {/* Right Hand */}
      <group ref={rightHandRef} position={[2, 0, 0]}>
        {/* Hand base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.3]} />
          <primitive object={metallicMaterial} />
        </mesh>
        
        {/* Wrist joint with glow */}
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <primitive object={glowMaterial} />
        </mesh>
        
        {/* Fingers */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-0.2 + i * 0.1, 0.2, 0]}>
            <boxGeometry args={[0.08, 0.3, 0.08]} />
            <primitive object={metallicMaterial} />
          </mesh>
        ))}
      </group>
      
      {/* Keyboard */}
      <mesh ref={keyboardRef} position={[0, -0.5, 0]}>
        <boxGeometry args={[6, 0.1, 2]} />
        <meshStandardMaterial
          color="#111111"
          metalness={0.9}
          roughness={0.1}
          emissive="#00FFFF"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Keyboard keys */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[-3 + i * 0.3, -0.4, 0]}>
          <boxGeometry args={[0.25, 0.05, 0.25]} />
          <meshStandardMaterial
            color="#222222"
            metalness={0.8}
            roughness={0.2}
            emissive={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
