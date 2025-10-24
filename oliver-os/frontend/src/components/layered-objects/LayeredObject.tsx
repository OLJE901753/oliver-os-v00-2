import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { LayeredObjectProps, ObjectStateUpdate } from '../../types/layeredObjects';

/**
 * LayeredObject Component - Simplified Version
 * Focuses on simple toggle between full background and background-without-object
 */
export const LayeredObject: React.FC<LayeredObjectProps> = ({
  config,
  state,
  onStateChange,
  devMode = false,
  interactionState,
  onObjectInteraction,
  positioningState,
  onObjectSelect
}) => {
  const [showBackgroundWithoutObject, setShowBackgroundWithoutObject] = useState(false);
  const objectRef = useRef<HTMLDivElement>(null);

  // Get visual state based on interactions
  const getVisualState = () => {
    if (interactionState?.isObjectActive(config.id)) {
      return 'active';
    }
    // For brain core, also show as active when in hole mode
    if (config.id === 'brain-core' && showBackgroundWithoutObject) {
      return 'active';
    }
    return 'idle';
  };

  const visualState = getVisualState();



  // Handle click with interaction support and zone detection
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Handle positioning mode selection
    if (positioningState?.positioningMode && onObjectSelect) {
      onObjectSelect();
      event.stopPropagation();
      return;
    }
    
    if (!state.interactive) return;
    
    // Get click position relative to the object
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const objectWidth = rect.width;
    const objectHeight = rect.height;
    
    // Calculate click zone (left, center, right)
    const zoneWidth = objectWidth / 3;
    let clickZone = 'center'; // Default zone
    
    if (clickX < zoneWidth) {
      clickZone = 'left';
    } else if (clickX > zoneWidth * 2) {
      clickZone = 'right';
    }
    
    console.log(`🎯 ${config.name} clicked in ${clickZone} zone! (${clickX}, ${clickY})`);
    
    // Handle different click zones
    switch (clickZone) {
      case 'left':
        console.log('🔵 Left zone clicked - Opening Data Panel');
        // TODO: Implement left zone functionality
        break;
        
      case 'center':
        console.log('🟡 Center zone clicked - Toggling Show Hole');
        // Toggle background state for brain-core (existing behavior)
        if (config.id === 'brain-core') {
          setShowBackgroundWithoutObject(!showBackgroundWithoutObject);
        }
        break;
        
      case 'right':
        console.log('🔴 Right zone clicked - Opening Status Panel');
        // TODO: Implement right zone functionality
        break;
    }
    
    // Trigger object interaction for cascade effects
    if (onObjectInteraction) {
      onObjectInteraction(config.id, 'toggle');
    }
    
    // Call custom click handler
    if (config.interaction.onClick) {
      config.interaction.onClick();
    }
    
    onStateChange({ active: !showBackgroundWithoutObject });
  }, [state.interactive, config.id, config.name, onObjectInteraction, config.interaction.onClick, onStateChange, showBackgroundWithoutObject, positioningState?.positioningMode, onObjectSelect]);

  
  // Don't render if not visible
  if (!state.visible) {
    return null;
  }

  // Show loading state if assets aren't ready (but skip for brain-core if progress > 0)
  if (!state.assetState.loaded && state.assetState.loading && !(config.id === 'brain-core' && state.assetState.progress > 0)) {
    // Special handling for brain core - show a placeholder while loading
    if (config.id === 'brain-core') {
      return (
        <div
          ref={objectRef}
          className={`layered-object brain-core-loading ${devMode ? 'dev-mode' : ''}`}
          style={{
            position: 'absolute',
            left: config.position.x,
            top: config.position.y,
            width: config.position.width,
            height: config.position.height,
            zIndex: config.zIndex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 212, 255, 0.05)',
            border: '2px dashed rgba(0, 212, 255, 0.3)',
            borderRadius: '12px',
            color: 'rgba(0, 212, 255, 0.6)',
            fontSize: '12px',
            fontWeight: 'bold',
            pointerEvents: state.interactive ? 'auto' : 'none',
            cursor: state.interactive ? 'pointer' : 'default'
          }}
        >
          🧠 Loading...
        </div>
      );
    }
    
    return (
      <div
        ref={objectRef}
        className={`layered-object loading ${devMode ? 'dev-mode' : ''}`}
        style={{
          position: 'absolute',
          left: config.position.x,
          top: config.position.y,
          width: config.position.width,
          height: config.position.height,
          zIndex: config.zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          border: devMode ? '2px dashed rgba(0, 212, 255, 0.5)' : 'none',
          borderRadius: '8px'
        }}
      >
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <span className="loading-text">Loading...</span>
        </div>
      </div>
    );
  }

  // Show fallback if assets are not loaded and not loading (initial state)
  if (!state.assetState.loaded && !state.assetState.loading && !state.assetState.error) {
    // Special handling for brain core - show a placeholder in initial state
    if (config.id === 'brain-core') {
      return (
        <div
          ref={objectRef}
          className={`layered-object brain-core-initial ${devMode ? 'dev-mode' : ''}`}
          style={{
            position: 'absolute',
            left: config.position.x,
            top: config.position.y,
            width: config.position.width,
            height: config.position.height,
            zIndex: config.zIndex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 212, 255, 0.08)',
            border: '2px solid rgba(0, 212, 255, 0.4)',
            borderRadius: '12px',
            color: 'rgba(0, 212, 255, 0.7)',
            fontSize: '13px',
            fontWeight: 'bold',
            pointerEvents: state.interactive ? 'auto' : 'none',
            cursor: state.interactive ? 'pointer' : 'default'
          }}
        >
          🧠 Initializing...
        </div>
      );
    }
  }

  // Show error state if assets failed to load
  if (state.assetState.error) {
    // Special handling for brain core - show a placeholder even if assets fail
    if (config.id === 'brain-core') {
      return (
        <div
          ref={objectRef}
          className={`layered-object brain-core-placeholder ${devMode ? 'dev-mode' : ''}`}
          style={{
            position: 'absolute',
            left: config.position.x,
            top: config.position.y,
            width: config.position.width,
            height: config.position.height,
            zIndex: config.zIndex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            border: '2px solid rgba(0, 212, 255, 0.5)',
            borderRadius: '12px',
            color: 'rgba(0, 212, 255, 0.8)',
            fontSize: '14px',
            fontWeight: 'bold',
            pointerEvents: state.interactive ? 'auto' : 'none',
            cursor: state.interactive ? 'pointer' : 'default'
          }}
        >
          🧠 Placeholder
        </div>
      );
    }
    
    return (
      <div
        ref={objectRef}
        className={`layered-object error ${devMode ? 'dev-mode' : ''}`}
        style={{
          position: 'absolute',
          left: config.position.x,
          top: config.position.y,
          width: config.position.width,
          height: config.position.height,
          zIndex: config.zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          border: devMode ? '2px dashed rgba(255, 0, 0, 0.5)' : 'none',
          borderRadius: '8px'
        }}
      >
        <div className="error-content">
          <span className="error-text">Failed to load</span>
        </div>
      </div>
    );
  }


  // Get positioning classes
  const getPositioningClasses = () => {
    const classes = [];
    
    if (positioningState?.isSelected) {
      classes.push('selected');
    }
    
    if (positioningState?.isDragging) {
      classes.push('dragging');
    }
    
    if (positioningState?.positioningMode) {
      classes.push('drag-handle');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      ref={objectRef}
      className={`layered-object ${devMode ? 'dev-mode' : ''} ${visualState} ${getPositioningClasses()}`}
      data-object-id={config.id}
      style={{
        position: 'absolute',
        left: config.position.x,
        top: config.position.y,
        width: config.position.width,
        height: config.position.height,
        zIndex: config.zIndex,
        cursor: positioningState?.positioningMode ? 'pointer' : (state.interactive ? 'pointer' : 'default'),
        borderRadius: '8px',
        // Positioning mode effects only
        opacity: positioningState?.isDragging ? 0.8 : 1
      }}
      onClick={handleClick}
    >
      {/* Full Background - Always visible as base layer */}
      <div
        className="full-background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${config.assets.fullBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          zIndex: 1
        }}
      />

      {/* Background without object - Show when toggled */}
      <img
        src={config.assets.backgroundWithoutObject}
        alt="Background without object"
        className="background-without-object"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          zIndex: 2,
          opacity: showBackgroundWithoutObject ? 1 : 0,
          transition: 'opacity 0.3s ease',
          border: devMode ? '2px solid red' : 'none', // Debug border
          filter: showBackgroundWithoutObject ? 'brightness(1.1) contrast(1.1)' : 'none' // Subtle visual difference
        }}
        onLoad={() => console.log('🖼️ Background-without-object loaded')}
        onError={() => console.log('❌ Background-without-object failed to load')}
      />

      {/* Isolated Object - Clickable when in hole mode */}
      {showBackgroundWithoutObject && (
        <img
          src={config.assets.objectIsolated}
          alt="Isolated object"
          className="object-isolated"
          style={{
            position: 'absolute',
            top: '20%', // Adjust these values to match the object's position in the original image
            left: '30%', // Adjust these values to match the object's position in the original image
            maxWidth: '150px', // Adjust size as needed
            maxHeight: '150px',
            objectFit: 'contain',
            zIndex: 3,
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.3s ease',
            opacity: 1,
            border: devMode ? '2px solid blue' : 'none' // Debug border
          }}
          onClick={(e) => {
            e.stopPropagation();
            console.log('🎯 Isolated object clicked!');
            // Add your custom function here
            if (config.interaction.onClick) {
              config.interaction.onClick();
            }
          }}
          onLoad={() => console.log('🎯 Isolated object loaded')}
          onError={() => console.log('❌ Isolated object failed to load')}
        />
      )}

      



      {/* Interaction indicator for active objects */}
      {visualState === 'active' && (
        <div
          style={{
            position: 'absolute',
            top: '-10px',
            right: '-10px',
            width: '24px',
            height: '24px',
            backgroundColor: 'rgba(0, 212, 255, 0.9)',
            borderRadius: '50%',
            border: '3px solid white',
            zIndex: 1000,
            animation: 'pulse 1.5s infinite, glow 2s infinite',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white'
          }}
        >
          ⚡
        </div>
      )}

      {/* Positioning indicator for selected objects */}
      {positioningState?.isSelected && devMode && (
        <div
          style={{
            position: 'absolute',
            top: '-8px',
            left: '-8px',
            width: '20px',
            height: '20px',
            backgroundColor: 'rgba(0, 212, 255, 0.9)',
            borderRadius: '50%',
            border: '2px solid white',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            animation: 'pulse 1s infinite'
          }}
        >
          📐
        </div>
      )}

      {/* Drag indicator for positioning mode */}
      {positioningState?.positioningMode && devMode && !positioningState.isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            border: '1px dashed rgba(0, 212, 255, 0.5)',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            color: 'rgba(0, 212, 255, 0.8)',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.7
          }}
        >
          Click to select
        </div>
      )}

      {/* Development mode overlay with click zones - Only show when dev mode is ON */}
      {devMode && (
        <>
          {/* Click zone indicators */}
          <div
            className="click-zone-left"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '33.33%',
              height: '100%',
              backgroundColor: 'rgba(0, 100, 255, 0.1)',
              border: '1px dashed rgba(0, 100, 255, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'rgba(0, 100, 255, 0.8)',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            LEFT
          </div>
          <div
            className="click-zone-center"
            style={{
              position: 'absolute',
              top: 0,
              left: '33.33%',
              width: '33.33%',
              height: '100%',
              backgroundColor: 'rgba(255, 200, 0, 0.1)',
              border: '1px dashed rgba(255, 200, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'rgba(255, 200, 0, 0.8)',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            CENTER
          </div>
          <div
            className="click-zone-right"
            style={{
              position: 'absolute',
              top: 0,
              left: '66.66%',
              width: '33.33%',
              height: '100%',
              backgroundColor: 'rgba(255, 100, 100, 0.1)',
              border: '1px dashed rgba(255, 100, 100, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              color: 'rgba(255, 100, 100, 0.8)',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 5
            }}
          >
            RIGHT
          </div>
          
          {/* Object name overlay */}
          <div
            className="dev-overlay"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 6
            }}
          >
            {config.name}
          </div>
        </>
      )}
    </div>
  );
};