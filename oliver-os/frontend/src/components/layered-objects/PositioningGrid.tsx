import React from 'react';
import type { PositioningState } from '../../types/layeredObjects';

interface PositioningGridProps {
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
}

/**
 * PositioningGrid Component
 * Renders a visual grid overlay for precise object positioning
 * Supports customizable spacing and snap-to-grid functionality
 */
export const PositioningGrid: React.FC<PositioningGridProps> = ({
  grid,
  canvasSize,
  visible,
  className = ''
}) => {
  if (!visible || !grid.visible) {
    return null;
  }

  const { spacing } = grid;
  const { width, height } = canvasSize;

  // Calculate grid lines
  const verticalLines = [];
  const horizontalLines = [];

  // Vertical lines
  for (let x = 0; x <= width; x += spacing) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="rgba(0, 212, 255, 0.6)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += spacing) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(0, 212, 255, 0.6)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  // Major grid lines (every 4th line)
  const majorVerticalLines = [];
  const majorHorizontalLines = [];

  for (let x = 0; x <= width; x += spacing * 4) {
    majorVerticalLines.push(
      <line
        key={`mv-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="rgba(0, 212, 255, 0.8)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  for (let y = 0; y <= height; y += spacing * 4) {
    majorHorizontalLines.push(
      <line
        key={`mh-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(0, 212, 255, 0.8)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <div
      className={`positioning-grid ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        opacity: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.1)' // Add subtle background to make grid more visible
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* Minor grid lines */}
        {verticalLines}
        {horizontalLines}
        
        {/* Major grid lines */}
        {majorVerticalLines}
        {majorHorizontalLines}
        
        {/* Center lines */}
        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={height}
          stroke="rgba(0, 212, 255, 0.8)"
          strokeWidth="2"
          strokeDasharray="5,5"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="rgba(0, 212, 255, 0.8)"
          strokeWidth="2"
          strokeDasharray="5,5"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Corner markers */}
        <circle
          cx={0}
          cy={0}
          r="4"
          fill="rgba(0, 212, 255, 0.8)"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={width}
          cy={0}
          r="4"
          fill="rgba(0, 212, 255, 0.8)"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={0}
          cy={height}
          r="4"
          fill="rgba(0, 212, 255, 0.8)"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx={width}
          cy={height}
          r="4"
          fill="rgba(0, 212, 255, 0.8)"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Center marker */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r="6"
          fill="rgba(0, 212, 255, 0.9)"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      
      {/* Grid info overlay */}
      <div
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
          border: '1px solid rgba(0, 212, 255, 0.3)'
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>📐 Grid</div>
        <div>Spacing: {spacing}px</div>
        <div>Canvas: {width}×{height}</div>
        <div>Lines: {Math.floor(width / spacing)}×{Math.floor(height / spacing)}</div>
      </div>
    </div>
  );
};
