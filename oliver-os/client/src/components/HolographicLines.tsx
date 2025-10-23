import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function HolographicLines() {
  const linesRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;
  });

  // Generate high-contrast holographic lines
  const connections = [
    // Main brain connections
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-8, 3, 2), 
      color: '#00FFFF',
      intensity: 1.0
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(8, 3, 2), 
      color: '#FF00FF',
      intensity: 1.0
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-8, 0, 2), 
      color: '#00FF00',
      intensity: 0.8
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(8, 0, 2), 
      color: '#FF00FF',
      intensity: 0.8
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-8, -3, 2), 
      color: '#00FFFF',
      intensity: 0.6
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(8, -3, 2), 
      color: '#FF00FF',
      intensity: 0.6
    },
    // Hand connections
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-3, -4, 3), 
      color: '#00FFFF',
      intensity: 0.7
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(3, -4, 3), 
      color: '#FF00FF',
      intensity: 0.7
    },
    // Cross connections
    { 
      start: new THREE.Vector3(-8, 3, 2), 
      end: new THREE.Vector3(8, 3, 2), 
      color: '#00FFFF',
      intensity: 0.5
    },
    { 
      start: new THREE.Vector3(-8, 0, 2), 
      end: new THREE.Vector3(8, 0, 2), 
      color: '#FF00FF',
      intensity: 0.5
    },
    { 
      start: new THREE.Vector3(-8, -3, 2), 
      end: new THREE.Vector3(8, -3, 2), 
      color: '#00FF00',
      intensity: 0.5
    },
    // Additional network lines
    { 
      start: new THREE.Vector3(-8, 3, 2), 
      end: new THREE.Vector3(-8, 0, 2), 
      color: '#00FFFF',
      intensity: 0.4
    },
    { 
      start: new THREE.Vector3(-8, 0, 2), 
      end: new THREE.Vector3(-8, -3, 2), 
      color: '#00FFFF',
      intensity: 0.4
    },
    { 
      start: new THREE.Vector3(8, 3, 2), 
      end: new THREE.Vector3(8, 0, 2), 
      color: '#FF00FF',
      intensity: 0.4
    },
    { 
      start: new THREE.Vector3(8, 0, 2), 
      end: new THREE.Vector3(8, -3, 2), 
      color: '#FF00FF',
      intensity: 0.4
    }
  ];

  return (
    <group ref={linesRef}>
      {/* High-contrast holographic lines */}
      {connections.map((connection, index) => {
        const points = [connection.start, connection.end];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <primitive 
            key={index} 
            object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
              color: connection.color,
              transparent: true,
              opacity: connection.intensity + Math.sin(time.current * 3 + index) * 0.3,
              linewidth: 2
            }))} 
          />
        );
      })}
      
      {/* Animated particles along lines */}
      {connections.map((connection, index) => {
        const progress = (time.current * 0.8 + index * 0.3) % 1;
        const start = connection.start;
        const end = connection.end;
        const position = start.clone().lerp(end, progress);
        
        // Add some randomness to particle movement
        const offset = new THREE.Vector3(
          Math.sin(time.current * 4 + index) * 0.05,
          Math.cos(time.current * 3 + index) * 0.05,
          Math.sin(time.current * 5 + index) * 0.05
        );
        position.add(offset);
        
        return (
          <mesh key={`particle-${index}`} position={position}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial
              color={connection.color}
              transparent
              opacity={0.9 + Math.sin(time.current * 6 + index) * 0.1}
            />
          </mesh>
        );
      })}

      {/* Energy pulses */}
      {connections.map((connection, index) => {
        const pulseProgress = (time.current * 2 + index * 0.5) % 1;
        const start = connection.start;
        const end = connection.end;
        const position = start.clone().lerp(end, pulseProgress);
        
        return (
          <mesh key={`pulse-${index}`} position={position}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial
              color={connection.color}
              transparent
              opacity={0.8 * (1 - pulseProgress)}
            />
          </mesh>
        );
      })}

      {/* Additional network grid */}
      {Array.from({ length: 40 }).map((_, i) => {
        const angle = (i / 40) * Math.PI * 2;
        const radius = 4 + Math.sin(time.current * 0.8 + i) * 1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 2.5 + i) * 0.8;
        
        return (
          <mesh key={`grid-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}
