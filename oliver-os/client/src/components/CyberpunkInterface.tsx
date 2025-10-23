import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import { CustomBrain } from './CustomBrain';
import { RoboticHands } from './RoboticHands';
import { CurvedScreens } from './CurvedScreens';
import { HolographicLines } from './HolographicLines';
import { WarpBackground } from './WarpBackground';

export function CyberpunkInterface() {
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <Canvas 
        camera={{ 
          position: [0, 0, 8], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        {/* True black background */}
        <color attach="background" args={['#000000']} />
        
        {/* Advanced Lighting Setup */}
        <ambientLight intensity={0.1} color="#001122" />
        
        {/* Main directional light */}
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          color="#FFFFFF"
          castShadow
        />
        
        {/* Vibrant neon colored lights */}
        <pointLight
          position={[-5, 5, 5]}
          intensity={2.0}
          color="#00FFFF"
          distance={25}
        />
        <pointLight
          position={[5, 5, 5]}
          intensity={2.0}
          color="#FF00FF"
          distance={25}
        />
        <pointLight
          position={[0, -5, 5]}
          intensity={1.5}
          color="#00FF00"
          distance={20}
        />
        
        {/* Additional rim lighting */}
        <directionalLight
          position={[-10, -10, -10]}
          intensity={0.6}
          color="#00FFFF"
        />
        <directionalLight
          position={[10, -10, -10]}
          intensity={0.6}
          color="#FF00FF"
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#000011', 5, 30]} />

        <Suspense fallback={null}>
          {/* Central Brain */}
          <CustomBrain />
          
          {/* Robotic Interface */}
          <RoboticHands />
          
          {/* Curved Holographic Screens */}
          <CurvedScreens />
          
          {/* Holographic Lines Network */}
          <HolographicLines />
          
          {/* Warp Background Effect */}
          <WarpBackground />
        </Suspense>

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={30}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      </Canvas>
      
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 text-cyan-400 font-mono text-sm">
        <div className="glow-cyan">NEURAL INTERFACE ACTIVE</div>
        <div className="text-xs opacity-70">System Status: ONLINE</div>
      </div>
      
      <div className="absolute top-4 right-4 text-magenta-400 font-mono text-sm">
        <div className="glow-magenta">CYBERPUNK OS v2.0</div>
        <div className="text-xs opacity-70">Connection: STABLE</div>
      </div>
      
      <div className="absolute bottom-4 left-4 text-green-400 font-mono text-xs">
        <div>WASD: Move | Mouse: Look | Scroll: Zoom</div>
      </div>
    </div>
  );
}