import React, { useState, useCallback } from 'react';
import type { ObjectPosition, PositioningPreset } from '../../types/layeredObjects';

interface PositionInspectorProps {
  /** Currently selected object */
  selectedObject: {
    id: string;
    name: string;
    position: ObjectPosition;
  } | null;
  /** Available presets */
  presets: PositioningPreset[];
  /** Grid settings */
  grid: {
    visible: boolean;
    spacing: number;
    snapEnabled: boolean;
  };
  /** Position history state */
  history: {
    canUndo: boolean;
    canRedo: boolean;
  };
  /** Event handlers */
  onPositionUpdate: (objectId: string, position: ObjectPosition) => void;
  onPresetApply: (preset: PositioningPreset) => void;
  onGridToggle: () => void;
  onGridSpacingChange: (spacing: number) => void;
  onSnapToggle: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  /** Custom CSS classes */
  className?: string;
}

/**
 * PositionInspector Component
 * Provides real-time position editing tools and controls
 * Includes preset management, grid controls, and position history
 */
export const PositionInspector: React.FC<PositionInspectorProps> = ({
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
  className = ''
}) => {
  const [localPosition, setLocalPosition] = useState<ObjectPosition | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  // Update local position when selected object changes
  React.useEffect(() => {
    if (selectedObject) {
      setLocalPosition(selectedObject.position);
    } else {
      setLocalPosition(null);
    }
  }, [selectedObject]);

  // Handle position input changes
  const handlePositionChange = useCallback((field: keyof ObjectPosition, value: number) => {
    if (!selectedObject || !localPosition) return;

    const newPosition = {
      ...localPosition,
      [field]: value
    };

    setLocalPosition(newPosition);
    
    // Apply changes immediately
    onPositionUpdate(selectedObject.id, newPosition);
  }, [selectedObject, localPosition, onPositionUpdate]);

  // Handle offset changes
  const handleOffsetChange = useCallback((field: 'x' | 'y', value: number) => {
    if (!selectedObject || !localPosition) return;

    const newPosition = {
      ...localPosition,
      offset: {
        ...localPosition.offset,
        [field]: value
      }
    };

    setLocalPosition(newPosition);
    onPositionUpdate(selectedObject.id, newPosition);
  }, [selectedObject, localPosition, onPositionUpdate]);

  // Handle anchor change
  const handleAnchorChange = useCallback((anchor: ObjectPosition['anchor']) => {
    if (!selectedObject || !localPosition) return;

    const newPosition = {
      ...localPosition,
      anchor
    };

    setLocalPosition(newPosition);
    onPositionUpdate(selectedObject.id, newPosition);
  }, [selectedObject, localPosition, onPositionUpdate]);

  // Handle preset selection
  const handlePresetSelect = useCallback((preset: PositioningPreset) => {
    onPresetApply(preset);
    setShowPresets(false);
  }, [onPresetApply]);

  if (!selectedObject) {
    return (
      <div className={`position-inspector ${className}`}>
        <div className="inspector-header">
          <h3>Position Inspector</h3>
          <p>Select an object to edit its position</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`position-inspector ${className}`}>
      {/* Header */}
      <div className="inspector-header">
        <h3>Position Inspector</h3>
        <div className="object-info">
          <span className="object-name">{selectedObject.name}</span>
          <span className="object-id">({selectedObject.id})</span>
        </div>
      </div>

      {/* Position Controls */}
      <div className="position-controls">
        <div className="control-group">
          <label>Position</label>
          <div className="input-row">
            <div className="input-field">
              <label>X</label>
              <input
                type="number"
                value={localPosition?.x || 0}
                onChange={(e) => handlePositionChange('x', Number(e.target.value))}
                step={grid.snapEnabled ? grid.spacing : 1}
              />
            </div>
            <div className="input-field">
              <label>Y</label>
              <input
                type="number"
                value={localPosition?.y || 0}
                onChange={(e) => handlePositionChange('y', Number(e.target.value))}
                step={grid.snapEnabled ? grid.spacing : 1}
              />
            </div>
          </div>
        </div>

        <div className="control-group">
          <label>Size</label>
          <div className="input-row">
            <div className="input-field">
              <label>Width</label>
              <input
                type="number"
                value={localPosition?.width || 0}
                onChange={(e) => handlePositionChange('width', Number(e.target.value))}
                step={grid.snapEnabled ? grid.spacing : 1}
                min="1"
              />
            </div>
            <div className="input-field">
              <label>Height</label>
              <input
                type="number"
                value={localPosition?.height || 0}
                onChange={(e) => handlePositionChange('height', Number(e.target.value))}
                step={grid.snapEnabled ? grid.spacing : 1}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Offset Controls */}
        {localPosition?.offset && (
          <div className="control-group">
            <label>Offset</label>
            <div className="input-row">
              <div className="input-field">
                <label>X</label>
                <input
                  type="number"
                  value={localPosition.offset.x}
                  onChange={(e) => handleOffsetChange('x', Number(e.target.value))}
                  step="1"
                />
              </div>
              <div className="input-field">
                <label>Y</label>
                <input
                  type="number"
                  value={localPosition.offset.y}
                  onChange={(e) => handleOffsetChange('y', Number(e.target.value))}
                  step="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Anchor Selection */}
        <div className="control-group">
          <label>Anchor</label>
          <select
            value={localPosition?.anchor || 'top-left'}
            onChange={(e) => handleAnchorChange(e.target.value as ObjectPosition['anchor'])}
          >
            <option value="top-left">Top Left</option>
            <option value="top-center">Top Center</option>
            <option value="top-right">Top Right</option>
            <option value="center-left">Center Left</option>
            <option value="center">Center</option>
            <option value="center-right">Center Right</option>
            <option value="bottom-left">Bottom Left</option>
            <option value="bottom-center">Bottom Center</option>
            <option value="bottom-right">Bottom Right</option>
          </select>
        </div>
      </div>

      {/* Grid Controls */}
      <div className="grid-controls">
        <h4>Grid Settings</h4>
        <div className="control-row">
          <label>
            <input
              type="checkbox"
              checked={grid.visible}
              onChange={onGridToggle}
            />
            Show Grid
          </label>
        </div>
        <div className="control-row">
          <label>
            <input
              type="checkbox"
              checked={grid.snapEnabled}
              onChange={onSnapToggle}
            />
            Snap to Grid
          </label>
        </div>
        <div className="control-row">
          <label>
            Spacing:
            <input
              type="range"
              min="4"
              max="64"
              step="4"
              value={grid.spacing}
              onChange={(e) => onGridSpacingChange(Number(e.target.value))}
            />
            <span>{grid.spacing}px</span>
          </label>
        </div>
      </div>

      {/* Presets */}
      <div className="presets-section">
        <div className="presets-header">
          <h4>Layout Presets</h4>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="toggle-presets"
          >
            {showPresets ? 'Hide' : 'Show'} Presets
          </button>
        </div>
        
        {showPresets && (
          <div className="presets-list">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="preset-item"
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="preset-name">{preset.name}</div>
                <div className="preset-description">{preset.description}</div>
                <div className="preset-objects">
                  {preset.objects.length} objects
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Controls */}
      <div className="history-controls">
        <h4>Position History</h4>
        <div className="history-buttons">
          <button
            onClick={onUndo}
            disabled={!history.canUndo}
            className="history-btn undo"
          >
            ↶ Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!history.canRedo}
            className="history-btn redo"
          >
            ↷ Redo
          </button>
          <button
            onClick={onReset}
            className="history-btn reset"
          >
            ↻ Reset All
          </button>
        </div>
      </div>

      {/* Object Properties */}
      <div className="object-properties">
        <h4>Object Properties</h4>
        <div className="property-list">
          <div className="property-item">
            <span className="property-label">Locked:</span>
            <span className="property-value">
              {localPosition?.locked ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="property-item">
            <span className="property-label">Snap to Grid:</span>
            <span className="property-value">
              {localPosition?.snapToGrid?.enabled ? 'Yes' : 'No'}
            </span>
          </div>
          {localPosition?.snapToGrid?.enabled && (
            <div className="property-item">
              <span className="property-label">Snap Spacing:</span>
              <span className="property-value">
                {localPosition.snapToGrid.spacing}px
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
