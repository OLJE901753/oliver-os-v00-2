import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export function RoboticHands() {
  const leftHandRef = useRef<THREE.Group>(null);
  const rightHandRef = useRef<THREE.Group>(null);
  const leftFingersRef = useRef<THREE.Group>(null);
  const rightFingersRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    // Subtle hand movement
    if (leftHandRef.current) {
      leftHandRef.current.position.y = Math.sin(time.current * 2) * 0.02;
      leftHandRef.current.rotation.z = Math.sin(time.current * 1.5) * 0.03;
    }
    if (rightHandRef.current) {
      rightHandRef.current.position.y = Math.cos(time.current * 2) * 0.02;
      rightHandRef.current.rotation.z = Math.cos(time.current * 1.5) * 0.03;
    }

    // Finger animations
    if (leftFingersRef.current) {
      leftFingersRef.current.children.forEach((finger, i) => {
        const fingerGroup = finger as THREE.Group;
        fingerGroup.rotation.z = Math.sin(time.current * 3 + i * 0.5) * 0.08;
      });
    }
    if (rightFingersRef.current) {
      rightFingersRef.current.children.forEach((finger, i) => {
        const fingerGroup = finger as THREE.Group;
        fingerGroup.rotation.z = Math.cos(time.current * 3 + i * 0.5) * 0.08;
      });
    }
  });

  const Finger = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number], rotation?: [number, number, number] }) => (
    <group position={position} rotation={rotation}>
      {/* Finger joint 1 */}
      <Cylinder args={[0.08, 0.08, 0.4, 8]} position={[0, 0.2, 0]}>
        <meshStandardMaterial
          color="#CCCCCC"
          metalness={0.9}
          roughness={0.1}
          emissive="#00FFFF"
          emissiveIntensity={0.1}
        />
      </Cylinder>
      {/* Finger joint 2 */}
      <Cylinder args={[0.06, 0.06, 0.3, 8]} position={[0, 0.45, 0]}>
        <meshStandardMaterial
          color="#CCCCCC"
          metalness={0.9}
          roughness={0.1}
          emissive="#00FFFF"
          emissiveIntensity={0.1}
        />
      </Cylinder>
      {/* Finger tip */}
      <Sphere args={[0.06, 8, 8]} position={[0, 0.65, 0]}>
        <meshStandardMaterial
          color="#00FFFF"
          metalness={0.9}
          roughness={0.1}
          emissive="#00FFFF"
          emissiveIntensity={0.3}
        />
      </Sphere>
    </group>
  );

  return (
    <group position={[0, -3, 2]}>
      {/* Left Hand */}
      <group ref={leftHandRef} position={[-2.5, 0, 0]}>
        {/* Hand base */}
        <Box args={[0.8, 0.6, 0.4]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#333333"
            metalness={0.9}
            roughness={0.1}
            emissive="#00FFFF"
            emissiveIntensity={0.2}
          />
        </Box>
        
        {/* Wrist joint with purple glow */}
        <Cylinder args={[0.2, 0.2, 0.3, 16]} position={[0, -0.4, 0]}>
          <meshStandardMaterial
            color="#555555"
            metalness={0.9}
            roughness={0.1}
            emissive="#FF00FF"
            emissiveIntensity={0.4}
          />
        </Cylinder>

        {/* Fingers */}
        <group ref={leftFingersRef} position={[0, 0.3, 0]}>
          <Finger position={[-0.3, 0, 0]} rotation={[0, 0, -0.2]} />
          <Finger position={[-0.15, 0, 0]} rotation={[0, 0, -0.1]} />
          <Finger position={[0, 0, 0]} rotation={[0, 0, 0]} />
          <Finger position={[0.15, 0, 0]} rotation={[0, 0, 0.1]} />
          <Finger position={[0.3, 0, 0]} rotation={[0, 0, 0.2]} />
        </group>
      </group>

      {/* Right Hand */}
      <group ref={rightHandRef} position={[2.5, 0, 0]}>
        {/* Hand base */}
        <Box args={[0.8, 0.6, 0.4]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#333333"
            metalness={0.9}
            roughness={0.1}
            emissive="#FF00FF"
            emissiveIntensity={0.2}
          />
        </Box>
        
        {/* Wrist joint with purple glow */}
        <Cylinder args={[0.2, 0.2, 0.3, 16]} position={[0, -0.4, 0]}>
          <meshStandardMaterial
            color="#555555"
            metalness={0.9}
            roughness={0.1}
            emissive="#FF00FF"
            emissiveIntensity={0.4}
          />
        </Cylinder>

        {/* Fingers */}
        <group ref={rightFingersRef} position={[0, 0.3, 0]}>
          <Finger position={[-0.3, 0, 0]} rotation={[0, 0, 0.2]} />
          <Finger position={[-0.15, 0, 0]} rotation={[0, 0, 0.1]} />
          <Finger position={[0, 0, 0]} rotation={[0, 0, 0]} />
          <Finger position={[0.15, 0, 0]} rotation={[0, 0, -0.1]} />
          <Finger position={[0.3, 0, 0]} rotation={[0, 0, -0.2]} />
        </group>
      </group>

      {/* Glowing Keyboard */}
      <group position={[0, -0.5, 0]}>
        {/* Keyboard base */}
        <Box args={[8, 0.15, 3]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#111111"
            metalness={0.9}
            roughness={0.1}
            emissive="#FFFFFF"
            emissiveIntensity={0.1}
          />
        </Box>
        
        {/* Keyboard keys */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i - 10) * 0.35;
          const z = Math.sin(i * 0.3) * 0.1;
          return (
            <Box key={i} args={[0.3, 0.1, 0.3]} position={[x, 0.1, z]}>
              <meshStandardMaterial
                color="#222222"
                metalness={0.8}
                roughness={0.2}
                emissive={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
                emissiveIntensity={0.3}
              />
            </Box>
          );
        })}

        {/* Glowing edges */}
        <Box args={[8.1, 0.02, 0.1]} position={[0, 0.08, 1.55]}>
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.8} />
        </Box>
        <Box args={[8.1, 0.02, 0.1]} position={[0, 0.08, -1.55]}>
          <meshBasicMaterial color="#FF00FF" transparent opacity={0.8} />
        </Box>
        <Box args={[0.1, 0.02, 3.1]} position={[4.05, 0.08, 0]}>
          <meshBasicMaterial color="#00FFFF" transparent opacity={0.8} />
        </Box>
        <Box args={[0.1, 0.02, 3.1]} position={[-4.05, 0.08, 0]}>
          <meshBasicMaterial color="#FF00FF" transparent opacity={0.8} />
        </Box>
      </group>
    </group>
  );
}