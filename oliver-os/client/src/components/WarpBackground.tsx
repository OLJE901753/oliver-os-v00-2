import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';

export function WarpBackground() {
  const warpRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    if (warpRef.current) {
      // Move warp effect towards camera
      warpRef.current.position.z += delta * 10;
      
      // Reset position when it gets too close
      if (warpRef.current.position.z > 5) {
        warpRef.current.position.z = -20;
      }
    }
  });

  return (
    <group ref={warpRef} position={[0, 0, -20]}>
      {/* Light-speed warp lines */}
      {Array.from({ length: 50 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 20;
        const z = Math.random() * 20;
        
        return (
          <Box
            key={i}
            args={[0.02, 0.02, 2]}
            position={[x, y, z]}
            rotation={[0, 0, Math.random() * Math.PI]}
          >
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.3 + Math.sin(time.current * 2 + i) * 0.2}
            />
          </Box>
        );
      })}

      {/* Warp particles */}
      {Array.from({ length: 100 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 40;
        const y = (Math.random() - 0.5) * 20;
        const z = Math.random() * 20;
        
        return (
          <Sphere key={i} args={[0.01, 4, 4]} position={[x, y, z]}>
            <meshBasicMaterial
              color={i % 3 === 0 ? "#00FFFF" : i % 3 === 1 ? "#FF00FF" : "#00FF00"}
              transparent
              opacity={0.2 + Math.sin(time.current * 3 + i) * 0.1}
            />
          </Sphere>
        );
      })}

      {/* Ambient particles */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 8 + Math.sin(time.current * 0.5 + i) * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 1.5 + i) * 1;
        
        return (
          <Sphere key={i} args={[0.03, 6, 6]} position={[x, y, z]}>
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.4 + Math.sin(time.current * 2 + i) * 0.2}
            />
          </Sphere>
        );
      })}
    </group>
  );
}
