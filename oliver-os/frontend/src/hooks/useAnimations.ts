import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AnimationState {
  /** Currently animating objects */
  animating: Set<string>;
  /** Animation queue for cascade effects */
  queue: Array<{
    objectId: string;
    animation: string;
    delay: number;
    priority: number;
  }>;
  /** Global animation settings */
  settings: {
    duration: number;
    easing: string;
    staggerDelay: number;
  };
}

export interface AnimationConfig {
  /** Animation type */
  type: 'fade' | 'slide' | 'scale' | 'rotate' | 'glow' | 'pulse' | 'bounce' | 'shake';
  /** Duration in milliseconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Easing function */
  easing?: string;
  /** Animation direction (for slide/scale) */
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
  /** Whether to loop the animation */
  loop?: boolean;
  /** Number of times to repeat */
  repeat?: number;
  /** Custom animation properties */
  custom?: Record<string, any>;
}

export interface CascadeAnimation {
  /** Trigger object ID */
  triggerId: string;
  /** Target object IDs */
  targetIds: string[];
  /** Animation to apply to targets */
  animation: AnimationConfig;
  /** Stagger delay between targets */
  staggerDelay?: number;
  /** Whether to reverse on deactivate */
  reverse?: boolean;
}

/**
 * Hook for managing complex animations in the layered object system
 * Handles state transitions, cascade effects, and visual feedback
 */
export const useAnimations = () => {
  const [state, setState] = useState<AnimationState>({
    animating: new Set(),
    queue: [],
    settings: {
      duration: 300,
      easing: 'easeInOut',
      staggerDelay: 100
    }
  });

  const animationRefs = useRef<Map<string, any>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Animate a single object
  const animateObject = useCallback((
    objectId: string, 
    config: AnimationConfig,
    onComplete?: () => void
  ) => {
    setState(prev => ({
      ...prev,
      animating: new Set([...prev.animating, objectId])
    }));

    // Clear existing timeout for this object
    const existingTimeout = timeoutRefs.current.get(objectId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set completion timeout
    const timeout = setTimeout(() => {
      setState(prev => {
        const newAnimating = new Set(prev.animating);
        newAnimating.delete(objectId);
        return {
          ...prev,
          animating: newAnimating
        };
      });
      onComplete?.();
    }, config.duration || state.settings.duration);

    timeoutRefs.current.set(objectId, timeout);
  }, [state.settings.duration]);

  // Animate multiple objects with stagger
  const animateCascade = useCallback((
    triggerId: string,
    targetIds: string[],
    animation: AnimationConfig,
    staggerDelay: number = state.settings.staggerDelay
  ) => {
    targetIds.forEach((targetId, index) => {
      const delay = index * staggerDelay;
      
      setTimeout(() => {
        animateObject(targetId, {
          ...animation,
          delay: (animation.delay || 0) + delay
        });
      }, delay);
    });
  }, [animateObject, state.settings.staggerDelay]);

  // Get animation variants for Framer Motion
  const getAnimationVariants = useCallback((config: AnimationConfig) => {
    const duration = (config.duration || state.settings.duration) / 1000;
    const easing = config.easing || state.settings.easing;

    const baseVariants = {
      initial: {},
      animate: {},
      exit: {}
    };

    switch (config.type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { 
            opacity: 1,
            transition: { duration, ease: easing }
          },
          exit: { 
            opacity: 0,
            transition: { duration, ease: easing }
          }
        };

      case 'slide':
        const slideDirection = config.direction || 'up';
        const slideDistance = 50;
        let slideFrom = {};
        
        switch (slideDirection) {
          case 'up': slideFrom = { y: slideDistance }; break;
          case 'down': slideFrom = { y: -slideDistance }; break;
          case 'left': slideFrom = { x: slideDistance }; break;
          case 'right': slideFrom = { x: -slideDistance }; break;
        }

        return {
          initial: { ...slideFrom, opacity: 0 },
          animate: { 
            x: 0, 
            y: 0, 
            opacity: 1,
            transition: { duration, ease: easing }
          },
          exit: { 
            ...slideFrom, 
            opacity: 0,
            transition: { duration, ease: easing }
          }
        };

      case 'scale':
        const scaleDirection = config.direction || 'in';
        const scaleFrom = scaleDirection === 'in' ? 0.8 : 1.2;
        
        return {
          initial: { scale: scaleFrom, opacity: 0 },
          animate: { 
            scale: 1, 
            opacity: 1,
            transition: { duration, ease: easing }
          },
          exit: { 
            scale: scaleFrom, 
            opacity: 0,
            transition: { duration, ease: easing }
          }
        };

      case 'glow':
        return {
          initial: { 
            boxShadow: '0 0 0px rgba(0, 212, 255, 0)',
            filter: 'brightness(1)'
          },
          animate: { 
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.8)',
            filter: 'brightness(1.2)',
            transition: { 
              duration, 
              ease: easing,
              repeat: config.repeat || 0,
              repeatType: 'reverse'
            }
          },
          exit: { 
            boxShadow: '0 0 0px rgba(0, 212, 255, 0)',
            filter: 'brightness(1)',
            transition: { duration, ease: easing }
          }
        };

      case 'pulse':
        return {
          initial: { scale: 1 },
          animate: { 
            scale: [1, 1.05, 1],
            transition: { 
              duration, 
              ease: easing,
              repeat: config.repeat || Infinity,
              repeatType: 'loop'
            }
          },
          exit: { 
            scale: 1,
            transition: { duration, ease: easing }
          }
        };

      case 'bounce':
        return {
          initial: { y: 0 },
          animate: { 
            y: [-10, 0, -5, 0],
            transition: { 
              duration, 
              ease: 'easeOut',
              repeat: config.repeat || 1
            }
          },
          exit: { 
            y: 0,
            transition: { duration, ease: easing }
          }
        };

      case 'shake':
        return {
          initial: { x: 0 },
          animate: { 
            x: [-5, 5, -5, 5, 0],
            transition: { 
              duration, 
              ease: 'easeInOut',
              repeat: config.repeat || 1
            }
          },
          exit: { 
            x: 0,
            transition: { duration, ease: easing }
          }
        };

      case 'rotate':
        return {
          initial: { rotate: 0 },
          animate: { 
            rotate: 360,
            transition: { 
              duration, 
              ease: easing,
              repeat: config.repeat || 0
            }
          },
          exit: { 
            rotate: 0,
            transition: { duration, ease: easing }
          }
        };

      default:
        return baseVariants;
    }
  }, [state.settings.duration, state.settings.easing]);

  // Check if object is currently animating
  const isAnimating = useCallback((objectId: string) => {
    return state.animating.has(objectId);
  }, [state.animating]);

  // Stop animation for an object
  const stopAnimation = useCallback((objectId: string) => {
    const timeout = timeoutRefs.current.get(objectId);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(objectId);
    }

    setState(prev => {
      const newAnimating = new Set(prev.animating);
      newAnimating.delete(objectId);
      return {
        ...prev,
        animating: newAnimating
      };
    });
  }, []);

  // Update animation settings
  const updateSettings = useCallback((newSettings: Partial<AnimationState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  }, []);

  return {
    state,
    animateObject,
    animateCascade,
    getAnimationVariants,
    isAnimating,
    stopAnimation,
    updateSettings
  };
};
