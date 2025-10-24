import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PositioningGrid } from './PositioningGrid';
import type { PositioningState } from '../../types/layeredObjects';

interface AnimatedPositioningGridProps {
  /** Grid state configuration */
  grid: PositioningState['grid'];
  /** Canvas dimensions */
  canvasSize: {
    width: number;
    height: number;
  };
  /** Whether grid is visible */
  visible: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Animation configuration */
  animationConfig?: {
    /** Animation when grid appears */
    onShow?: {
      duration?: number;
      easing?: string;
      type?: 'fade' | 'slide' | 'scale';
    };
    /** Animation when grid disappears */
    onHide?: {
      duration?: number;
      easing?: string;
      type?: 'fade' | 'slide' | 'scale';
    };
    /** Animation for snap effects */
    onSnap?: {
      duration?: number;
      easing?: string;
      type?: 'pulse' | 'glow' | 'bounce';
    };
  };
}

/**
 * Enhanced PositioningGrid with smooth animations
 * Adds animated appearance/disappearance and snap effects
 */
export const AnimatedPositioningGrid: React.FC<AnimatedPositioningGridProps> = ({
  grid,
  canvasSize,
  visible,
  className = '',
  animationConfig = {}
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [snapEffect, setSnapEffect] = useState(false);

  // Default animation configuration
  const defaultConfig = {
    onShow: {
      duration: 0.3,
      easing: 'easeOut',
      type: 'fade' as const
    },
    onHide: {
      duration: 0.2,
      easing: 'easeIn',
      type: 'fade' as const
    },
    onSnap: {
      duration: 0.15,
      easing: 'easeOut',
      type: 'pulse' as const
    }
  };

  const config = {
    onShow: { ...defaultConfig.onShow, ...animationConfig.onShow },
    onHide: { ...defaultConfig.onHide, ...animationConfig.onHide },
    onSnap: { ...defaultConfig.onSnap, ...animationConfig.onSnap }
  };

  // Handle grid visibility changes
  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), config.onShow.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, config.onShow.duration]);

  // Trigger snap effect when grid becomes visible
  useEffect(() => {
    if (visible && grid.snapEnabled) {
      setSnapEffect(true);
      const timer = setTimeout(() => setSnapEffect(false), config.onSnap.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [visible, grid.snapEnabled, config.onSnap.duration]);

  // Get animation variants based on configuration
  const getVariants = () => {
    const showConfig = config.onShow;
    const hideConfig = config.onHide;

    switch (showConfig.type) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { 
            opacity: 1,
            transition: { 
              duration: showConfig.duration, 
              ease: showConfig.easing 
            }
          },
          exit: { 
            opacity: 0,
            transition: { 
              duration: hideConfig.duration, 
              ease: hideConfig.easing 
            }
          }
        };

      case 'slide':
        return {
          initial: { 
            opacity: 0,
            y: -20,
            scale: 0.95
          },
          animate: { 
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { 
              duration: showConfig.duration, 
              ease: showConfig.easing 
            }
          },
          exit: { 
            opacity: 0,
            y: -20,
            scale: 0.95,
            transition: { 
              duration: hideConfig.duration, 
              ease: hideConfig.easing 
            }
          }
        };

      case 'scale':
        return {
          initial: { 
            opacity: 0,
            scale: 0.8
          },
          animate: { 
            opacity: 1,
            scale: 1,
            transition: { 
              duration: showConfig.duration, 
              ease: showConfig.easing 
            }
          },
          exit: { 
            opacity: 0,
            scale: 0.8,
            transition: { 
              duration: hideConfig.duration, 
              ease: hideConfig.easing 
            }
          }
        };

      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={className}
        >
          <PositioningGrid
            grid={grid}
            canvasSize={canvasSize}
            visible={true}
          />
          
          {/* Snap effect overlay */}
          {snapEffect && (
            <motion.div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 20
              }}
              initial={{ opacity: 0, scale: 1 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: config.onSnap.duration,
                ease: config.onSnap.easing,
                repeat: 1,
                repeatType: "reverse"
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
                  border: '2px solid rgba(0, 212, 255, 0.3)',
                  borderRadius: '8px'
                }}
              />
            </motion.div>
          )}

          {/* Grid info with animation */}
          <motion.div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'rgba(0, 212, 255, 0.9)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'monospace',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              zIndex: 30
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: 0.1, duration: 0.2 }
            }}
            exit={{ 
              opacity: 0, 
              y: -10,
              transition: { duration: 0.1 }
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📐 Grid</div>
            <div>Spacing: {grid.spacing}px</div>
            <div>Canvas: {canvasSize.width}×{canvasSize.height}</div>
            <div>Snap: {grid.snapEnabled ? 'ON' : 'OFF'}</div>
            {isAnimating && (
              <div style={{ color: 'rgba(0, 212, 255, 0.6)', fontSize: '10px' }}>
                Animating...
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
