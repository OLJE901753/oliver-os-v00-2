import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function CurvedScreens() {
  const screensRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    if (screensRef.current) {
      // Gentle floating animation
      screensRef.current.children.forEach((screen, i) => {
        screen.position.y += Math.sin(time.current * 0.5 + i) * 0.003;
        screen.rotation.y += delta * 0.01;
      });
    }
  });

  const CurvedScreen = ({ 
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
      {/* Main curved screen */}
      <Box args={size}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.4}
          emissive={emissiveColor}
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
        />
      </Box>
      
      {/* Curved border with glow */}
      <Box args={[size[0] + 0.15, size[1] + 0.15, size[2] + 0.15]} position={[0, 0, -0.01]}>
        <meshBasicMaterial
          color={emissiveColor}
          transparent
          opacity={0.8}
          wireframe
        />
      </Box>
      
      {children}
    </group>
  );

  return (
    <group ref={screensRef} position={[0, 0, -6]}>
      {/* Left Side - Code Panels */}
      <CurvedScreen
        position={[-8, 3, 2]}
        size={[2.5, 2, 0.1]}
        color="#001100"
        emissiveColor="#00FF00"
      >
        {/* Code lines */}
        {Array.from({ length: 15 }).map((_, i) => (
          <Box
            key={i}
            args={[2.3, 0.03, 0.01]}
            position={[0, -0.8 + i * 0.1, 0.06]}
          >
            <meshBasicMaterial
              color="#00FF00"
              transparent
              opacity={0.7 + Math.sin(time.current * 3 + i) * 0.3}
            />
          </Box>
        ))}
      </CurvedScreen>

      {/* Left Side - Data Visualization */}
      <CurvedScreen
        position={[-8, 0, 2]}
        size={[2.5, 2, 0.1]}
        color="#001122"
        emissiveColor="#00FFFF"
      >
        {/* Data bars */}
        {Array.from({ length: 10 }).map((_, i) => (
          <Box
            key={i}
            args={[0.2, 0.3 + Math.sin(time.current + i) * 0.15, 0.01]}
            position={[-1 + i * 0.2, -0.4, 0.06]}
          >
            <meshBasicMaterial
              color="#00FFFF"
              transparent
              opacity={0.9}
            />
          </Box>
        ))}
      </CurvedScreen>

      {/* Left Side - Profile Head 1 */}
      <CurvedScreen
        position={[-8, -3, 2]}
        size={[2.5, 2, 0.1]}
        color="#000000"
        emissiveColor="#00FF00"
      >
        {/* Head silhouette */}
        <Sphere args={[0.5, 16, 16]} position={[0, 0, 0.06]}>
          <meshBasicMaterial
            color="#00FF00"
            transparent
            opacity={0.8}
            wireframe
          />
        </Sphere>
        {/* Internal patterns */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            args={[0.12, 0.12, 0.01]}
            position={[-0.3 + i * 0.08, 0, 0.07]}
          >
            <meshBasicMaterial color="#00FF00" />
          </Box>
        ))}
      </CurvedScreen>

      {/* Right Side - Deepfake Panel */}
      <CurvedScreen
        position={[8, 3, 2]}
        size={[2.5, 2, 0.1]}
        color="#000000"
        emissiveColor="#FF00FF"
      >
        {/* Starburst effect */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const x = Math.cos(angle) * 0.4;
          const z = Math.sin(angle) * 0.4;
          return (
            <Box
              key={i}
              args={[0.08, 0.4, 0.01]}
              position={[x, z, 0.06]}
              rotation={[0, 0, angle]}
            >
              <meshBasicMaterial
                color="#FF00FF"
                transparent
                opacity={0.9}
              />
            </Box>
          );
        })}
      </CurvedScreen>

      {/* Right Side - AI Panel */}
      <CurvedScreen
        position={[8, 0, 2]}
        size={[2.5, 2, 0.1]}
        color="#001122"
        emissiveColor="#FF00FF"
      >
        {/* AI text representation */}
        <Box args={[2.3, 0.12, 0.01]} position={[0, 0, 0.06]}>
          <meshBasicMaterial color="#FF00FF" />
        </Box>
        <Box args={[2.3, 0.12, 0.01]} position={[0, -0.3, 0.06]}>
          <meshBasicMaterial color="#FF00FF" />
        </Box>
        <Box args={[2.3, 0.12, 0.01]} position={[0, 0.3, 0.06]}>
          <meshBasicMaterial color="#FF00FF" />
        </Box>
      </CurvedScreen>

      {/* Right Side - Profile Head 2 */}
      <CurvedScreen
        position={[8, -3, 2]}
        size={[2.5, 2, 0.1]}
        color="#000000"
        emissiveColor="#FF00FF"
      >
        {/* Head silhouette */}
        <Sphere args={[0.5, 16, 16]} position={[0, 0, 0.06]}>
          <meshBasicMaterial
            color="#FF00FF"
            transparent
            opacity={0.8}
            wireframe
          />
        </Sphere>
        {/* Internal patterns */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            args={[0.12, 0.12, 0.01]}
            position={[-0.3 + i * 0.08, 0, 0.07]}
          >
            <meshBasicMaterial color="#FF00FF" />
          </Box>
        ))}
      </CurvedScreen>

      {/* Center - Rule-Based Computing Panel */}
      <CurvedScreen
        position={[0, 4, 3]}
        size={[4, 1.5, 0.1]}
        color="#000000"
        emissiveColor="#00FFFF"
      >
        {/* Text representation */}
        <Box args={[3.8, 0.12, 0.01]} position={[0, 0, 0.06]}>
          <meshBasicMaterial color="#00FFFF" />
        </Box>
        <Box args={[3.8, 0.12, 0.01]} position={[0, -0.3, 0.06]}>
          <meshBasicMaterial color="#00FFFF" />
        </Box>
        <Box args={[3.8, 0.12, 0.01]} position={[0, 0.3, 0.06]}>
          <meshBasicMaterial color="#00FFFF" />
        </Box>
      </CurvedScreen>

      {/* Additional floating data orbs */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const radius = 6 + Math.sin(time.current * 0.8 + i) * 1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 2.5 + i) * 0.5;
        
        return (
          <Sphere key={i} args={[0.06, 8, 8]} position={[x, y, z]}>
            <meshBasicMaterial
              color={i % 3 === 0 ? "#00FFFF" : i % 3 === 1 ? "#FF00FF" : "#00FF00"}
              transparent
              opacity={0.7}
            />
          </Sphere>
        );
      })}
    </group>
  );
}
