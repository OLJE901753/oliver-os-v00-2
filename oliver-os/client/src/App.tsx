import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { Suspense } from 'react';
import { CentralFigure } from './components/scene/CentralFigure';
import { HoloDataPanel } from './components/scene/HoloDataPanel';
import { RoboticHands } from './components/scene/RoboticHands';
import { Environment } from './components/scene/Environment';
import { BackgroundLayer } from './components/scene/BackgroundLayer';
import { InteractiveElements } from './components/scene/InteractiveElements';
import { useOliverOSStore } from './state/useOliverOSStore';
import './styles/index.css';

function Scene() {
  const { realTimeThoughtCount, agentStatus } = useOliverOSStore();

  return (
    <>
      {/* Background Layer (Lowest Z-Depth) - Darkened, blurred */}
      <BackgroundLayer />
      
      {/* Environment and Lighting */}
      <Environment />
      
      {/* Central Figure - Soft ambient light source only */}
      <CentralFigure />
      
      {/* Non-Interactive Elements (Mid Z-Depth) - Glassmorphism */}
      <HoloDataPanel 
        position={[-8, 2, 2]} 
        type="code" 
        data={{ lines: realTimeThoughtCount }}
        depth="mid"
      />
      <HoloDataPanel 
        position={[8, 2, 2]} 
        type="visualization" 
        data={{ status: agentStatus }}
        depth="mid"
      />
      <HoloDataPanel 
        position={[-8, -2, 2]} 
        type="profile" 
        data={{ profiles: 3 }}
        depth="mid"
      />
      <HoloDataPanel 
        position={[8, -2, 2]} 
        type="deepfake" 
        data={{ active: true }}
        depth="mid"
      />
      
      {/* Robotic Hands - Foreground elements */}
      <RoboticHands />
      
      {/* Interactive Elements (Highest Z-Depth) - Bright, saturated */}
      <InteractiveElements />
    </>
  );
}

function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
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
        
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        
        {/* Post-Processing Effects - Minimal bloom for accessibility */}
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.1}
            mipmapBlur={true}
          />
          <ChromaticAberration
            offset={[0.001, 0.001]}
          />
        </EffectComposer>
      </Canvas>
      
      {/* UI Overlay - High contrast, functional */}
      <div className="absolute top-4 left-4 text-cyan-300 font-mono text-sm">
        <div className="text-white font-semibold">OLIVER-OS V00.2</div>
        <div className="text-gray-400 text-xs">Neural Interface Active</div>
      </div>
      
      <div className="absolute top-4 right-4 text-magenta-300 font-mono text-sm">
        <div className="text-white font-semibold">SYSTEM STATUS</div>
        <div className="text-gray-400 text-xs">Connection: Stable</div>
      </div>
      
      {/* Interactive Controls */}
      <div className="absolute bottom-4 left-4 text-green-300 font-mono text-xs">
        <div className="text-white">WASD: Move | Mouse: Look | Scroll: Zoom</div>
      </div>
    </div>
  );
}

export default App;