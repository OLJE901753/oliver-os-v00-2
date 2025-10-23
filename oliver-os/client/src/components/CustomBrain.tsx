import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMemo } from 'react';

export function CustomBrain() {
  const brainRef = useRef<THREE.Group>(null);
  const time = useRef(0);

  useFrame((_state, delta) => {
    time.current += delta;

    if (brainRef.current) {
      // Gentle, rhythmic pulse animation
      const pulse = 1 + Math.sin(time.current * 2) * 0.1;
      brainRef.current.scale.setScalar(pulse);
      
      // Subtle rotation
      brainRef.current.rotation.y = Math.sin(time.current * 0.5) * 0.1;
    }
  });

  // Create custom brain geometry
  const brainGeometry = useMemo(() => {
    const geometry = new THREE.SphereGeometry(1.5, 64, 64);
    
    // Add brain-like distortions
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      
      // Add brain-like folds and creases
      const fold1 = Math.sin(x * 3) * Math.cos(y * 2) * 0.1;
      const fold2 = Math.cos(z * 2) * Math.sin(y * 3) * 0.1;
      const fold3 = Math.sin(x * 2) * Math.cos(z * 3) * 0.1;
      
      positions[i + 1] += fold1 + fold2 + fold3;
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, []);

  // Custom shader for wireframe with inner glow
  const customShader = useMemo(() => ({
    uniforms: {
      time: { value: 0 },
      color1: { value: new THREE.Color('#00FFFF') },
      color2: { value: new THREE.Color('#FF00FF') },
      glowIntensity: { value: 0.8 }
    },
    vertexShader: `
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        vPosition = position;
        vNormal = normal;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform float glowIntensity;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying vec2 vUv;
      
      void main() {
        // Create brain hemisphere split
        float hemisphere = step(0.0, vPosition.x);
        vec3 brainColor = mix(color1, color2, hemisphere);
        
        // Add inner structure visibility
        float innerGlow = sin(vPosition.y * 10.0 + time) * 0.5 + 0.5;
        innerGlow += sin(vPosition.z * 8.0 + time * 1.5) * 0.3;
        innerGlow += sin(vPosition.x * 6.0 + time * 0.8) * 0.2;
        
        // Wireframe effect
        float wireframe = 1.0 - smoothstep(0.0, 0.02, abs(sin(vUv.x * 50.0)) * abs(sin(vUv.y * 50.0)));
        
        // Combine colors and effects
        vec3 finalColor = brainColor * (innerGlow * 0.7 + 0.3);
        finalColor += brainColor * wireframe * glowIntensity;
        
        // Add pulsing effect
        float pulse = sin(time * 2.0) * 0.2 + 0.8;
        finalColor *= pulse;
        
        gl_FragColor = vec4(finalColor, 0.9);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  }), []);

  useFrame((_state) => {
    if (customShader.uniforms.time) {
      customShader.uniforms.time.value = time.current;
    }
  });

  return (
    <group ref={brainRef} position={[0, 0, 0]}>
      {/* Custom Brain Mesh */}
      <mesh geometry={brainGeometry}>
        <shaderMaterial {...customShader} />
      </mesh>
      
      {/* Additional wireframe overlay */}
      <mesh geometry={brainGeometry}>
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>
      
      {/* Inner neural pathways */}
      {Array.from({ length: 30 }).map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const radius = 0.8 + Math.sin(time.current * 2 + i) * 0.2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(time.current * 3 + i) * 0.3;
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? "#00FFFF" : "#FF00FF"}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}
      
      {/* Glow effects */}
      <pointLight
        color="#00FFFF"
        intensity={3}
        distance={15}
        position={[-0.5, 0, 0]}
      />
      <pointLight
        color="#FF00FF"
        intensity={3}
        distance={15}
        position={[0.5, 0, 0]}
      />
    </group>
  );
}
