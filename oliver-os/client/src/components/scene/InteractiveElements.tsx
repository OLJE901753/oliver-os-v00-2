import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

export function InteractiveElements() {
  const elementsRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (elementsRef.current) {
      // Subtle floating animation
      elementsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });
  
  return (
    <group ref={elementsRef} position={[0, 0, 1]}>
      {/* Central Status Indicator - Circular HUD */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[2, 2.2, 64]} />
        <meshBasicMaterial
          color="#00FF00"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Status Health Indicator */}
      <Html
        position={[0, 0, 0.1]}
        transform
        distanceFactor={1}
        style={{
          width: 200,
          height: 200,
          pointerEvents: 'none'
        }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="text-green-400 font-mono text-lg font-bold">SYSTEM HEALTH</div>
            <div className="text-white font-mono text-2xl font-bold">98%</div>
            <div className="text-gray-300 font-mono text-xs">OPTIMAL</div>
          </div>
        </div>
      </Html>
      
      {/* Interactive Buttons */}
      <Html
        position={[-6, 3, 1]}
        transform
        distanceFactor={1}
        style={{
          width: 200,
          height: 100,
          pointerEvents: 'auto'
        }}
      >
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-sm font-bold rounded border-2 border-cyan-300 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/50">
            ACTIVATE AI
          </button>
          <button className="w-full px-4 py-2 bg-magenta-500 hover:bg-magenta-400 text-black font-mono text-sm font-bold rounded border-2 border-magenta-300 transition-all duration-200 hover:shadow-lg hover:shadow-magenta-500/50">
            DEEPFAKE MODE
          </button>
        </div>
      </Html>
      
      {/* Data Stream Controls */}
      <Html
        position={[6, 3, 1]}
        transform
        distanceFactor={1}
        style={{
          width: 200,
          height: 100,
          pointerEvents: 'auto'
        }}
      >
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-mono text-sm font-bold rounded border-2 border-green-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-500/50">
            START STREAM
          </button>
          <button className="w-full px-4 py-2 bg-red-500 hover:bg-red-400 text-black font-mono text-sm font-bold rounded border-2 border-red-300 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/50">
            EMERGENCY STOP
          </button>
        </div>
      </Html>
      
      {/* Status Indicators */}
      <Html
        position={[0, -4, 1]}
        transform
        distanceFactor={1}
        style={{
          width: 400,
          height: 100,
          pointerEvents: 'none'
        }}
      >
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <div className="text-cyan-400 font-mono text-sm font-bold">NEURAL NET</div>
            <div className="text-white font-mono text-lg">ONLINE</div>
          </div>
          <div className="text-center">
            <div className="text-magenta-400 font-mono text-sm font-bold">DATA FLOW</div>
            <div className="text-white font-mono text-lg">ACTIVE</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-mono text-sm font-bold">SECURITY</div>
            <div className="text-white font-mono text-lg">SECURE</div>
          </div>
        </div>
      </Html>
    </group>
  );
}
