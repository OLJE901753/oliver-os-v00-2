import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { InteractiveCanvas } from './layered-objects/InteractiveCanvas'
import { objectRegistry } from '../utils/objectRegistry'
import { Brain, Settings, Eye, EyeOff } from 'lucide-react'

const SecondBrainApp: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true)
  const [showLayeredBackground, setShowLayeredBackground] = useState(true)
  const [devMode, setDevMode] = useState(false) // Start with dev mode OFF for clean view

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      // Debug: Log object registry
      console.log('🧠 SecondBrainApp: Initializing Brain Core System');
      console.log('Object Registry:', objectRegistry)
      console.log('Objects count:', objectRegistry.objects.length)
      console.log('Canvas config:', objectRegistry.canvas)
      
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
          />
        </div>
      )}
      
      {/* Hidden Dev Mode Toggle - Press 'D' key to toggle */}
      <div 
        className="absolute top-4 left-4 z-20 w-8 h-8 bg-transparent cursor-pointer"
        onClick={() => setDevMode(!devMode)}
        title="Click to toggle dev mode (or press 'D' key)"
      />
      
      {/* Debug Controls */}
      {devMode && (
        <div className="absolute top-4 left-4 z-20 glass-card p-4 rounded-lg">
          <div className="flex items-center space-x-4 mb-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showLayeredBackground}
                onChange={(e) => setShowLayeredBackground(e.target.checked)}
                className="rounded"
              />
              <span>Show Brain Core</span>
            </label>
            <button
              onClick={() => setDevMode(false)}
              className="text-xs px-2 py-1 bg-neon-500/20 border border-neon-500/30 rounded"
            >
              Hide Debug
            </button>
          </div>
          <div className="text-xs text-gray-400">
            Objects: {objectRegistry.objects.length} | Canvas: {objectRegistry.canvas.width}x{objectRegistry.canvas.height}
          </div>
        </div>
      )}
      
      {/* Debug Info Overlay */}
      {devMode && (
        <div className="absolute top-4 right-4 z-20 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>Objects: {objectRegistry.objects.length}</div>
          <div>Canvas: {objectRegistry.canvas.width}x{objectRegistry.canvas.height}</div>
          <div>Background: {objectRegistry.canvas.background.image ? 'Image' : 'Color'}</div>
        </div>
      )}
    </div>
  )
}

export default SecondBrainApp