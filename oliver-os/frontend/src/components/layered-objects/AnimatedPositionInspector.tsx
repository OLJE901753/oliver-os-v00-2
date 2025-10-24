import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PositionInspector } from './PositionInspector';
import type { 
  LayeredObjectConfig, 
  PositioningPreset, 
  PositioningState 
} from '../../types/layeredObjects';

interface AnimatedPositionInspectorProps {
  /** Selected object for positioning */
  selectedObject: LayeredObjectConfig | null;
  /** Available positioning presets */
  presets: PositioningPreset[];
  /** Grid configuration */
  grid: PositioningState['grid'];
  /** History state */
  history: {
    canUndo: boolean;
    canRedo: boolean;
  };
  /** Event handlers */
  onPositionUpdate: (objectId: string, position: any) => void;
  onPresetApply: (preset: PositioningPreset) => void;
  onGridToggle: () => void;
  onGridSpacingChange: (spacing: number) => void;
  onSnapToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  /** Animation configuration */
  animationConfig?: {
    /** Animation when inspector appears */
    onShow?: {
      duration?: number;
      easing?: string;
      type?: 'slide' | 'fade' | 'scale';
    };
    /** Animation when inspector disappears */
    onHide?: {
      duration?: number;
      easing?: string;
      type?: 'slide' | 'fade' | 'scale';
    };
    /** Animation for value changes */
    onValueChange?: {
      duration?: number;
      easing?: string;
      type?: 'pulse' | 'glow' | 'shake';
    };
  };
}

/**
 * Enhanced PositionInspector with smooth animations
 * Adds animated appearance, value change effects, and smooth transitions
 */
export const AnimatedPositionInspector: React.FC<AnimatedPositionInspectorProps> = ({
  selectedObject,
  presets,
  grid,
  history,
  onPositionUpdate,
  onPresetApply,
  onGridToggle,
  onGridSpacingChange,
  onSnapToggle,
  onUndo,
  onRedo,
  onReset,
  animationConfig = {}
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatingValue, setAnimatingValue] = useState<string | null>(null);

  // Default animation configuration
  const defaultConfig = {
    onShow: {
      duration: 0.3,
      easing: 'easeOut',
      type: 'slide' as const
    },
    onHide: {
      duration: 0.2,
      easing: 'easeIn',
      type: 'slide' as const
    },
    onValueChange: {
      duration: 0.15,
      easing: 'easeOut',
      type: 'pulse' as const
    }
  };

  const config = {
    onShow: { ...defaultConfig.onShow, ...animationConfig.onShow },
    onHide: { ...defaultConfig.onHide, ...animationConfig.onHide },
    onValueChange: { ...defaultConfig.onValueChange, ...animationConfig.onValueChange }
  };

  // Show/hide inspector based on selected object
  useEffect(() => {
    if (selectedObject) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedObject]);

  // Enhanced position update with animation
  const handlePositionUpdate = (objectId: string, position: any) => {
    // Trigger value change animation
    setAnimatingValue(objectId);
    setTimeout(() => setAnimatingValue(null), config.onValueChange.duration * 1000);
    
    onPositionUpdate(objectId, position);
  };

  // Get animation variants
  const getVariants = () => {
    const showConfig = config.onShow;
    const hideConfig = config.onHide;

    switch (showConfig.type) {
      case 'slide':
        return {
          initial: { 
            opacity: 0,
            x: 300,
            scale: 0.95
          },
          animate: { 
            opacity: 1,
            x: 0,
            scale: 1,
            transition: { 
              duration: showConfig.duration, 
              ease: showConfig.easing,
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          },
          exit: { 
            opacity: 0,
            x: 300,
            scale: 0.95,
            transition: { 
              duration: hideConfig.duration, 
              ease: hideConfig.easing 
            }
          }
        };

      case 'fade':
        return {
          initial: { opacity: 0, scale: 0.9 },
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
            scale: 0.9,
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
            scale: 0.8,
            y: 20
          },
          animate: { 
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { 
              duration: showConfig.duration, 
              ease: showConfig.easing,
              type: "spring",
              stiffness: 400,
              damping: 25
            }
          },
          exit: { 
            opacity: 0,
            scale: 0.8,
            y: 20,
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
      {isVisible && selectedObject && (
        <motion.div
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            width: '320px',
            maxHeight: '80vh',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          <motion.div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'rgba(0, 212, 255, 1)',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid rgba(0, 212, 255, 0.5)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)'
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Header with object info */}
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid rgba(0, 212, 255, 0.3)'
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.1, duration: 0.2 }
              }}
            >
              <div>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: 'rgba(0, 212, 255, 1)'
                }}>
                  📐 Position Inspector
                </h3>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  fontSize: '12px', 
                  color: 'rgba(0, 212, 255, 0.7)'
                }}>
                  {selectedObject.name} ({selectedObject.id})
                </p>
              </div>
              <motion.div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 212, 255, 0.8)',
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.6)'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Animated content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: 1,
                transition: { delay: 0.2, duration: 0.3 }
              }}
            >
              <PositionInspector
                selectedObject={selectedObject}
                presets={presets}
                grid={grid}
                history={history}
                onPositionUpdate={handlePositionUpdate}
                onPresetApply={onPresetApply}
                onGridToggle={onGridToggle}
                onGridSpacingChange={onGridSpacingChange}
                onSnapToggle={onSnapToggle}
                onUndo={onUndo}
                onRedo={onRedo}
                onReset={onReset}
              />
            </motion.div>

            {/* Value change animation overlay */}
            {animatingValue && (
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  zIndex: 10
                }}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: config.onValueChange.duration,
                  ease: config.onValueChange.easing,
                  repeat: 1,
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
