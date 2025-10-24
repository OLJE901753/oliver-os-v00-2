import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AnimationDebuggerProps {
  /** Whether debugger is visible */
  visible: boolean;
  /** Animation state data */
  animationData: {
    activeAnimations: string[];
    animationQueue: Array<{
      objectId: string;
      animation: string;
      timestamp: number;
    }>;
    performance: {
      fps: number;
      frameTime: number;
      memoryUsage: number;
    };
  };
  /** Toggle debugger visibility */
  onToggle: () => void;
}

/**
 * Animation Debugger Component
 * Provides real-time monitoring of animation performance and state
 */
export const AnimationDebugger: React.FC<AnimationDebuggerProps> = ({
  visible,
  animationData,
  onToggle
}) => {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);

  // Monitor FPS
  useEffect(() => {
    if (!visible) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const measureFPS = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;
      frameCount++;

      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        setFrameTime(deltaTime);
        frameCount = 0;
        lastFpsUpdate = now;
      }

      lastTime = now;
      requestAnimationFrame(measureFPS);
    };

    requestAnimationFrame(measureFPS);
  }, [visible]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '300px',
        maxHeight: '80vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        color: 'rgba(0, 212, 255, 1)',
        padding: '16px',
        borderRadius: '8px',
        border: '2px solid rgba(0, 212, 255, 0.5)',
        backdropFilter: 'blur(10px)',
        zIndex: 10000,
        fontSize: '12px',
        fontFamily: 'monospace',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(0, 212, 255, 0.3)'
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          🎬 Animation Debugger
        </h3>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(0, 212, 255, 0.2)',
            border: '1px solid rgba(0, 212, 255, 0.5)',
            color: 'rgba(0, 212, 255, 1)',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Performance Metrics */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(0, 212, 255, 0.8)' }}>
          📊 Performance
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <div style={{ color: 'rgba(0, 212, 255, 0.6)' }}>FPS:</div>
            <div style={{ 
              color: fps >= 55 ? 'rgba(0, 255, 0, 1)' : fps >= 30 ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 0, 0, 1)',
              fontWeight: 'bold'
            }}>
              {fps}
            </div>
          </div>
          <div>
            <div style={{ color: 'rgba(0, 212, 255, 0.6)' }}>Frame Time:</div>
            <div style={{ 
              color: frameTime <= 16.67 ? 'rgba(0, 255, 0, 1)' : frameTime <= 33.33 ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 0, 0, 1)',
              fontWeight: 'bold'
            }}>
              {frameTime.toFixed(2)}ms
            </div>
          </div>
        </div>
      </div>

      {/* Active Animations */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(0, 212, 255, 0.8)' }}>
          🎭 Active Animations ({animationData.activeAnimations.length})
        </h4>
        <div style={{ 
          maxHeight: '100px', 
          overflowY: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '8px',
          borderRadius: '4px'
        }}>
          {animationData.activeAnimations.length === 0 ? (
            <div style={{ color: 'rgba(0, 212, 255, 0.5)', fontStyle: 'italic' }}>
              No active animations
            </div>
          ) : (
            animationData.activeAnimations.map((objectId, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                padding: '2px 6px',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderRadius: '3px',
                fontSize: '11px'
              }}>
                {objectId}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Animation Queue */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(0, 212, 255, 0.8)' }}>
          ⏳ Animation Queue ({animationData.animationQueue.length})
        </h4>
        <div style={{ 
          maxHeight: '100px', 
          overflowY: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          padding: '8px',
          borderRadius: '4px'
        }}>
          {animationData.animationQueue.length === 0 ? (
            <div style={{ color: 'rgba(0, 212, 255, 0.5)', fontStyle: 'italic' }}>
              Queue is empty
            </div>
          ) : (
            animationData.animationQueue.map((item, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                padding: '2px 6px',
                backgroundColor: 'rgba(0, 212, 255, 0.1)',
                borderRadius: '3px',
                fontSize: '11px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>{item.objectId}</span>
                <span style={{ color: 'rgba(0, 212, 255, 0.6)' }}>
                  {item.animation}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Test Controls */}
      <div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(0, 212, 255, 0.8)' }}>
          🧪 Test Controls
        </h4>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              // Trigger test animation
              console.log('🎬 Test animation triggered');
            }}
            style={{
              background: 'rgba(0, 212, 255, 0.2)',
              border: '1px solid rgba(0, 212, 255, 0.5)',
              color: 'rgba(0, 212, 255, 1)',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Test Animation
          </button>
          <button
            onClick={() => {
              // Clear all animations
              console.log('🧹 Clear all animations');
            }}
            style={{
              background: 'rgba(255, 0, 0, 0.2)',
              border: '1px solid rgba(255, 0, 0, 0.5)',
              color: 'rgba(255, 0, 0, 1)',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            Clear All
          </button>
        </div>
      </div>
    </motion.div>
  );
};
