import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Environment() {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  const flowLinesRef = useRef<THREE.Group>(null);
  
  // Create particle geometry
  const particleGeometry = useMemo(() => {
    return new THREE.SphereGeometry(0.01, 4, 4);
  }, []);
  
  // Create particle material
  const particleMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#00FFFF',
      transparent: true,
      opacity: 0.4 // Reduced for subtlety
    });
  }, []);
  
  // Create particle positions
  const particleCount = 500; // Reduced for performance
  
  useFrame((state) => {
    if (particlesRef.current) {
      // Animate particles for subtle speed streak effect
      const time = state.clock.elapsedTime;
      const positions = particlesRef.current.geometry.attributes.position.array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Move particles towards camera slowly
        positions[i + 2] += 0.05; // Slower movement
        
        // Reset position when they get too close
        if (positions[i + 2] > 10) {
          positions[i + 2] = -50;
        }
        
        // Subtle movement
        positions[i] += Math.sin(time + i) * 0.005;
        positions[i + 1] += Math.cos(time + i) * 0.005;
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    
    if (flowLinesRef.current) {
      // Animate flowing lines
      flowLinesRef.current.children.forEach((line, i) => {
        const lineMesh = line as THREE.Mesh;
        if (lineMesh.material instanceof THREE.MeshBasicMaterial) {
          // Subtle opacity animation
          lineMesh.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
        }
      });
    }
  });
  
  return (
    <>
      {/* Ambient Light - Very low for contrast */}
      <ambientLight intensity={0.05} color="#001122" />
      
      {/* Main Directional Light */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        color="#FFFFFF"
        castShadow
      />
      
      {/* Colored Point Lights - Reduced intensity */}
      <pointLight
        position={[-5, 5, 5]}
        intensity={1.0}
        color="#00FFFF"
        distance={20}
      />
      <pointLight
        position={[5, 5, 5]}
        intensity={1.0}
        color="#FF00FF"
        distance={20}
      />
      <pointLight
        position={[0, -5, 5]}
        intensity={0.8}
        color="#00FF00"
        distance={15}
      />
      
      {/* Rim Lighting */}
      <directionalLight
        position={[-10, -10, -10]}
        intensity={0.3}
        color="#00FFFF"
      />
      <directionalLight
        position={[10, -10, -10]}
        intensity={0.3}
        color="#FF00FF"
      />
      
      {/* Subtle Speed Streak Particles */}
      <instancedMesh
        ref={particlesRef}
        geometry={particleGeometry}
        material={particleMaterial}
        args={[particleGeometry, particleMaterial, particleCount]}
      />
      
      {/* Flowing Data Lines */}
      <group ref={flowLinesRef}>
        {Array.from({ length: 20 }).map((_, i) => {
          const start = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            -10
          );
          const end = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            10
          );
          
          const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
          
          return (
            <primitive 
              key={i} 
              object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
                color: i % 2 === 0 ? "#00FFFF" : "#FF00FF",
                transparent: true,
                opacity: 0.3
              }))} 
            />
          );
        })}
      </group>
      
      {/* Fog for depth */}
      <fog attach="fog" args={['#000011', 5, 30]} />
    </>
  );
}