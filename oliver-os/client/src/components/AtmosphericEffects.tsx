import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

export function AtmosphericEffects() {
  const effectsRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;
  });

  return (
    <group ref={effectsRef}>
      {/* Ambient particles */}
      {Array.from({ length: 50 }).map((_, i) => {
        const angle = (i / 50) * Math.PI * 2;
        const radius = 8 + Math.sin(time.current * 0.3 + i) * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 1.5 + i) * 2;
        
        return (
          <Sphere key={i} args={[0.02, 6, 6]} position={[x, y, z]}>
            <meshBasicMaterial
              color={i % 3 === 0 ? "#00FFFF" : i % 3 === 1 ? "#FF00FF" : "#00FF00"}
              transparent
              opacity={0.3 + Math.sin(time.current * 2 + i) * 0.2}
            />
          </Sphere>
        );
      })}

      {/* Energy orbs */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 5 + Math.sin(time.current * 0.5 + i) * 1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 2 + i) * 1;
        
        return (
          <Sphere key={i} args={[0.1, 12, 12]} position={[x, y, z]}>
            <meshStandardMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.6 + Math.sin(time.current * 3 + i) * 0.3}
              emissive={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              emissiveIntensity={0.2}
            />
          </Sphere>
        );
      })}

      {/* Floating data fragments */}
      {Array.from({ length: 25 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 20;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 20;
        
        return (
          <Box key={i} args={[0.05, 0.05, 0.05]} position={[x, y, z]}>
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.4}
            />
          </Box>
        );
      })}

      {/* Volumetric lighting effects */}
      <fog attach="fog" args={['#000011', 5, 30]} />
    </group>
  );
}
