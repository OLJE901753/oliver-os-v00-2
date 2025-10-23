import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayeredObject } from './LayeredObject';
import { useAssetManager } from '../../hooks/useAssetManager';
import type { 
  InteractiveCanvasProps, 
  LayeredObjectState, 
  ObjectStateUpdate,
  ObjectClickEvent,
  ObjectHoverEvent 
} from '../../types/layeredObjects';

/**
 * InteractiveCanvas Component
 * Main container for all layered objects with background management
 * Handles global interactions and object state coordination
 */
export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({
  config,
  registry,
  devMode = false,
  className = ''
}) => {
  const [objectStates, setObjectStates] = useState<Map<string, LayeredObjectState>>(new Map());
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Memoize objects to prevent infinite re-renders
  const memoizedObjects = useMemo(() => registry.objects, [registry.objects]);
  
  // Initialize asset manager
  const assetManager = useAssetManager(memoizedObjects);

  // Initialize object states
  useEffect(() => {
    const initialStates = new Map<string, LayeredObjectState>();

    memoizedObjects.forEach(obj => {
      initialStates.set(obj.id, {
        visible: obj.visible,
        interactive: obj.interaction.interactive,
        hovered: false,
        active: false,
        assetState: assetManager.getObjectAssetState(obj),
        customState: {}
      });
    });

    setObjectStates(initialStates);
  }, [memoizedObjects]); // Only depend on memoizedObjects, not assetManager

  // Update asset states when asset manager state changes
  useEffect(() => {
    setObjectStates(prevStates => {
      const newStates = new Map(prevStates);
      
      memoizedObjects.forEach(obj => {
        const currentState = newStates.get(obj.id);
        if (currentState) {
          newStates.set(obj.id, {
            ...currentState,
            assetState: assetManager.getObjectAssetState(obj)
          });
        }
      });
      
      return newStates;
    });
  }, [memoizedObjects, assetManager.state.loaded.size, assetManager.state.loading.size, assetManager.state.failed.size]); // Add asset manager state dependencies

  // Handle object state updates
  const handleObjectStateChange = useCallback((objectId: string, updates: ObjectStateUpdate) => {
    setObjectStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(objectId);
      
      if (currentState) {
        newStates.set(objectId, { ...currentState, ...updates });
      }
      
      return newStates;
    });
  }, []);

  // Handle canvas background click
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    // Only handle background clicks if no object was clicked
    if (event.target === canvasRef.current && config.globalInteraction.onBackgroundClick) {
      config.globalInteraction.onBackgroundClick();
    }
  }, [config.globalInteraction.onBackgroundClick]);

  // Handle global object events
  useEffect(() => {
    const handleObjectClick = (event: CustomEvent<ObjectClickEvent>) => {
      console.log(`Object clicked:`, event.detail);
      
      // Handle global click logic here
      // For example, deactivate other objects, update UI state, etc.
    };

    const handleObjectHover = () => {
      // Handle global hover logic here
    };

    window.addEventListener('layeredObjectClick', handleObjectClick as EventListener);
    window.addEventListener('layeredObjectHover', handleObjectHover as EventListener);

    return () => {
      window.removeEventListener('layeredObjectClick', handleObjectClick as EventListener);
      window.removeEventListener('layeredObjectHover', handleObjectHover as EventListener);
    };
  }, []);

  // Preload critical assets on mount
  useEffect(() => {
    if (config.performance.preloadAssets) {
      assetManager.preloadCriticalAssets();
    }
  }, [config.performance.preloadAssets]); // Remove assetManager from dependencies

  // Load background image
  useEffect(() => {
    if (config.background.image) {
      const img = new Image();
      img.onload = () => setBackgroundLoaded(true);
      img.onerror = () => {
        console.warn('Failed to load background image, using fallback');
        setBackgroundLoaded(true);
      };
      img.src = config.background.image;
    } else {
      setBackgroundLoaded(true);
    }
  }, [config.background.image]);

  // Get sorted objects by z-index
  const sortedObjects = memoizedObjects
    .filter(obj => objectStates.get(obj.id)?.visible !== false)
    .sort((a, b) => a.zIndex - b.zIndex);

  // Canvas animation variants
  const canvasVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeIn' }
    }
  };

  return (
    <motion.div
      ref={canvasRef}
      className={`interactive-canvas ${className} ${devMode ? 'dev-mode' : ''}`}
      style={{
        position: 'relative',
        width: config.width,
        height: config.height,
        overflow: 'hidden',
        backgroundColor: config.background.fallbackColor || 'transparent',
        cursor: config.globalInteraction.enabled ? 'default' : 'default',
        border: devMode ? '2px solid rgba(0, 212, 255, 0.5)' : 'none',
        borderRadius: '12px'
      }}
      variants={canvasVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleCanvasClick}
    >
      {/* Background Image */}
      {backgroundLoaded && config.background.image && (
        <img
          src={config.background.image}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            zIndex: 0
          }}
        />
      )}

      {/* Background overlay for better contrast */}
      <div 
        className="canvas-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.05))',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Render all layered objects */}
      {sortedObjects.map(obj => {
        const objectState = objectStates.get(obj.id);
        if (!objectState) return null;


        return (
          <LayeredObject
            key={obj.id}
            config={obj}
            state={objectState}
            onStateChange={(updates) => handleObjectStateChange(obj.id, updates)}
            assetManager={assetManager.state}
            devMode={devMode}
          />
        );
      })}

      {/* Development mode info overlay */}
      {devMode && (
        <div
          className="dev-info-overlay"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'rgba(0, 212, 255, 0.9)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            zIndex: 1000,
            border: '1px solid rgba(0, 212, 255, 0.3)'
          }}
        >
          <div>Objects: {sortedObjects.length}</div>
          <div>Assets Loaded: {assetManager.loadingProgress}%</div>
          <div>Canvas: {config.width}x{config.height}</div>
        </div>
      )}

      {/* Loading overlay */}
      {!assetManager.allAssetsLoaded && (
        <div
          className="loading-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            color: 'white'
          }}
        >
          <div className="loading-content">
            <div className="loading-spinner-large">
              <div className="spinner-ring-large"></div>
            </div>
            <div className="loading-text-large">
              Loading AI Art Assets...
            </div>
            <div className="loading-progress">
              {assetManager.loadingProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Error overlay for failed assets */}
      {assetManager.state.failed.size > 0 && (
        <div
          className="error-overlay"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          onClick={() => assetManager.retryFailedAssets()}
        >
          {assetManager.state.failed.size} assets failed to load. Click to retry.
        </div>
      )}
    </motion.div>
  );
};
