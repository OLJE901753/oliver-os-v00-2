import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { PlaneGeometry } from 'three';
import * as THREE from 'three';

interface HoloDataPanelProps {
  position: [number, number, number];
  type: 'code' | 'visualization' | 'profile' | 'deepfake';
  data: any;
  size?: [number, number];
  depth?: 'mid' | 'high';
}

export function HoloDataPanel({ 
  position, 
  type, 
  data, 
  size = [2, 1.5],
  depth = 'mid'
}: HoloDataPanelProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create panel geometry
  const geometry = useMemo(() => {
    return new PlaneGeometry(size[0], size[1]);
  }, [size]);
  
  // Create glassmorphism material
  const material = useMemo(() => {
    const isHighDepth = depth === 'high';
    
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(isHighDepth ? 0x00FFFF : 0x666666) },
        uOpacity: { value: isHighDepth ? 0.8 : 0.3 }
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
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        
        void main() {
          // Glassmorphism effect - frosted, semi-transparent
          float border = 1.0 - smoothstep(0.0, 0.05, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
          
          // Subtle inner glow
          float innerGlow = sin(vUv.x * 10.0 + uTime) * 0.1 + 0.9;
          
          // Frosted glass effect
          float noise = sin(vUv.x * 50.0) * sin(vUv.y * 50.0);
          noise = noise * 0.1 + 0.9;
          
          // Combine effects
          float finalEffect = border * innerGlow * noise;
          
          // Desaturated color for mid-depth, bright for high-depth
          vec3 finalColor = uColor * finalEffect;
          
          gl_FragColor = vec4(finalColor, finalEffect * uOpacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }, [depth]);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation for hologram effect
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      
      // Update shader time
      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });
  
  // Render different content based on type
  const renderContent = () => {
    const isHighDepth = depth === 'high';
    const textColor = isHighDepth ? 'text-cyan-300' : 'text-gray-400';
    const borderColor = isHighDepth ? 'border-cyan-400' : 'border-gray-600';
    
    switch (type) {
      case 'code':
        return (
          <div className={`w-full h-full p-4 ${borderColor} border rounded-lg`}>
            <div className={`${textColor} font-mono text-xs space-y-1`}>
              <div>// Neural Processing</div>
              <div>const thoughts = {data.lines || 0};</div>
              <div>function process() {'{'}</div>
              <div>  return analyze();</div>
              <div>{'}'}</div>
              <div>// Status: Active</div>
            </div>
          </div>
        );
      
      case 'visualization':
        return (
          <div className={`w-full h-full p-4 ${borderColor} border rounded-lg`}>
            <div className={`${textColor} font-mono text-xs`}>
              <div className="mb-2">AI STATUS</div>
              <div className="space-y-1">
                <div>CPU: {data.status || '85%'}</div>
                <div>Memory: 67%</div>
                <div>Network: Stable</div>
              </div>
            </div>
          </div>
        );
      
      case 'profile':
        return (
          <div className={`w-full h-full p-4 ${borderColor} border rounded-lg`}>
            <div className={`${textColor} font-mono text-xs`}>
              <div className="mb-2">PROFILES</div>
              <div className="space-y-1">
                <div>User 1: Active</div>
                <div>User 2: Idle</div>
                <div>User 3: Processing</div>
              </div>
            </div>
          </div>
        );
      
      case 'deepfake':
        return (
          <div className={`w-full h-full p-4 ${borderColor} border rounded-lg`}>
            <div className={`${textColor} font-mono text-xs`}>
              <div className="mb-2">DEEPFAKE</div>
              <div className="space-y-1">
                <div>Status: {data.active ? 'Active' : 'Inactive'}</div>
                <div>Quality: High</div>
                <div>Processing: Real-time</div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
    >
      <Html
        transform
        distanceFactor={1}
        position={[0, 0, 0.01]}
        style={{
          width: size[0] * 100,
          height: size[1] * 100,
          pointerEvents: 'none'
        }}
      >
        {renderContent()}
      </Html>
    </mesh>
  );
}