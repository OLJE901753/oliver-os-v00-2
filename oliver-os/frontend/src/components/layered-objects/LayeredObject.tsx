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
  devMode = false
}) => {
  const [showBackgroundWithoutObject, setShowBackgroundWithoutObject] = useState(false);
  const objectRef = useRef<HTMLDivElement>(null);

  // State change logging (can be removed in production)
  useEffect(() => {
    if (config.id === 'brain-core') {
      console.log('🎨 Background state:', showBackgroundWithoutObject ? 'Hole' : 'Full');
    }
  }, [showBackgroundWithoutObject, config.id]);



  // Handle click - only for non-brain-core objects
  const handleClick = useCallback(() => {
    if (!state.interactive || config.id === 'brain-core') return;
    
    console.log('🔄 Toggle: Full → Hole');
    // Toggle between full background and background-without-object
    setShowBackgroundWithoutObject(!showBackgroundWithoutObject);
    
    // Call custom click handler
    if (config.interaction.onClick) {
      config.interaction.onClick();
    }
    
    onStateChange({ active: !showBackgroundWithoutObject });
  }, [state.interactive, showBackgroundWithoutObject, config.interaction.onClick, onStateChange, config.id]);

  
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
          🧠 Loading Brain Core...
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
          🧠 Brain Core (Initializing...)
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
          🧠 Brain Core (Placeholder)
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

  return (
    <div
      ref={objectRef}
      className={`layered-object ${devMode ? 'dev-mode' : ''}`}
      style={{
        position: 'absolute',
        left: config.position.x,
        top: config.position.y,
        width: config.position.width,
        height: config.position.height,
        zIndex: config.zIndex,
        cursor: config.id === 'brain-core' ? 'default' : (state.interactive ? 'pointer' : 'default'),
        border: devMode ? '2px solid rgba(0, 212, 255, 0.3)' : 'none',
        borderRadius: '8px'
      }}
      onClick={config.id === 'brain-core' ? undefined : handleClick}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
          onLoad={() => console.log('🎯 Isolated object loaded')}
          onError={() => console.log('❌ Isolated object failed to load')}
        />
      )}

      


      {/* Toggle Button - Only for brain core */}
      {config.id === 'brain-core' && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000, // Much higher z-index
            backgroundColor: 'rgba(0, 212, 255, 0.9)', // More visible background
            color: 'black',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: '2px solid rgba(0, 212, 255, 1)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
            minWidth: '120px',
            textAlign: 'center'
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowBackgroundWithoutObject(!showBackgroundWithoutObject);
          }}
        >
          {showBackgroundWithoutObject ? 'Show Full' : 'Show Hole'}
        </div>
      )}

      {/* Development mode overlay */}
      {devMode && (
        <div
          className="dev-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: 'rgba(0, 212, 255, 0.8)',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 5
          }}
        >
          {config.name}
        </div>
      )}
    </div>
  );
};