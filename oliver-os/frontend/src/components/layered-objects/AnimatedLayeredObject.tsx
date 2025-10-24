import React, { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayeredObject } from './LayeredObject';
import { useAnimations, type AnimationConfig } from '../../hooks/useAnimations';
import type { 
  LayeredObjectConfig, 
  LayeredObjectState, 
  ObjectStateUpdate,
  LayeredObjectProps 
} from '../../types/layeredObjects';

interface AnimatedLayeredObjectProps extends LayeredObjectProps {
  /** Animation configuration for this object */
  animationConfig?: {
    /** Animation when object becomes active */
    onActivate?: AnimationConfig;
    /** Animation when object becomes inactive */
    onDeactivate?: AnimationConfig;
    /** Animation when object is hovered */
    onHover?: AnimationConfig;
    /** Animation when object is selected for positioning */
    onSelect?: AnimationConfig;
    /** Animation when object is being dragged */
    onDrag?: AnimationConfig;
    /** Animation when object position changes */
    onPositionChange?: AnimationConfig;
  };
  /** Whether to enable cascade animations */
  enableCascade?: boolean;
  /** Cascade animation configuration */
  cascadeConfig?: {
    /** Objects that should animate when this object activates */
    affects?: string[];
    /** Animation to apply to affected objects */
    animation?: AnimationConfig;
    /** Stagger delay between affected objects */
    staggerDelay?: number;
  };
}

/**
 * Enhanced LayeredObject with smooth animations and visual effects
 * Wraps the base LayeredObject with Framer Motion animations
 */
export const AnimatedLayeredObject: React.FC<AnimatedLayeredObjectProps> = ({
  config,
  state,
  onStateChange,
  assetManager,
  devMode = false,
  interactionState,
  onObjectInteraction,
  positioningState,
  onObjectSelect,
  animationConfig = {},
  enableCascade = true,
  cascadeConfig = {}
}) => {
  const {
    animateObject,
    animateCascade,
    getAnimationVariants,
    isAnimating
  } = useAnimations();

  const objectRef = useRef<HTMLDivElement>(null);
  const previousStateRef = useRef<LayeredObjectState>(state);

  // Handle state changes with animations
  useEffect(() => {
    const prevState = previousStateRef.current;
    const currentState = state;

    // Animate on activate
    if (!prevState.active && currentState.active) {
      if (animationConfig.onActivate) {
        animateObject(config.id, animationConfig.onActivate);
      }
      
      // Trigger cascade animation
      if (enableCascade && cascadeConfig.affects && cascadeConfig.animation) {
        animateCascade(
          config.id,
          cascadeConfig.affects,
          cascadeConfig.animation,
          cascadeConfig.staggerDelay
        );
      }
    }

    // Animate on deactivate
    if (prevState.active && !currentState.active) {
      if (animationConfig.onDeactivate) {
        animateObject(config.id, animationConfig.onDeactivate);
      }
    }

    // Animate on hover
    if (!prevState.hovered && currentState.hovered) {
      if (animationConfig.onHover) {
        animateObject(config.id, animationConfig.onHover);
      }
    }

    // Animate on selection
    if (positioningState?.isSelected && !previousStateRef.current) {
      if (animationConfig.onSelect) {
        animateObject(config.id, animationConfig.onSelect);
      }
    }

    // Animate on drag
    if (positioningState?.isDragging && !previousStateRef.current) {
      if (animationConfig.onDrag) {
        animateObject(config.id, animationConfig.onDrag);
      }
    }

    previousStateRef.current = currentState;
  }, [
    state,
    positioningState,
    config.id,
    animationConfig,
    enableCascade,
    cascadeConfig,
    animateObject,
    animateCascade
  ]);

  // Get current animation state
  const isCurrentlyAnimating = isAnimating(config.id);

  // Enhanced click handler with animation
  const handleClick = useCallback((event: React.MouseEvent) => {
    // Handle positioning mode selection
    if (positioningState?.positioningMode && onObjectSelect) {
      onObjectSelect();
      event.stopPropagation();
      return;
    }

    // Handle normal interaction
    if (state.interactive && onObjectInteraction) {
      onObjectInteraction(config.id, 'toggle');
    }

    // Trigger click animation if configured
    if (animationConfig.onActivate && !state.active) {
      animateObject(config.id, {
        type: 'bounce',
        duration: 200,
        easing: 'easeOut'
      });
    }
  }, [
    state.interactive,
    config.id,
    onObjectInteraction,
    positioningState?.positioningMode,
    onObjectSelect,
    animationConfig.onActivate,
    state.active,
    animateObject
  ]);

  // Enhanced hover handlers
  const handleMouseEnter = useCallback(() => {
    if (state.interactive) {
      onStateChange({ hovered: true });
    }
  }, [state.interactive, onStateChange]);

  const handleMouseLeave = useCallback(() => {
    if (state.interactive) {
      onStateChange({ hovered: false });
    }
  }, [state.interactive, onStateChange]);

  // Get animation variants based on current state
  const getCurrentVariants = () => {
    if (state.active && animationConfig.onActivate) {
      return getAnimationVariants(animationConfig.onActivate);
    }
    if (state.hovered && animationConfig.onHover) {
      return getAnimationVariants(animationConfig.onHover);
    }
    if (positioningState?.isSelected && animationConfig.onSelect) {
      return getAnimationVariants(animationConfig.onSelect);
    }
    if (positioningState?.isDragging && animationConfig.onDrag) {
      return getAnimationVariants(animationConfig.onDrag);
    }
    
    // Default variants
    return {
      initial: { opacity: 1, scale: 1 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 }
    };
  };

  const variants = getCurrentVariants();

  return (
    <motion.div
      ref={objectRef}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={state.interactive ? "hover" : undefined}
      whileTap={state.interactive ? "tap" : undefined}
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
      style={{
        position: 'absolute',
        left: config.position.x,
        top: config.position.y,
        width: config.position.width,
        height: config.position.height,
        zIndex: config.zIndex,
        cursor: positioningState?.positioningMode ? 'pointer' : (state.interactive ? 'pointer' : 'default'),
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <LayeredObject
        config={config}
        state={state}
        onStateChange={onStateChange}
        assetManager={assetManager}
        devMode={devMode}
        interactionState={interactionState}
        onObjectInteraction={onObjectInteraction}
        positioningState={positioningState}
        onObjectSelect={onObjectSelect}
      />
      
      {/* Animation overlay for visual effects */}
      {isCurrentlyAnimating && (
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 1000
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 0.6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              border: '2px solid rgba(0, 212, 255, 0.6)',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, transparent, rgba(0, 212, 255, 0.1), transparent)'
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};
