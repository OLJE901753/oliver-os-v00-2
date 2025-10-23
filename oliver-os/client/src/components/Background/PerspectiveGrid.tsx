import { Canvas } from '@react-three/fiber';
import { Grid } from '@react-three/drei';

export function PerspectiveGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#00FFFF" />
        
        {/* Perspective grid converging to center */}
        <Grid
          position={[0, 0, -5]}
          args={[50, 50]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#00FFFF"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#FF00FF"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
        />
      </Canvas>
    </div>
  );
}
