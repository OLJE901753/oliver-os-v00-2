# Oliver-OS Visual Interface - Complete Implementation Prompt for Cursor AI

## 🎯 PROJECT OVERVIEW

You are building a cyberpunk-style visual operating system interface for Oliver-OS. This is a THREE-LAYER architecture with all objects cataloged and specified below.

**Tech Stack:**
- Backend: Express.js + Socket.io (already running on port 3000)
- Frontend: React + TypeScript + Vite
- 3D/Canvas: Three.js + @react-three/fiber
- Animations: Framer Motion
- State: Zustand
- Styling: Tailwind CSS
- Package Manager: pnpm

**Project Location:** `oliver-os/client/` (frontend) + `oliver-os/src/` (backend)

---

## 📐 COORDINATE SYSTEM & LAYOUT

**Canvas Dimensions:** 1920x1080 (16:9 aspect ratio)
**Grid System:** 5x5 relative grid for positioning (A-E rows, 1-5 columns)
**Coordinate Conversion:**
- A (row) = 0-216px (top)
- B (row) = 216-432px
- C (row) = 432-648px (middle)
- D (row) = 648-864px
- E (row) = 864-1080px (bottom)
- 1 (col) = 0-384px (left)
- 2 (col) = 384-768px
- 3 (col) = 768-1152px (center)
- 4 (col) = 1152-1536px
- 5 (col) = 1536-1920px (right)

**Z-Index Layers:**
- Layer 0 (z: 0-10): Background elements
- Layer 1 (z: 10-50): Panels and screens
- Layer 2 (z: 50-80): Connection lines
- Layer 3 (z: 80-100): Central brain and focus objects
- Layer 4 (z: 100-120): UI overlay (keyboard/hands)

---

## 🎨 COLOR PALETTE

```typescript
const COLORS = {
  // Primary
  cyberCyan: '#00FFFF',
  cyberMagenta: '#FF00FF',
  cyberBlue: '#4A00FF',
  cyberPurple: '#B800FF',
  cyberGreen: '#00FF00',
  
  // Accents
  neonPink: '#FF1493',
  electricBlue: '#00D4FF',
  neonOrange: '#FF6600',
  
  // Background
  darkBase: '#000000',
  darkGradient: '#0A0A1A',
  panelDark: '#0D0D15',
  
  // UI
  textWhite: '#FFFFFF',
  textGray: '#CCCCCC',
  glowWhite: '#FFFFFF',
} as const;
```

---

## 🏗️ LAYER 1: BACKGROUND FOUNDATION

### 1.1 Background Canvas Component

**File:** `client/src/components/Background/BackgroundCanvas.tsx`

```typescript
import React from 'react';
import { CircuitPattern } from './CircuitPattern';
import { PerspectiveGrid } from './PerspectiveGrid';
import { AmbientParticles } from './AmbientParticles';

export function BackgroundCanvas() {
  return (
    <div className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
      {/* Panel Content */}
      <div className="p-4 h-full overflow-hidden">
        {object.type === 'panel' && data?.logs && (
          <div className="font-mono text-xs text-green-400 space-y-1">
            {data.logs.slice(-20).map((log: any, i: number) => (
              <div key={i} className="opacity-80 hover:opacity-100">
                [{log.timestamp}] {log.message}
              </div>
            ))}
          </div>
        )}
        
        {object.text && (
          <div 
            className="text-white text-2xl font-bold text-center flex items-center justify-center h-full"
            style={{ color: colors[0] }}
          >
            {object.text}
          </div>
        )}
      </div>
      
      {/* Scanline Effect */}
      {animations.idle.scanlines && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      )}
    </motion.div>
  );
}
```

### 3.4 Profile Component

**File:** `client/src/components/Objects/Profile.tsx`

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { VisualObject } from '@/types/visual';

interface ProfileProps {
  object: VisualObject;
  onClick: () => void;
}

export function Profile({ object, onClick }: ProfileProps) {
  const { position, size, colors } = object;
  
  return (
    <motion.div
      className="absolute border-2 rounded-lg overflow-hidden backdrop-blur-sm cursor-pointer"
      style={{
        left: position.x - size.width / 2,
        top: position.y - size.height / 2,
        width: size.width,
        height: size.height,
        borderColor: colors[0],
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        boxShadow: `0 0 20px ${colors[0]}`,
        zIndex: position.z,
      }}
      animate={{
        boxShadow: [
          `0 0 20px ${colors[0]}`,
          `0 0 35px ${colors[0]}`,
          `0 0 20px ${colors[0]}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
      }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
    >
      {/* SVG Profile Silhouette */}
      <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
        <defs>
          <linearGradient id={`gradient-${object.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            {colors.map((color, i) => (
              <stop key={i} offset={`${(i / (colors.length - 1)) * 100}%`} stopColor={color} />
            ))}
          </linearGradient>
          
          {/* Digital noise pattern */}
          <pattern id={`noise-${object.id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <rect width="1" height="1" fill={colors[0]} opacity="0.1" />
            <rect x="2" y="2" width="1" height="1" fill={colors[1] || colors[0]} opacity="0.1" />
          </pattern>
        </defs>
        
        {/* Profile outline */}
        <path
          d="M 20,80 Q 20,40 30,30 Q 35,20 45,15 Q 55,12 62,15 Q 70,20 75,30 Q 80,40 80,50 L 80,80 Z"
          fill={`url(#gradient-${object.id})`}
          stroke={colors[0]}
          strokeWidth="0.5"
        />
        
        {/* Digital grid overlay */}
        <rect width="100" height="100" fill={`url(#noise-${object.id})`} />
      </svg>
    </motion.div>
  );
}
```

### 3.5 Connection Lines System

**File:** `client/src/components/Connections/ConnectionLines.tsx`

```typescript
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { VisualObject } from '@/types/visual';

interface ConnectionLinesProps {
  objects: VisualObject[];
  centralObject: VisualObject;
}

export function ConnectionLines({ objects, centralObject }: ConnectionLinesProps) {
  const lines = useMemo(() => {
    return objects
      .filter(obj => obj.connections?.includes(centralObject.id))
      .map(obj => ({
        from: obj.position,
        to: centralObject.position,
        color: obj.colors[0],
        id: `${obj.id}-to-${centralObject.id}`,
      }));
  }, [objects, centralObject]);

  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 20 }}
      width="1920" 
      height="1080"
    >
      <defs>
        {lines.map(line => (
          <linearGradient key={`gradient-${line.id}`} id={`gradient-${line.id}`}>
            <stop offset="0%" stopColor={line.color} stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="100%" stopColor={centralObject.colors[0]} stopOpacity="0.8" />
          </linearGradient>
        ))}
      </defs>
      
      {lines.map(line => {
        const midX = (line.from.x + line.to.x) / 2;
        const midY = (line.from.y + line.to.y) / 2 - 100; // Curve upward
        
        return (
          <g key={line.id}>
            {/* Main line */}
            <motion.path
              d={`M ${line.from.x},${line.from.y} Q ${midX},${midY} ${line.to.x},${line.to.y}`}
              stroke={`url(#gradient-${line.id})`}
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                pathLength: { duration: 2, ease: 'easeInOut' },
                opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            
            {/* Animated particle */}
            <motion.circle
              r="3"
              fill={line.color}
              initial={{ offsetDistance: '0%' }}
              animate={{ offsetDistance: '100%' }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
              style={{
                offsetPath: `path('M ${line.from.x},${line.from.y} Q ${midX},${midY} ${line.to.x},${line.to.y}')`,
              }}
            >
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={`M ${line.from.x},${line.from.y} Q ${midX},${midY} ${line.to.x},${line.to.y}`}
              />
            </motion.circle>
          </g>
        );
      })}
    </svg>
  );
}
```

### 3.6 Main Canvas Orchestrator

**File:** `client/src/components/Canvas/MainCanvas.tsx`

```typescript
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BackgroundCanvas } from '../Background/BackgroundCanvas';
import { Brain } from '../Objects/Brain';
import { Panel } from '../Objects/Panel';
import { Profile } from '../Objects/Profile';
import { ConnectionLines } from '../Connections/ConnectionLines';
import { useOSStatus } from '@/hooks/useOSStatus';
import objectsConfig from '@/config/objects.json';
import { VisualObject } from '@/types/visual';

export function MainCanvas() {
  const [focusedObjectId, setFocusedObjectId] = useState<string>('CORE_AI_BRAIN');
  const { data: osData, isConnected } = useOSStatus();
  
  const objects = objectsConfig.objects as VisualObject[];
  const focusedObject = objects.find(obj => obj.id === focusedObjectId)!;
  const brainObject = objects.find(obj => obj.id === 'CORE_AI_BRAIN')!;

  const handleObjectClick = (objectId: string) => {
    const object = objects.find(obj => obj.id === objectId);
    if (object?.behavior.onClick === 'focus') {
      setFocusedObjectId(objectId);
    }
  };

  // Convert screen coordinates to Three.js coordinates
  const toThreeCoords = (x: number, y: number): [number, number, number] => {
    return [
      (x - 960) / 200,  // Center and scale
      -(y - 540) / 200, // Invert Y and scale
      0
    ];
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Layer */}
      <BackgroundCanvas />
      
      {/* 2D Objects Layer */}
      <div className="absolute inset-0" style={{ zIndex: 10 }}>
        {/* Connection Lines */}
        <ConnectionLines objects={objects} centralObject={focusedObject} />
        
        {/* Render all 2D objects */}
        {objects.map(obj => {
          if (!obj.enabled) return null;
          
          switch (obj.type) {
            case 'panel':
              return (
                <Panel
                  key={obj.id}
                  object={obj}
                  onClick={() => handleObjectClick(obj.id)}
                  data={osData}
                />
              );
            
            case 'profile':
              return (
                <Profile
                  key={obj.id}
                  object={obj}
                  onClick={() => handleObjectClick(obj.id)}
                />
              );
            
            case 'label':
              return (
                <div
                  key={obj.id}
                  className="absolute text-white font-bold text-center pointer-events-none"
                  style={{
                    left: obj.position.x - obj.size.width / 2,
                    top: obj.position.y - obj.size.height / 2,
                    width: obj.size.width,
                    height: obj.size.height,
                    color: obj.colors[0],
                    textShadow: `0 0 10px ${obj.colors[0]}`,
                    zIndex: obj.position.z,
                    fontSize: obj.size.width / 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {obj.text}
                </div>
              );
            
            default:
              return null;
          }
        })}
        
        {/* Connection Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2 text-white">
          <div 
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            style={{ boxShadow: `0 0 10px ${isConnected ? '#00ff00' : '#ff0000'}` }}
          />
          <span className="text-sm font-mono">
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
      
      {/* 3D Objects Layer */}
      <div className="absolute inset-0" style={{ zIndex: 50, pointerEvents: 'none' }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          
          {/* Brain Hub */}
          <Brain
            position={toThreeCoords(brainObject.position.x, brainObject.position.y)}
            focused={focusedObjectId === 'CORE_AI_BRAIN'}
            onClick={() => handleObjectClick('CORE_AI_BRAIN')}
            data={osData?.health}
          />
          
          {/* Optional: OrbitControls for debugging */}
          {/* <OrbitControls enableZoom={false} /> */}
        </Canvas>
      </div>
      
      {/* UI Overlay: Keyboard/Hands */}
      {(() => {
        const keyboardObj = objects.find(obj => obj.id === 'HMI_HANDS_KEYBOARD');
        if (!keyboardObj) return null;
        
        return (
          <div
            className="absolute"
            style={{
              left: keyboardObj.position.x - keyboardObj.size.width / 2,
              bottom: 1080 - keyboardObj.position.y - keyboardObj.size.height / 2,
              width: keyboardObj.size.width,
              height: keyboardObj.size.height,
              zIndex: 110,
            }}
          >
            <img 
              src="/assets/keyboard-hands.png" 
              alt="Robotic hands on keyboard"
              className="w-full h-full object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.5))' }}
            />
          </div>
        );
      })()}
    </div>
  );
}
```

### 3.7 WebSocket Hook

**File:** `client/src/hooks/useOSStatus.ts`

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SystemStatus {
  processes: any[];
  services: any[];
  health: {
    cpu: number;
    memory: number;
    uptime: number;
    status: string;
  };
  logs?: any[];
}

export function useOSStatus() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [data, setData] = useState<SystemStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io('http://localhost:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected to Oliver-OS');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('system:status', (status: SystemStatus) => {
      setData(status);
    });

    socketInstance.on('system:logs', (log: any) => {
      setData(prev => ({
        ...prev!,
        logs: [...(prev?.logs || []), log].slice(-50),
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { data, isConnected, socket };
}
```

---

## 🚀 IMPLEMENTATION STEPS FOR CURSOR

### Step 1: Initial Setup (Run these commands first)

```bash
# Navigate to oliver-os project
cd oliver-os

# Install backend dependencies
pnpm add socket.io concurrently tsx

# Create client directory
mkdir client
cd client

# Initialize Vite React TypeScript project
pnpm create vite . --template react-ts

# Install frontend dependencies
pnpm add three @react-three/fiber @react-three/drei
pnpm add framer-motion zustand socket.io-client axios
pnpm add lucide-react
pnpm add -D tailwindcss postcss autoprefixer @types/three

# Initialize Tailwind
npx tailwindcss init -p

# Return to root
cd ..
```

### Step 2: Create Configuration Files

**A. Update root `package.json` - Add these scripts:**
```json
{
  "scripts": {
    "dev": "concurrently -n \"SERVER,CLIENT\" -c \"blue,magenta\" \"pnpm dev:server\" \"pnpm dev:client\"",
    "dev:server": "tsx watch src/index.ts",
    "dev:client": "cd client && pnpm dev",
    "build": "pnpm build:client && pnpm build:server",
    "build:client": "cd client && pnpm build && cp -r client/dist/* src/public/",
    "build:server": "tsc"
  }
}
```

**B. Create `.env` in root:**
```env
NODE_ENV=development
PORT=3000
CLIENT_PORT=5173
WEBSOCKET_ENABLED=true
VISUAL_UPDATE_INTERVAL=1000
LOG_LEVEL=debug
```

**C. Create `client/vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**D. Update `client/tailwind.config.js`:**
```javascript
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cyber-cyan': '#00FFFF',
        'cyber-magenta': '#FF00FF',
        'cyber-blue': '#4A00FF',
        'cyber-purple': '#B800FF',
        'cyber-green': '#00FF00',
      },
    },
  },
  plugins: [],
};
```

### Step 3: Update Express Server

**File:** `src/index.ts` (Update existing file with Socket.io)

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

const app = express();
const httpServer = createServer(app);

// Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173',
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:5173' }));
app.use(express.json());

// Mock data functions (replace with real implementation)
const getSystemStatus = () => ({
  processes: [
    { id: '1', name: 'Visual Interface', status: 'running', cpu: 25, memory: 512 },
    { id: '2', name: 'BMAD Engine', status: 'running', cpu: 10, memory: 128 },
    { id: '3', name: 'System Monitor', status: 'running', cpu: 15, memory: 256 },
  ],
  services: [
    { id: 'deepfake', name: 'DeepFake Service', enabled: true, status: 'active' },
    { id: 'ai-core', name: 'AI Core', enabled: true, status: 'active' },
  ],
  health: {
    cpu: Math.random() * 100,
    memory: Math.random() * 100,
    uptime: Date.now(),
    status: 'healthy',
  },
});

// WebSocket handlers
io.on('connection', (socket) => {
  console.log('🎨 Visual interface connected:', socket.id);
  
  const statusInterval = setInterval(() => {
    socket.emit('system:status', getSystemStatus());
  }, parseInt(process.env.VISUAL_UPDATE_INTERVAL || '1000'));
  
  const logInterval = setInterval(() => {
    socket.emit('system:logs', {
      timestamp: new Date().toISOString(),
      level: ['info', 'warn', 'debug'][Math.floor(Math.random() * 3)],
      message: `System update: ${['Processing tasks', 'All systems operational', 'Monitoring performance'][Math.floor(Math.random() * 3)]}`,
    });
  }, 2000);
  
  socket.on('disconnect', () => {
    console.log('Visual interface disconnected');
    clearInterval(statusInterval);
    clearInterval(logInterval);
  });
});

// API Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', ...getSystemStatus().health }));
app.get('/api/processes', (req, res) => res.json({ processes: getSystemStatus().processes }));
app.get('/api/services', (req, res) => res.json({ services: getSystemStatus().services }));
app.get('/api/status', (req, res) => res.json(getSystemStatus()));

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Oliver-OS Visual Interface running on :${PORT}`);
  console.log(`📡 WebSocket server active`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🎨 Frontend dev server: http://localhost:5173`);
  }
});
```

### Step 4: Create Directory Structure

```bash
cd client/src

# Create directories
mkdir -p components/{Background,Objects,Connections,Canvas}
mkdir -p config
mkdir -p hooks
mkdir -p types
mkdir -p systems

# Create placeholder files (Cursor will fill these in)
touch components/Background/{BackgroundCanvas,CircuitPattern,PerspectiveGrid,AmbientParticles}.tsx
touch components/Objects/{Brain,Panel,Profile}.tsx
touch components/Connections/ConnectionLines.tsx
touch components/Canvas/MainCanvas.tsx
touch hooks/useOSStatus.ts
touch types/visual.ts
touch config/objects.json
```

### Step 5: Update Main App

**File:** `client/src/App.tsx`

```typescript
import React from 'react';
import { MainCanvas } from './components/Canvas/MainCanvas';
import './index.css';

function App() {
  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <MainCanvas />
    </div>
  );
}

export default App;
```

**File:** `client/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  background: #000;
  color: #fff;
  overflow: hidden;
}

@layer utilities {
  .glow-cyan {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
  }
  
  .glow-magenta {
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
  }
}
```

---

## ✅ VERIFICATION CHECKLIST

After implementation, verify each component:

### Backend
- [ ] Express server starts on port 3000
- [ ] Socket.io connects successfully
- [ ] `/api/health` returns JSON
- [ ] WebSocket emits `system:status` every second

### Frontend
- [ ] Vite dev server runs on port 5173
- [ ] Tailwind CSS loads correctly
- [ ] MainCanvas renders without errors
- [ ] Background gradient visible
- [ ] WebSocket connection indicator shows green

### Components
- [ ] Brain hub renders in center with cyan/magenta colors
- [ ] All panels render at correct positions
- [ ] Profile components show silhouettes
- [ ] Connection lines draw from objects to brain
- [ ] Animations are smooth (60fps)
- [ ] Click brain triggers focus animation

### Data Integration
- [ ] Real-time CPU/memory data displays
- [ ] Process count updates
- [ ] Logs scroll in code panel
- [ ] WebSocket reconnects on disconnect

---

## 🐛 DEBUGGING GUIDE

**If Backend Won't Start:**
```bash
# Check port 3000
netstat -ano | findstr :3000
# Kill if needed, then restart
pnpm dev:server
```

**If Frontend Won't Connect:**
```bash
# Check WebSocket in browser console
# Should see: ✅ WebSocket connected to Oliver-OS
# If not, verify CORS settings in src/index.ts
```

**If Objects Don't Render:**
```bash
# Verify objects.json path
# Check browser console for errors
# Ensure all imports are correct
```

**If Animations Lag:**
```typescript
// Reduce particle count in objects.json
// Set performanceMode: true in config
// Disable complex effects temporarily
```

---

## 🎯 CURSOR EXECUTION STRATEGY

### Phase 1: Foundation (Do First)
```
1. "Create all files in directory structure"
2. "Implement BackgroundCanvas.tsx with gradient and circuit pattern"
3. "Set up objects.json from the specification above"
4. "Create types/visual.ts with all TypeScript interfaces"
5. "Implement useOSStatus.ts WebSocket hook"
```

### Phase 2: Core Components
```
6. "Create Brain.tsx component with Three.js dual-hemisphere rendering"
7. "Implement Panel.tsx with all animation features"
8. "Create Profile.tsx with SVG silhouette rendering"
9. "Build ConnectionLines.tsx with animated bezier curves"
10. "Assemble MainCanvas.tsx to orchestrate all components"
```

### Phase 3: Integration
```
11. "Update App.tsx to render MainCanvas"
12. "Test WebSocket connection and data flow"
13. "Verify all objects render at correct positions"
14. "Test click interactions and focus transitions"
15. "Polish animations and effects"
```

---

## 🚀 FINAL DEPLOYMENT

```bash
# Development
pnpm dev  # Runs both server and client

# Production build
pnpm build
pnpm start

# Test
curl http://localhost:3000/api/health
# Open browser: http://localhost:5173 (dev) or http://localhost:3000 (prod)
```

---

**END OF SPECIFICATION**

**Version:** 2.0.0  
**Last Updated:** 2025-10-22  
**Status:** ✅ COMPLETE - READY FOR CURSOR AI IMPLEMENTATION  
**Project:** Oliver-OS Visual Interface  
**Philosophy:** *"For the honor, not the glory—by the people, for the people."*

---

## 📝 QUICK START FOR CURSOR

**Copy this entire document into Cursor and say:**

*"Read this complete specification and implement the Oliver-OS Visual Interface. Start with Step 1 setup commands, then create all configuration files, then implement components in the order specified in Phase 1, 2, and 3. Follow the object definitions from objects.json exactly. Test after each phase."*/* Gradient Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #000000 0%, #0A0A1A 100%)'
        }}
      />
      
      {/* Circuit Pattern Overlay */}
      <CircuitPattern />
      
      {/* Perspective Grid */}
      <PerspectiveGrid />
      
      {/* Ambient Particles */}
      <AmbientParticles count={150} />
    </div>
  );
}
```

**Requirements:**
- Create CircuitPattern.tsx: SVG pattern overlay with 10% opacity, cyan color
- Create PerspectiveGrid.tsx: Three.js floor grid with converging cyan/magenta lines to center
- Create AmbientParticles.tsx: 150 floating particles, random sizes (1-3px), slow drift animation
- All components must maintain 60fps performance

---

## 🗂️ LAYER 2: OBJECT STRUCTURE & CATALOG

### 2.1 Complete Objects Configuration

**File:** `client/src/config/objects.json`

```json
{
  "version": "1.0.0",
  "canvas": {
    "width": 1920,
    "height": 1080,
    "aspectRatio": "16:9"
  },
  "groups": {
    "central_hub": {
      "objects": ["CORE_AI_BRAIN"],
      "priority": 100,
      "behavior": "always_visible"
    },
    "left_panels": {
      "objects": ["SCREEN_LOG_L", "VIS_PROFILE_1_L", "VIS_PROFILE_2_L", "VIS_PROFILE_3_L", "SCREEN_STATUS_L", "AI_LOGO_L"],
      "priority": 50,
      "behavior": "independent",
      "groupAnimation": "stagger_fade"
    },
    "right_panels": {
      "objects": ["SCREEN_DATA_R", "SCREEN_DEEPFAKE_R1", "SCREEN_DEEPFAKE_R2", "ICON_UI_R", "AI_LOGO_R", "ICON_GEAR_R", "VIS_WAVEFORM_R"],
      "priority": 50,
      "behavior": "independent"
    },
    "top_cluster": {
      "objects": ["WIZARD_PANEL_TOP"],
      "priority": 40,
      "behavior": "connected_to_brain"
    },
    "ui_overlay": {
      "objects": ["HMI_HANDS_KEYBOARD"],
      "priority": 120,
      "behavior": "static"
    },
    "connections": {
      "objects": ["NETWORK_CIRCUITS"],
      "priority": 30,
      "behavior": "dynamic"
    }
  },
  "objects": [
    {
      "id": "CORE_AI_BRAIN",
      "name": "Neural Core Brain",
      "type": "hub",
      "group": "central_hub",
      "position": { "x": 960, "y": 405, "z": 90 },
      "size": { "width": 280, "height": 320 },
      "gridPosition": "G3",
      "colors": ["#00FFFF", "#FF00FF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "pulse": { "speed": 3, "intensity": 0.4 },
          "particles": { "count": 80, "speed": 1.5 },
          "glow": { "radius": 40, "color": "#00FFFF" }
        },
        "hover": {
          "scale": 1.05,
          "glow": { "radius": 60, "intensity": 0.9 }
        },
        "focused": {
          "scale": 1.5,
          "rotation": { "speed": 2, "axis": "y" }
        }
      },
      "behavior": {
        "onClick": "focus",
        "onHover": "glow",
        "draggable": false
      },
      "data": {
        "source": "/api/status",
        "updateInterval": 1000,
        "displays": ["cpu", "memory", "processes"]
      },
      "connections": ["VIS_PROFILE_1_L", "VIS_PROFILE_2_L", "SCREEN_LOG_L", "SCREEN_DATA_R", "WIZARD_PANEL_TOP"],
      "description": "Translucent brain with dual-hemisphere structure (cyan left, magenta right). Largest central element. Focal point of entire interface."
    },
    {
      "id": "HMI_HANDS_KEYBOARD",
      "name": "Robotic Hands & Keyboard",
      "type": "ui_overlay",
      "group": "ui_overlay",
      "position": { "x": 960, "y": 950, "z": 110 },
      "size": { "width": 768, "height": 260 },
      "gridPosition": "E2-E4",
      "colors": ["#FFFFFF", "#CCCCCC"],
      "enabled": true,
      "interactive": false,
      "animations": {
        "idle": {
          "typing": { "speed": 2, "fingers": "random" },
          "glow": { "keys": true, "color": "#00FFFF" }
        }
      },
      "behavior": {
        "onClick": "none",
        "static": true
      },
      "description": "White keyboard with glowing cyan-backlit keys. Metallic robotic hands with segmented fingers. Purple glow joints. Spans 40% of image width."
    },
    {
      "id": "NETWORK_CIRCUITS",
      "name": "Connection Circuit Lines",
      "type": "connection_system",
      "group": "connections",
      "position": { "x": 960, "y": 540, "z": 20 },
      "size": { "width": 1920, "height": 1080 },
      "gridPosition": "Entire Canvas",
      "colors": ["#00FFFF", "#FF00FF", "#FFFFFF"],
      "enabled": true,
      "interactive": false,
      "animations": {
        "idle": {
          "flow": { "speed": 2, "direction": "to_brain" },
          "pulse": { "speed": 1.5, "intensity": 0.3 },
          "particles": { "count": 50, "speed": 2 }
        }
      },
      "behavior": {
        "dynamic": true,
        "recalculateOnFocus": true
      },
      "connections": {
        "from": "all_objects",
        "to": "CORE_AI_BRAIN",
        "style": "bezier_curves",
        "width": 2,
        "animated": true
      },
      "description": "Glowing lines connecting all elements to central brain. Blue/Purple/White colors. Animated particle flow along paths."
    },
    {
      "id": "SCREEN_LOG_L",
      "name": "Code Terminal Left",
      "type": "panel",
      "group": "left_panels",
      "position": { "x": 138, "y": 150, "z": 40 },
      "size": { "width": 276, "height": 432 },
      "gridPosition": "A1-C1",
      "colors": ["#00FF00", "#001100"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "scanlines": true,
          "textScroll": { "speed": 1, "direction": "up" }
        },
        "hover": {
          "glow": { "color": "#00FF00", "intensity": 0.6 }
        }
      },
      "behavior": {
        "onClick": "focus",
        "onHover": "glow"
      },
      "data": {
        "source": "websocket:system:logs",
        "maxLines": 20,
        "fontSize": "12px",
        "fontFamily": "monospace"
      },
      "description": "Tallest screen element. Dense white/green code text. Purple button/menu in top-right corner. Cyan border glow."
    },
    {
      "id": "VIS_PROFILE_1_L",
      "name": "Large Profile Visualization Left",
      "type": "profile",
      "group": "left_panels",
      "position": { "x": 150, "y": 480, "z": 45 },
      "size": { "width": 240, "height": 160 },
      "gridPosition": "C1-D1",
      "colors": ["#00FFFF", "#FF00FF", "#00FF00"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "pulse": { "speed": 2, "intensity": 0.3 },
          "digitalNoise": { "speed": 1, "intensity": 0.2 }
        },
        "hover": {
          "scale": 1.03,
          "glow": { "color": "#00FFFF" }
        }
      },
      "behavior": {
        "onClick": "focus",
        "onHover": "glow"
      },
      "connections": ["CORE_AI_BRAIN"],
      "description": "Wide landscape screen. Colorful (purple/green/cyan) digital human head profile. Pixelated/grid effect. Cyan border."
    },
    {
      "id": "VIS_PROFILE_2_L",
      "name": "Medium Profile Left",
      "type": "profile",
      "group": "left_panels",
      "position": { "x": 456, "y": 480, "z": 45 },
      "size": { "width": 180, "height": 160 },
      "gridPosition": "C2",
      "colors": ["#00FFFF", "#FFFFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "glow": { "color": "#00FFFF", "intensity": 0.4 }
        }
      },
      "behavior": {
        "onClick": "focus",
        "onHover": "glow"
      },
      "connections": ["CORE_AI_BRAIN"],
      "description": "Vertical portrait orientation. Simple shadowed human profile with code overlay. Cyan border."
    },
    {
      "id": "VIS_PROFILE_3_L",
      "name": "Small Profile Left",
      "type": "profile",
      "group": "left_panels",
      "position": { "x": 600, "y": 480, "z": 45 },
      "size": { "width": 140, "height": 160 },
      "gridPosition": "C2",
      "colors": ["#00FFFF", "#FFFFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "glow": { "color": "#00FFFF", "intensity": 0.3 }
        }
      },
      "behavior": {
        "onClick": "focus",
        "onHover": "glow"
      },
      "connections": ["CORE_AI_BRAIN"],
      "description": "Smallest profile. Simple silhouette. Cyan border."
    },
    {
      "id": "SCREEN_STATUS_L",
      "name": "Status Screens Bottom Left",
      "type": "status_grid",
      "group": "left_panels",
      "position": { "x": 150, "y": 750, "z": 40 },
      "size": { "width": 200, "height": 100 },
      "gridPosition": "D1-E1",
      "colors": ["#00FFFF", "#FF00FF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "orbPulse": { "speed": 2 },
          "rotate": { "speed": 0.5 }
        }
      },
      "behavior": {
        "onClick": "toggle_detail"
      },
      "description": "Group of 4 small square screens. Geometric patterns and glowing orbs. Cyan borders."
    },
    {
      "id": "AI_LOGO_L",
      "name": "AI Label Left",
      "type": "label",
      "group": "left_panels",
      "position": { "x": 580, "y": 380, "z": 50 },
      "size": { "width": 60, "height": 60 },
      "gridPosition": "C3",
      "colors": ["#FFFFFF"],
      "enabled": true,
      "interactive": false,
      "animations": {
        "idle": {
          "glow": { "color": "#00FFFF", "intensity": 0.5 }
        }
      },
      "behavior": {
        "onClick": "none"
      },
      "text": "AI",
      "description": "Small square. White 'AI' text on dark background. Cyan glow."
    },
    {
      "id": "WIZARD_PANEL_TOP",
      "name": "Top Cluster Panel",
      "type": "cluster",
      "group": "top_cluster",
      "position": { "x": 600, "y": 120, "z": 45 },
      "size": { "width": 280, "height": 180 },
      "gridPosition": "A2-B3",
      "colors": ["#FFFFFF", "#00FFFF", "#FF00FF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "float": { "speed": 1.5, "amplitude": 10 },
          "iconRotate": { "speed": 0.5 }
        }
      },
      "behavior": {
        "onClick": "focus"
      },
      "connections": ["CORE_AI_BRAIN"],
      "elements": [
        { "type": "icon", "shape": "cloud", "color": "#FFFFFF" },
        { "type": "icon", "shape": "crescent", "color": "#00FFFF" },
        { "type": "text", "content": "RULE-BASED\\nCOMPUTING", "color": "#FFFFFF" }
      ],
      "description": "Cluster of small connected components. Cloud icon, crescent, various abstract symbols. Contains 'RULE-BASED COMPUTING' text."
    },
    {
      "id": "SCREEN_DATA_R",
      "name": "Data Screen Right",
      "type": "panel",
      "group": "right_panels",
      "position": { "x": 1670, "y": 150, "z": 40 },
      "size": { "width": 250, "height": 432 },
      "gridPosition": "A5-C5",
      "colors": ["#00FFFF", "#FF00FF", "#001122"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "scanlines": true,
          "dataFlow": { "speed": 2 }
        },
        "hover": {
          "glow": { "color": "#00FFFF" }
        }
      },
      "behavior": {
        "onClick": "focus"
      },
      "data": {
        "source": "/api/processes",
        "visualization": "circular_abstract"
      },
      "connections": ["CORE_AI_BRAIN"],
      "description": "Tallest right screen. Code snippets at top. Large abstract glowing circular visualization in center. Purple/cyan colors."
    },
    {
      "id": "SCREEN_DEEPFAKE_R1",
      "name": "Deepfake Panel Upper Right",
      "type": "panel",
      "group": "right_panels",
      "position": { "x": 1280, "y": 280, "z": 40 },
      "size": { "width": 180, "height": 180 },
      "gridPosition": "C4",
      "colors": ["#FF00FF", "#00FFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "pulse": { "speed": 2.5 },
          "visualNoise": { "intensity": 0.3 }
        }
      },
      "behavior": {
        "onClick": "focus"
      },
      "text": "DEEPFAKE",
      "description": "Medium square. Colorful abstract visualization. 'DEEPFAKE' text label. Purple border."
    },
    {
      "id": "SCREEN_DEEPFAKE_R2",
      "name": "Deepfake Panel Lower Right",
      "type": "panel",
      "group": "right_panels",
      "position": { "x": 1280, "y": 470, "z": 40 },
      "size": { "width": 160, "height": 160 },
      "gridPosition": "C4-D4",
      "colors": ["#FF00FF", "#FFFFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "circularPattern": { "speed": 1 }
        }
      },
      "behavior": {
        "onClick": "focus"
      },
      "text": "DEAPFAKE",
      "description": "Slightly smaller square. Simple circular pattern. 'DEAPFAKE' text. Purple glow."
    },
    {
      "id": "ICON_UI_R",
      "name": "UI Icon Cluster Right",
      "type": "icon_cluster",
      "group": "right_panels",
      "position": { "x": 1480, "y": 350, "z": 50 },
      "size": { "width": 80, "height": 120 },
      "gridPosition": "C4",
      "colors": ["#00FFFF", "#FF00FF", "#FFFFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "iconPulse": { "stagger": true }
        }
      },
      "behavior": {
        "onClick": "menu"
      },
      "icons": ["circular_stack", "speaker", "arrow", "target"],
      "description": "Cluster of small icons. Circular button stack, speaker/audio icon, utility symbols."
    },
    {
      "id": "AI_LOGO_R",
      "name": "AI Label Right",
      "type": "label",
      "group": "right_panels",
      "position": { "x": 1350, "y": 480, "z": 50 },
      "size": { "width": 60, "height": 60 },
      "gridPosition": "D4",
      "colors": ["#FFFFFF"],
      "enabled": true,
      "interactive": false,
      "animations": {
        "idle": {
          "glow": { "color": "#FF00FF" }
        }
      },
      "text": "AI",
      "description": "Small square. White 'AI' text. Magenta glow."
    },
    {
      "id": "ICON_GEAR_R",
      "name": "Gear Icon Bottom Right",
      "type": "icon",
      "group": "right_panels",
      "position": { "x": 1480, "y": 820, "z": 50 },
      "size": { "width": 60, "height": 60 },
      "gridPosition": "E4",
      "colors": ["#00FFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "rotate": { "speed": 1 }
        },
        "hover": {
          "rotateSpeed": 3,
          "glow": { "intensity": 0.8 }
        }
      },
      "behavior": {
        "onClick": "settings"
      },
      "description": "Circular gear/cog icon. Cyan color. Symbolizes process or settings."
    },
    {
      "id": "VIS_WAVEFORM_R",
      "name": "Waveform Visualization Bottom Right",
      "type": "visualization",
      "group": "right_panels",
      "position": { "x": 1780, "y": 900, "z": 40 },
      "size": { "width": 120, "height": 140 },
      "gridPosition": "E5",
      "colors": ["#FF00FF", "#00FFFF"],
      "enabled": true,
      "interactive": true,
      "animations": {
        "idle": {
          "barAnimate": { "speed": 3, "reactive": true }
        }
      },
      "behavior": {
        "onClick": "focus"
      },
      "data": {
        "source": "websocket:audio:waveform",
        "type": "bar_chart"
      },
      "description": "Vertical bar chart. Purple/cyan bars. Represents audio or data frequency/magnitude."
    }
  ]
}
```

---

## 🎭 LAYER 3: COMPONENT IMPLEMENTATION

### 3.1 TypeScript Interfaces

**File:** `client/src/types/visual.ts`

```typescript
export type ObjectType = 
  | 'hub' 
  | 'panel' 
  | 'profile' 
  | 'visualization' 
  | 'label' 
  | 'cluster'
  | 'icon'
  | 'icon_cluster'
  | 'status_grid'
  | 'ui_overlay'
  | 'connection_system';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface AnimationConfig {
  pulse?: { speed: number; intensity: number };
  glow?: { color?: string; radius?: number; intensity?: number };
  scale?: number;
  rotation?: { speed: number; axis: 'x' | 'y' | 'z' };
  particles?: { count: number; speed: number };
  float?: { speed: number; amplitude: number };
  [key: string]: any;
}

export interface BehaviorConfig {
  onClick: 'focus' | 'link' | 'toggle' | 'menu' | 'settings' | 'execute' | 'none';
  onHover?: 'glow' | 'scale' | 'info' | 'none';
  draggable?: boolean;
  static?: boolean;
  dynamic?: boolean;
}

export interface DataConfig {
  source?: string;
  updateInterval?: number;
  displays?: string[];
  maxLines?: number;
  fontSize?: string;
  fontFamily?: string;
  visualization?: string;
  type?: string;
}

export interface VisualObject {
  id: string;
  name: string;
  type: ObjectType;
  group: string;
  position: Position;
  size: Size;
  gridPosition: string;
  colors: string[];
  enabled: boolean;
  interactive: boolean;
  animations: {
    idle: AnimationConfig;
    hover?: AnimationConfig;
    focused?: AnimationConfig;
  };
  behavior: BehaviorConfig;
  data?: DataConfig;
  connections?: string[];
  description: string;
  text?: string;
  elements?: any[];
  icons?: string[];
}

export interface ObjectsConfig {
  version: string;
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  groups: Record<string, {
    objects: string[];
    priority: number;
    behavior: string;
    groupAnimation?: string;
  }>;
  objects: VisualObject[];
}
```

### 3.2 Core Component: Brain Hub

**File:** `client/src/components/Objects/Brain.tsx`

```typescript
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface BrainProps {
  position: [number, number, number];
  focused: boolean;
  onClick: () => void;
  data?: {
    cpu: number;
    memory: number;
    processes: number;
  };
}

export function Brain({ position, focused, onClick, data }: BrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    time.current += delta;
    
    // Pulse animation
    const scale = 1 + Math.sin(time.current * 3) * 0.05;
    meshRef.current.scale.setScalar(focused ? 1.5 : scale);
    
    // Rotation when focused
    if (focused) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Left Hemisphere - Cyan */}
      <Sphere ref={meshRef} args={[1, 64, 64]} position={[-0.5, 0, 0]}>
        <MeshDistortMaterial
          color="#00FFFF"
          transparent
          opacity={0.8}
          distort={0.3}
          speed={2}
          emissive="#00FFFF"
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Right Hemisphere - Magenta */}
      <Sphere args={[1, 64, 64]} position={[0.5, 0, 0]}>
        <MeshDistortMaterial
          color="#FF00FF"
          transparent
          opacity={0.8}
          distort={0.3}
          speed={2}
          emissive="#FF00FF"
          emissiveIntensity={0.5}
        />
      </Sphere>
      
      {/* Glow Effect */}
      <pointLight 
        color={focused ? "#FFFFFF" : "#00FFFF"} 
        intensity={focused ? 2 : 1} 
        distance={5} 
      />
    </group>
  );
}
```

### 3.3 Panel Component Template

**File:** `client/src/components/Objects/Panel.tsx`

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { VisualObject } from '@/types/visual';

interface PanelProps {
  object: VisualObject;
  onClick: () => void;
  data?: any;
}

export function Panel({ object, onClick, data }: PanelProps) {
  const { position, size, colors, animations } = object;
  
  return (
    <motion.div
      className="absolute border-2 rounded-lg overflow-hidden backdrop-blur-sm"
      style={{
        left: position.x - size.width / 2,
        top: position.y - size.height / 2,
        width: size.width,
        height: size.height,
        borderColor: colors[0],
        backgroundColor: colors[1] || 'rgba(0, 0, 0, 0.5)',
        boxShadow: `0 0 20px ${colors[0]}`,
        zIndex: position.z,
      }}
      animate={{
        boxShadow: [
          `0 0 20px ${colors[0]}`,
          `0 0 40px ${colors[0]}`,
          `0 0 20px ${colors[0]}`,
        ],
      }}
      transition={{
        duration: animations.idle.pulse?.speed || 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      onClick={onClick}
      whileHover={{
        scale: 1.03,
        boxShadow: `0 0 50px ${colors[0]}`,
      }}
    >
      {