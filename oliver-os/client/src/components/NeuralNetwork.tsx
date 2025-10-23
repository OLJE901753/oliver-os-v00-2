import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NeuralNetwork() {
  const linesRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;
  });

  // Generate complex connection network
  const connections = [
    // Main brain connections
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-6, 2, 1), 
      color: '#00FFFF',
      intensity: 0.8,
      thickness: 0.05
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(6, 2, 1), 
      color: '#FF00FF',
      intensity: 0.8,
      thickness: 0.05
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-6, 0, 1), 
      color: '#00FF00',
      intensity: 0.7,
      thickness: 0.04
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(6, 0, 1), 
      color: '#FF00FF',
      intensity: 0.7,
      thickness: 0.04
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-6, -2, 1), 
      color: '#00FFFF',
      intensity: 0.6,
      thickness: 0.03
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(6, -2, 1), 
      color: '#FF00FF',
      intensity: 0.6,
      thickness: 0.03
    },
    // Hand connections
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(-2.5, -3, 2), 
      color: '#00FFFF',
      intensity: 0.5,
      thickness: 0.03
    },
    { 
      start: new THREE.Vector3(0, 0, 0), 
      end: new THREE.Vector3(2.5, -3, 2), 
      color: '#FF00FF',
      intensity: 0.5,
      thickness: 0.03
    },
    // Cross connections
    { 
      start: new THREE.Vector3(-6, 2, 1), 
      end: new THREE.Vector3(6, 2, 1), 
      color: '#00FFFF',
      intensity: 0.4,
      thickness: 0.02
    },
    { 
      start: new THREE.Vector3(-6, 0, 1), 
      end: new THREE.Vector3(6, 0, 1), 
      color: '#FF00FF',
      intensity: 0.4,
      thickness: 0.02
    },
    { 
      start: new THREE.Vector3(-6, -2, 1), 
      end: new THREE.Vector3(6, -2, 1), 
      color: '#00FF00',
      intensity: 0.4,
      thickness: 0.02
    }
  ];

  return (
    <group ref={linesRef}>
      {/* Main connection lines */}
      {connections.map((connection, index) => {
        const points = [
          connection.start,
          connection.end
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <primitive 
            key={index} 
            object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
              color: connection.color,
              transparent: true,
              opacity: connection.intensity + Math.sin(time.current * 2 + index) * 0.2,
              linewidth: connection.thickness * 100
            }))} 
          />
        );
      })}
      
      {/* Animated particles along connections */}
      {connections.map((connection, index) => {
        const progress = (time.current * 0.5 + index * 0.2) % 1;
        const start = connection.start;
        const end = connection.end;
        const position = start.clone().lerp(end, progress);
        
        // Add some randomness to particle movement
        const offset = new THREE.Vector3(
          Math.sin(time.current * 3 + index) * 0.1,
          Math.cos(time.current * 2 + index) * 0.1,
          Math.sin(time.current * 4 + index) * 0.1
        );
        position.add(offset);
        
        return (
          <mesh key={`particle-${index}`} position={position}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial
              color={connection.color}
              transparent
              opacity={0.8 + Math.sin(time.current * 4 + index) * 0.2}
            />
          </mesh>
        );
      })}

      {/* Energy pulses */}
      {connections.map((connection, index) => {
        const pulseProgress = (time.current * 1.5 + index * 0.3) % 1;
        const start = connection.start;
        const end = connection.end;
        const position = start.clone().lerp(end, pulseProgress);
        
        return (
          <mesh key={`pulse-${index}`} position={position}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial
              color={connection.color}
              transparent
              opacity={0.6 * (1 - pulseProgress)}
            />
          </mesh>
        );
      })}

      {/* Neural network grid */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 3 + Math.sin(time.current * 0.5 + i) * 0.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 2 + i) * 0.5;
        
        return (
          <mesh key={`grid-${i}`} position={[x, y, z]}>
            <sphereGeometry args={[0.01, 6, 6]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.4}
            />
          </mesh>
        );
      })}

      {/* Data streams */}
      {Array.from({ length: 20 }).map((_, i) => {
        const startAngle = (i / 20) * Math.PI * 2;
        const endAngle = startAngle + Math.PI * 0.5;
        const startRadius = 2;
        const endRadius = 6;
        
        const startX = Math.cos(startAngle) * startRadius;
        const startZ = Math.sin(startAngle) * startRadius;
        const endX = Math.cos(endAngle) * endRadius;
        const endZ = Math.sin(endAngle) * endRadius;
        
        const start = new THREE.Vector3(startX, 0, startZ);
        const end = new THREE.Vector3(endX, 0, endZ);
        
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        
        return (
          <primitive 
            key={`stream-${i}`} 
            object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
              color: i % 2 === 0 ? "#00FFFF" : "#FF00FF",
              transparent: true,
              opacity: 0.3 + Math.sin(time.current * 3 + i) * 0.2,
              linewidth: 1
            }))} 
          />
        );
      })}
    </group>
  );
}
