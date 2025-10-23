import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function HolographicPanels() {
  const panelsRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    if (panelsRef.current) {
      // Gentle floating animation
      panelsRef.current.children.forEach((panel, i) => {
        panel.position.y += Math.sin(time.current * 0.5 + i) * 0.005;
        panel.rotation.y += delta * 0.01;
      });
    }
  });

  const HolographicPanel = ({ 
    position, 
    size, 
    color, 
    emissiveColor, 
    children 
  }: { 
    position: [number, number, number], 
    size: [number, number, number], 
    color: string, 
    emissiveColor: string,
    children?: React.ReactNode 
  }) => (
    <group position={position}>
      {/* Main panel */}
      <Box args={size}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.3}
          emissive={emissiveColor}
          emissiveIntensity={0.4}
          metalness={0.8}
          roughness={0.1}
        />
      </Box>
      
      {/* Holographic border */}
      <Box args={[size[0] + 0.1, size[1] + 0.1, size[2] + 0.1]} position={[0, 0, -0.01]}>
        <meshBasicMaterial
          color={emissiveColor}
          transparent
          opacity={0.6}
          wireframe
        />
      </Box>
      
      {children}
    </group>
  );

  return (
    <group ref={panelsRef} position={[0, 0, -5]}>
      {/* Left Side - Code Panels */}
      <HolographicPanel
        position={[-6, 2, 1]}
        size={[2, 1.5, 0.1]}
        color="#001100"
        emissiveColor="#00FF00"
      >
        {/* Code lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <Box
            key={i}
            args={[1.8, 0.02, 0.01]}
            position={[0, -0.6 + i * 0.1, 0.06]}
          >
            <meshBasicMaterial
              color="#00FF00"
              transparent
              opacity={0.6 + Math.sin(time.current * 2 + i) * 0.3}
            />
          </Box>
        ))}
      </HolographicPanel>

      {/* Left Side - Data Visualization */}
      <HolographicPanel
        position={[-6, 0, 1]}
        size={[2, 1.5, 0.1]}
        color="#001122"
        emissiveColor="#00FFFF"
      >
        {/* Data bars */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            args={[0.15, 0.2 + Math.sin(time.current + i) * 0.1, 0.01]}
            position={[-0.7 + i * 0.2, -0.3, 0.06]}
          >
            <meshBasicMaterial
              color="#00FFFF"
              transparent
              opacity={0.8}
            />
          </Box>
        ))}
      </HolographicPanel>

      {/* Left Side - Profile Head 1 */}
      <HolographicPanel
        position={[-6, -2, 1]}
        size={[2, 1.5, 0.1]}
        color="#000000"
        emissiveColor="#00FF00"
      >
        {/* Head silhouette */}
        <Sphere args={[0.4, 16, 16]} position={[0, 0, 0.06]}>
          <meshBasicMaterial
            color="#00FF00"
            transparent
            opacity={0.7}
            wireframe
          />
        </Sphere>
        {/* Internal patterns */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Box
            key={i}
            args={[0.1, 0.1, 0.01]}
            position={[-0.2 + i * 0.08, 0, 0.07]}
          >
            <meshBasicMaterial color="#00FF00" />
          </Box>
        ))}
      </HolographicPanel>

      {/* Right Side - Deepfake Panel */}
      <HolographicPanel
        position={[6, 2, 1]}
        size={[2, 1.5, 0.1]}
        color="#000000"
        emissiveColor="#FF00FF"
      >
        {/* Starburst effect */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = Math.cos(angle) * 0.3;
          const z = Math.sin(angle) * 0.3;
          return (
            <Box
              key={i}
              args={[0.05, 0.3, 0.01]}
              position={[x, z, 0.06]}
              rotation={[0, 0, angle]}
            >
              <meshBasicMaterial
                color="#FF00FF"
                transparent
                opacity={0.8}
              />
            </Box>
          );
        })}
      </HolographicPanel>

      {/* Right Side - AI Panel */}
      <HolographicPanel
        position={[6, 0, 1]}
        size={[2, 1.5, 0.1]}
        color="#001122"
        emissiveColor="#FF00FF"
      >
        {/* AI text representation */}
        <Box args={[1.8, 0.1, 0.01]} position={[0, 0, 0.06]}>
          <meshBasicMaterial color="#FF00FF" />
        </Box>
        <Box args={[1.8, 0.1, 0.01]} position={[0, -0.2, 0.06]}>
          <meshBasicMaterial color="#FF00FF" />
        </Box>
        <Box args={[1.8, 0.1, 0.01]} position={[0, 0.2, 0.06]}>
          <meshBasicMaterial color="#FF00FF" />
        </Box>
      </HolographicPanel>

      {/* Right Side - Profile Head 2 */}
      <HolographicPanel
        position={[6, -2, 1]}
        size={[2, 1.5, 0.1]}
        color="#000000"
        emissiveColor="#FF00FF"
      >
        {/* Head silhouette */}
        <Sphere args={[0.4, 16, 16]} position={[0, 0, 0.06]}>
          <meshBasicMaterial
            color="#FF00FF"
            transparent
            opacity={0.7}
            wireframe
          />
        </Sphere>
        {/* Internal patterns */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Box
            key={i}
            args={[0.1, 0.1, 0.01]}
            position={[-0.2 + i * 0.08, 0, 0.07]}
          >
            <meshBasicMaterial color="#FF00FF" />
          </Box>
        ))}
      </HolographicPanel>

      {/* Center - Rule-Based Computing Panel */}
      <HolographicPanel
        position={[0, 3, 2]}
        size={[3, 1, 0.1]}
        color="#000000"
        emissiveColor="#00FFFF"
      >
        {/* Text representation */}
        <Box args={[2.8, 0.1, 0.01]} position={[0, 0, 0.06]}>
          <meshBasicMaterial color="#00FFFF" />
        </Box>
        <Box args={[2.8, 0.1, 0.01]} position={[0, -0.2, 0.06]}>
          <meshBasicMaterial color="#00FFFF" />
        </Box>
        <Box args={[2.8, 0.1, 0.01]} position={[0, 0.2, 0.06]}>
          <meshBasicMaterial color="#00FFFF" />
        </Box>
      </HolographicPanel>

      {/* Additional floating data orbs */}
      {Array.from({ length: 15 }).map((_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const radius = 4 + Math.sin(time.current * 0.5 + i) * 0.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 2 + i) * 0.3;
        
        return (
          <Sphere key={i} args={[0.05, 8, 8]} position={[x, y, z]}>
            <meshBasicMaterial
              color={i % 3 === 0 ? "#00FFFF" : i % 3 === 1 ? "#FF00FF" : "#00FF00"}
              transparent
              opacity={0.6}
            />
          </Sphere>
        );
      })}
    </group>
  );
}