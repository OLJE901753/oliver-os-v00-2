import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PlaneGeometry } from 'three';
import * as THREE from 'three';

export function BackgroundLayer() {
  const backgroundRef = useRef<THREE.Mesh>(null);
  
  // Create large background plane
  const geometry = useMemo(() => {
    return new PlaneGeometry(50, 30);
  }, []);
  
  // Create darkened, blurred material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uIntensity: { value: 0.3 } // Significantly darkened
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        
        void main() {
          // Create subtle circuit pattern
          float grid = abs(sin(vUv.x * 20.0)) * abs(sin(vUv.y * 20.0));
          grid = 1.0 - smoothstep(0.0, 0.1, grid);
          
          // Add subtle movement
          float movement = sin(uTime * 0.5 + vUv.x * 10.0) * 0.1;
          
          // Very dark base with minimal glow
          vec3 color = vec3(0.05, 0.1, 0.15) + vec3(0.0, 0.1, 0.2) * grid * uIntensity;
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, []);
  
  useFrame((state) => {
    if (backgroundRef.current) {
      // Update shader time
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });
  
  return (
    <mesh
      ref={backgroundRef}
      geometry={geometry}
      material={material}
      position={[0, 0, -20]}
      rotation={[0, 0, 0]}
    />
  );
}
