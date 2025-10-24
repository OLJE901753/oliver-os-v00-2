import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { InteractiveCanvas } from './layered-objects/InteractiveCanvas'
import { objectRegistry } from '../utils/objectRegistry'
import { Brain, Settings, Eye, EyeOff } from 'lucide-react'

const SecondBrainApp: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [showLayeredBackground, setShowLayeredBackground] = useState(true)
  const [devMode, setDevMode] = useState(false) // Start with dev mode OFF
  
  // Container positions state
  const [containerPositions, setContainerPositions] = useState({
    controls: { top: 16, left: 16 },
    head: { top: '50%', left: '50%' }
  })
  
  // Handle container drag
  const handleContainerDrag = (containerType: 'controls' | 'head', event: React.DragEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const newPosition = {
      top: event.clientY - rect.height / 2,
      left: event.clientX - rect.width / 2
    }
    
    setContainerPositions(prev => ({
      ...prev,
      [containerType]: newPosition
    }))
  }

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      // Debug: Log object registry
      
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIsInitializing(false)
    }

    initializeApp()
  }, [])

  // Show loading screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative mb-8"
          >
            <Brain className="w-16 h-16 text-neon-400 glow-neon mx-auto" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-neon-400/20 rounded-full blur-xl"
            />
          </motion.div>
          <h2 className="text-2xl font-orbitron font-bold gradient-text mb-4">
            Initializing Brain Core...
          </h2>
          <div className="w-64 h-1 bg-black/20 rounded-full overflow-hidden mx-auto">
            <motion.div
              className="h-full bg-gradient-to-r from-neon-500 to-electric-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen bg-background relative overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Layered Background Canvas */}
      {showLayeredBackground && (
        <div className="absolute inset-0 z-0">
          <InteractiveCanvas
            config={objectRegistry.canvas}
            registry={objectRegistry}
            devMode={devMode}
            className="w-full h-full"
            onDevModeToggle={() => setDevMode(!devMode)}
          />
        </div>
      )}
      
      
      {/* Debug Controls - Only show when dev mode is ON */}
      {devMode && (
        <div 
          className="absolute z-[9999] glass-card p-4 rounded-lg cursor-move"
          style={{
            top: containerPositions.controls.top,
            left: containerPositions.controls.left
          }}
          draggable="true"
          onDragEnd={(e) => handleContainerDrag('controls', e)}
        >
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showLayeredBackground}
                onChange={(e) => setShowLayeredBackground(e.target.checked)}
                className="rounded"
                style={{
                  backgroundColor: 'rgba(0, 212, 255, 0.9)',
                  borderColor: 'rgba(0, 212, 255, 0.9)',
                  color: 'white'
                }}
              />
              <span style={{ color: 'white' }}>Show</span>
            </label>
          </div>
        </div>
      )}
      
      {/* Debug Info Overlay - Positioned on top of brain core */}
      {devMode && (
        <div 
          className="absolute z-[9999] bg-black/80 text-white p-2 rounded text-xs font-mono cursor-move"
          style={{
            top: containerPositions.head.top,
            left: containerPositions.head.left,
            transform: 'translate(-50%, -50%)'
          }}
          draggable="true"
          onDragEnd={(e) => handleContainerDrag('head', e)}
        >
          <div>Background: {objectRegistry.canvas.background.image ? 'Image' : 'Color'}</div>
        </div>
      )}
    </div>
  )
}

export default SecondBrainApp