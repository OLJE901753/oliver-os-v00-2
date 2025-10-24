import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayeredObject } from './LayeredObject';
import { AnimatedLayeredObject } from './AnimatedLayeredObject';
import { AnimatedPositioningGrid } from './AnimatedPositioningGrid';
import { AnimatedPositionInspector } from './AnimatedPositionInspector';
import { AnimationDebugger } from './AnimationDebugger';
import { useAssetManager } from '../../hooks/useAssetManager';
import { useObjectInteractions } from '../../hooks/useObjectInteractions';
import { usePositioning } from '../../hooks/usePositioning';
import { animationTests } from '../../utils/animationTestSuite';
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
  className = '',
  onDevModeToggle
}) => {
  const [objectStates, setObjectStates] = useState<Map<string, LayeredObjectState>>(new Map());
  const [objectPositions, setObjectPositions] = useState<Map<string, any>>(new Map());
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [showAnimationDebugger, setShowAnimationDebugger] = useState(false);
  
  // Dev Mode container position state
  const [devModePosition, setDevModePosition] = useState({ top: 16, left: 320 })
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Handle dev mode container drag
  const handleDevModeDrag = (event: React.DragEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const newPosition = {
      top: event.clientY - rect.height / 2,
      left: event.clientX - rect.width / 2
    }
    setDevModePosition(newPosition)
  }
  
  // Memoize objects to prevent infinite re-renders
  const memoizedObjects = useMemo(() => registry.objects, [registry.objects]);
  
  // Create objects with updated positions for positioning system
  const objectsWithPositions = useMemo(() => {
    return memoizedObjects.map(obj => ({
      ...obj,
      position: objectPositions.get(obj.id) || obj.position
    }));
  }, [memoizedObjects, objectPositions]);
  
  // Initialize asset manager
  const assetManager = useAssetManager(memoizedObjects);
  
  // Initialize object interactions
  const {
    state: interactionState,
    activateObject,
    deactivateObject,
    toggleObject,
    isObjectActive,
    getObjectState,
    resetAllObjects,
    getActiveObjects,
    getInteractionHistory
  } = useObjectInteractions(memoizedObjects);

  // Initialize positioning system
  const {
    state: positioningState,
    dragState,
    canvasRef: positioningCanvasRef,
    startDrag,
    updateDrag,
    endDrag,
    updateObjectPosition,
    selectObject,
    togglePositioningMode,
    toggleGrid,
    updateGridSpacing,
    toggleSnapToGrid,
    applyPresetToObjects,
    undoPosition,
    redoPosition,
    resetAllPositions,
    getDragPosition,
    isObjectSelected,
    isObjectDragging,
    availablePresets,
    getPresetById
  } = usePositioning(objectsWithPositions, (id, updates) => {
    // Update object position in local state
    setObjectPositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(id, updates.position);
      console.log(`✅ Position updated for ${id}:`, updates.position);
      return newPositions;
    });
  });

  // Initialize object states and positions
  useEffect(() => {
    const initialStates = new Map<string, LayeredObjectState>();
    const initialPositions = new Map<string, any>();

    memoizedObjects.forEach(obj => {
      initialStates.set(obj.id, {
        visible: obj.visible,
        interactive: obj.interaction.interactive,
        hovered: false,
        active: false,
        assetState: assetManager.getObjectAssetState(obj),
        customState: {}
      });
      
      // Initialize positions with original object positions
      initialPositions.set(obj.id, obj.position);
    });

    setObjectStates(initialStates);
    setObjectPositions(initialPositions);
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
    
    // Deselect object if clicking on background in positioning mode
    if (positioningState.positioningMode && event.target === canvasRef.current) {
      selectObject(null);
    }
  }, [config.globalInteraction.onBackgroundClick, positioningState.positioningMode, selectObject]);

  // Handle mouse events for drag and drop
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!positioningState.positioningMode || !devMode) return;
    
    const target = event.target as HTMLElement;
    const objectElement = target.closest('.layered-object');
    
    if (objectElement) {
      const objectId = objectElement.getAttribute('data-object-id');
      if (objectId) {
        startDrag(objectId, event.clientX, event.clientY);
        event.preventDefault();
      }
    }
  }, [positioningState.positioningMode, devMode, startDrag]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (dragState.isDragging) {
      updateDrag(event.clientX, event.clientY);
    }
  }, [dragState.isDragging, updateDrag]);

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      endDrag();
    }
  }, [dragState.isDragging, endDrag]);

  // Handle keyboard shortcuts (non-conflicting)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      console.log('Key pressed:', event.key, 'Alt:', event.altKey, 'Ctrl:', event.ctrlKey, 'Shift:', event.shiftKey);
      
      switch (event.key.toLowerCase()) {
        case 'd':
          if (event.altKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Alt+D pressed - toggling dev mode');
            if (onDevModeToggle) {
              onDevModeToggle();
            }
          }
          break;
        case 'g':
          if (event.altKey && !event.ctrlKey && !event.metaKey && devMode) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Alt+G pressed - toggling grid. Current state:', positioningState.grid.visible);
            toggleGrid();
          }
          break;
        case 'p':
          if (event.altKey && !event.ctrlKey && !event.metaKey && devMode) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Alt+P pressed - toggling positioning mode');
            togglePositioningMode();
          }
          break;
        case 'z':
          if (event.altKey && !event.ctrlKey && !event.metaKey && devMode) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Alt+Z pressed - undo/redo');
            if (event.shiftKey) {
              redoPosition();
            } else {
              undoPosition();
            }
          }
          break;
        case 'r':
          if (event.altKey && !event.ctrlKey && !event.metaKey && devMode) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Alt+R pressed - reset positions');
            resetAllPositions();
          }
          break;
        case 'escape':
          if (devMode) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Escape pressed - exiting positioning mode');
            if (positioningState.positioningMode) {
              togglePositioningMode();
            }
            selectObject(null);
          }
          break;
        case 'a':
          if (event.altKey && !event.ctrlKey && !event.metaKey && devMode) {
            event.preventDefault();
            event.stopPropagation();
            console.log('Alt+A pressed - toggling animation debugger');
            setShowAnimationDebugger(!showAnimationDebugger);
          }
          break;
      }
    };

    // Add event listener with capture to ensure it runs first
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [devMode, toggleGrid, togglePositioningMode, undoPosition, redoPosition, resetAllPositions, positioningState.positioningMode, selectObject, onDevModeToggle]);

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

  // Handle object interactions for cascade effects
  const handleObjectInteraction = useCallback((objectId: string, action: 'activate' | 'deactivate' | 'toggle') => {
    switch (action) {
      case 'activate':
        activateObject(objectId);
        break;
      case 'deactivate':
        deactivateObject(objectId);
        break;
      case 'toggle':
        toggleObject(objectId);
        break;
    }
  }, [activateObject, deactivateObject, toggleObject]);

  // Preload critical assets on mount
  useEffect(() => {
    if (config.performance.preloadAssets) {
      assetManager.preloadCriticalAssets();
    }
  }, [config.performance.preloadAssets, assetManager.preloadCriticalAssets]);

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
      className={`interactive-canvas ${className} ${devMode ? 'dev-mode' : ''} ${positioningState.positioningMode ? 'positioning-mode' : ''}`}
      style={{
        position: 'relative',
        width: config.width,
        height: config.height,
        overflow: 'hidden',
        backgroundColor: config.background.fallbackColor || '#0a0a0a',
        cursor: config.globalInteraction.enabled ? 'default' : 'default',
        border: devMode ? '2px solid rgba(0, 212, 255, 0.5)' : 'none',
        borderRadius: '12px'
      }}
      variants={canvasVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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

      {/* Fallback Background - Always show when no background image */}
      {(!config.background.image || !backgroundLoaded) && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
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

      {/* Animated Positioning Grid */}
      <AnimatedPositioningGrid
        grid={positioningState.grid}
        canvasSize={{
          width: typeof config.width === 'number' ? config.width : window.innerWidth,
          height: typeof config.height === 'number' ? config.height : window.innerHeight
        }}
        visible={devMode && positioningState.grid.visible}
        animationConfig={{
          onShow: {
            duration: 0.4,
            easing: 'easeOut',
            type: 'fade'
          },
          onHide: {
            duration: 0.2,
            easing: 'easeIn',
            type: 'fade'
          },
          onSnap: {
            duration: 0.2,
            easing: 'easeOut',
            type: 'pulse'
          }
        }}
      />

      {/* Render all layered objects */}
      {sortedObjects.map(obj => {
        const objectState = objectStates.get(obj.id);
        if (!objectState) return null;

        // Get persisted position or fallback to original position
        const persistedPosition = objectPositions.get(obj.id);
        const basePosition = persistedPosition || obj.position;

        // Get drag position if object is being dragged
        const dragPosition = getDragPosition(obj.id);
        const currentPosition = dragPosition || basePosition;

        // Get cascade configuration for this object
        const cascadeConfig = obj.interactions?.affects ? {
          affects: obj.interactions.affects,
          animation: {
            type: 'slide' as const,
            direction: 'up' as const,
            duration: 300,
            easing: 'easeOut'
          },
          staggerDelay: 100
        } : undefined;

        return (
          <AnimatedLayeredObject
            key={obj.id}
            config={{
              ...obj,
              position: currentPosition
            }}
            state={objectState}
            onStateChange={(updates) => handleObjectStateChange(obj.id, updates)}
            assetManager={assetManager.state}
            devMode={devMode}
            interactionState={{
              isObjectActive,
              getObjectState
            }}
            onObjectInteraction={handleObjectInteraction}
            positioningState={{
              isSelected: isObjectSelected(obj.id),
              isDragging: isObjectDragging(obj.id),
              positioningMode: positioningState.positioningMode
            }}
            onObjectSelect={() => selectObject(obj.id)}
            animationConfig={{
              onActivate: {
                type: 'glow',
                duration: 500,
                easing: 'easeOut',
                repeat: 2
              },
              onDeactivate: {
                type: 'fade',
                duration: 300,
                easing: 'easeIn'
              },
              onSelect: {
                type: 'pulse',
                duration: 400,
                easing: 'easeInOut',
                repeat: 1
              },
              onDrag: {
                type: 'glow',
                duration: 200,
                easing: 'easeOut'
              },
              onPositionChange: {
                type: 'bounce',
                duration: 300,
                easing: 'easeOut'
              }
            }}
            enableCascade={true}
            cascadeConfig={cascadeConfig}
          />
        );
      })}



      {/* Development mode info overlay - Same style as Show Brain Core, positioned on the left */}
      {devMode && (
        <div 
          className="absolute z-[9999] glass-card p-4 rounded-lg cursor-move"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'rgba(0, 212, 255, 0.9)',
            border: '1px solid rgba(0, 212, 255, 0.3)',
            backdropFilter: 'blur(10px)',
            width: '200px',
            top: devModePosition.top,
            left: devModePosition.left
          }}
          draggable="true"
          onDragEnd={handleDevModeDrag}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>🔧 Dev Mode</div>
          <div style={{ marginBottom: '2px' }}>Objects: {sortedObjects.length}</div>
          <div style={{ marginBottom: '2px' }}>Assets: {assetManager.loadingProgress}%</div>
          <div style={{ marginBottom: '4px' }}>Canvas: {config.width}x{config.height}</div>
          <div style={{ fontSize: '10px', color: 'rgba(0, 212, 255, 0.7)' }}>
            Alt+D: Dev | Alt+P: Position | Alt+G: Grid | Alt+A: Debug
          </div>
        </div>
      )}


      {/* Main Control Panel - Fixed positioning */}
      {devMode && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: 'rgba(0, 212, 255, 1)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontFamily: 'Arial, sans-serif',
            zIndex: 2000,
            border: '2px solid rgba(0, 212, 255, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '200px',
            maxWidth: '250px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>🎛️ Controls</div>
          
          {/* Main Controls Row */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={togglePositioningMode}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: positioningState.positioningMode ? 'rgba(0, 212, 255, 0.3)' : 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(0, 212, 255, 0.7)',
                borderRadius: '4px',
                color: 'rgba(0, 212, 255, 1)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              {positioningState.positioningMode ? 'Exit Pos' : 'Enter Pos'}
            </button>
            <button
              onClick={toggleGrid}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: positioningState.grid.visible ? 'rgba(0, 212, 255, 0.3)' : 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(0, 212, 255, 0.7)',
                borderRadius: '4px',
                color: 'rgba(0, 212, 255, 1)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              {positioningState.grid.visible ? 'Hide Grid' : 'Show Grid'}
            </button>
          </div>
          
          {/* Undo/Redo Row */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button
              onClick={undoPosition}
              disabled={positioningState.historyIndex <= 0}
              style={{
                flex: 1,
                padding: '6px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(0, 212, 255, 0.7)',
                borderRadius: '4px',
                color: 'rgba(0, 212, 255, 1)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                opacity: positioningState.historyIndex <= 0 ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              ↶ Undo
            </button>
            <button
              onClick={redoPosition}
              disabled={positioningState.historyIndex >= positioningState.positionHistory.length - 1}
              style={{
                flex: 1,
                padding: '6px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid rgba(0, 212, 255, 0.7)',
                borderRadius: '4px',
                color: 'rgba(0, 212, 255, 1)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                opacity: positioningState.historyIndex >= positioningState.positionHistory.length - 1 ? 0.5 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              ↷ Redo
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 212, 255, 0.3)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>🎯 Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => {
                  // Brain Core Action - Activate all panels directly
                  console.log('🧠 Activating Brain Core via action button');
                  if (handleObjectInteraction) {
                    handleObjectInteraction('brain-core', 'activate');
                  }
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(0, 212, 255, 0.2)',
                  border: '1px solid rgba(0, 212, 255, 0.7)',
                  borderRadius: '4px',
                  color: 'rgba(0, 212, 255, 1)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                🧠 Activate
              </button>
              <button
                onClick={() => {
                  // Deactivate all directly
                  console.log('🔴 Deactivating all via action button');
                  if (handleObjectInteraction) {
                    handleObjectInteraction('brain-core', 'deactivate');
                  }
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 100, 100, 0.2)',
                  border: '1px solid rgba(255, 100, 100, 0.7)',
                  borderRadius: '4px',
                  color: 'rgba(255, 100, 100, 1)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                🔴 Deactivate All
              </button>
            </div>
          </div>

          {/* Animation Test Buttons */}
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(0, 212, 255, 0.3)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '6px', fontSize: '12px' }}>🧪 Tests</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button
                onClick={() => animationTests.testObjectStateTransitions()}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'rgba(0, 255, 0, 0.2)',
                  border: '1px solid rgba(0, 255, 0, 0.5)',
                  borderRadius: '3px',
                  color: 'rgba(0, 255, 0, 1)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                🎭 States
              </button>
              <button
                onClick={() => animationTests.testCascadeAnimations()}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'rgba(0, 255, 255, 0.2)',
                  border: '1px solid rgba(0, 255, 255, 0.5)',
                  borderRadius: '3px',
                  color: 'rgba(0, 255, 255, 1)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                🌊 Cascade
              </button>
              <button
                onClick={() => animationTests.testPositioningAnimations()}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'rgba(255, 165, 0, 0.2)',
                  border: '1px solid rgba(255, 165, 0, 0.5)',
                  borderRadius: '3px',
                  color: 'rgba(255, 165, 0, 1)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                🎯 Position
              </button>
              <button
                onClick={() => animationTests.testGridAnimations()}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'rgba(128, 0, 128, 0.2)',
                  border: '1px solid rgba(128, 0, 128, 0.5)',
                  borderRadius: '3px',
                  color: 'rgba(128, 0, 128, 1)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                📐 Grid
              </button>
              <button
                onClick={() => animationTests.testUIComponentAnimations()}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'rgba(255, 0, 255, 0.2)',
                  border: '1px solid rgba(255, 0, 255, 0.5)',
                  borderRadius: '3px',
                  color: 'rgba(255, 0, 255, 1)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                🎛️ UI
              </button>
              <button
                onClick={() => animationTests.testPerformanceStress()}
                style={{
                  padding: '4px 6px',
                  backgroundColor: 'rgba(255, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 0, 0, 0.5)',
                  borderRadius: '3px',
                  color: 'rgba(255, 0, 0, 1)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 'bold'
                }}
              >
                ⚡ Stress
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Position Inspector - Disabled since no objects to position */}

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

      {/* Animation Debugger */}
      {devMode && (
        <AnimationDebugger
          visible={showAnimationDebugger}
          animationData={{
            activeAnimations: [], // TODO: Track active animations
            animationQueue: [], // TODO: Track animation queue
            performance: {
              fps: 60, // TODO: Get real FPS
              frameTime: 16.67, // TODO: Get real frame time
              memoryUsage: 0 // TODO: Get memory usage
            }
          }}
          onToggle={() => setShowAnimationDebugger(!showAnimationDebugger)}
        />
      )}
    </motion.div>
  );
};
