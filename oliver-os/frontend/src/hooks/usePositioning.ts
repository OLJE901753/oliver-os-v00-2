import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  PositioningState, 
  ObjectPosition, 
  DragState, 
  PositioningPreset 
} from '../types/layeredObjects';
import { 
  POSITIONING_PRESETS, 
  getPresetById, 
  applyPreset, 
  createCustomPreset 
} from '../utils/positioningPresets';

/**
 * Hook for managing object positioning state and interactions
 * Handles drag-and-drop, grid snapping, position history, and presets
 */
export const usePositioning = (objects: any[], onObjectUpdate: (id: string, updates: any) => void) => {
  const [state, setState] = useState<PositioningState>({
    selectedObjectId: null,
    positioningMode: false,
    grid: {
      visible: false,
      spacing: 16,
      snapEnabled: true
    },
    positionHistory: [],
    historyIndex: -1
  });

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStartPosition: { x: 0, y: 0 },
    dragOffset: { x: 0, y: 0 },
    draggedObjectId: null
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize position history
  useEffect(() => {
    if (objects.length > 0 && state.positionHistory.length === 0) {
      const initialHistory = objects.map(obj => ({
        timestamp: Date.now(),
        objectId: obj.id,
        position: obj.position
      }));
      
      setState(prev => ({
        ...prev,
        positionHistory: initialHistory,
        historyIndex: initialHistory.length - 1
      }));
    }
  }, [objects, state.positionHistory.length]);

  // Save position to history
  const savePositionToHistory = useCallback((objectId: string, position: ObjectPosition) => {
    setState(prev => {
      const newHistory = [...prev.positionHistory];
      const newEntry = {
        timestamp: Date.now(),
        objectId,
        position
      };

      // Remove any future history if we're not at the end
      if (prev.historyIndex < prev.positionHistory.length - 1) {
        newHistory.splice(prev.historyIndex + 1);
      }

      newHistory.push(newEntry);
      
      return {
        ...prev,
        positionHistory: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Snap position to grid
  const snapToGrid = useCallback((position: ObjectPosition): ObjectPosition => {
    if (!state.grid.snapEnabled) return position;

    const snap = (value: number, spacing: number) => {
      return Math.round(value / spacing) * spacing;
    };

    return {
      ...position,
      x: snap(position.x, state.grid.spacing),
      y: snap(position.y, state.grid.spacing),
      width: snap(position.width, state.grid.spacing),
      height: snap(position.height, state.grid.spacing)
    };
  }, [state.grid.snapEnabled, state.grid.spacing]);

  // Update object position
  const updateObjectPosition = useCallback((objectId: string, newPosition: ObjectPosition) => {
    const snappedPosition = snapToGrid(newPosition);
    
    // Save to history
    savePositionToHistory(objectId, snappedPosition);
    
    // Update object
    onObjectUpdate(objectId, { position: snappedPosition });
  }, [snapToGrid, savePositionToHistory, onObjectUpdate]);

  // Start drag operation
  const startDrag = useCallback((objectId: string, startX: number, startY: number) => {
    const object = objects.find(obj => obj.id === objectId);
    if (!object || object.position.locked) return;

    setDragState({
      isDragging: true,
      dragStartPosition: { x: startX, y: startY },
      dragOffset: { x: 0, y: 0 },
      draggedObjectId: objectId
    });

    setState(prev => ({
      ...prev,
      selectedObjectId: objectId
    }));
  }, [objects]);

  // Update drag position
  const updateDrag = useCallback((currentX: number, currentY: number) => {
    if (!dragState.isDragging || !dragState.draggedObjectId) return;

    const deltaX = currentX - dragState.dragStartPosition.x;
    const deltaY = currentY - dragState.dragStartPosition.y;

    setDragState(prev => ({
      ...prev,
      dragOffset: { x: deltaX, y: deltaY }
    }));
  }, [dragState.isDragging, dragState.dragStartPosition, dragState.draggedObjectId]);

  // End drag operation
  const endDrag = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedObjectId) return;

    const object = objects.find(obj => obj.id === dragState.draggedObjectId);
    if (!object) return;

    const newPosition: ObjectPosition = {
      ...object.position,
      x: object.position.x + dragState.dragOffset.x,
      y: object.position.y + dragState.dragOffset.y
    };

    updateObjectPosition(dragState.draggedObjectId, newPosition);

    setDragState({
      isDragging: false,
      dragStartPosition: { x: 0, y: 0 },
      dragOffset: { x: 0, y: 0 },
      draggedObjectId: null
    });
  }, [dragState, objects, updateObjectPosition]);

  // Toggle positioning mode
  const togglePositioningMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      positioningMode: !prev.positioningMode,
      selectedObjectId: null
    }));
  }, []);

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      grid: {
        ...prev.grid,
        visible: !prev.grid.visible
      }
    }));
  }, []);

  // Update grid spacing
  const updateGridSpacing = useCallback((spacing: number) => {
    setState(prev => ({
      ...prev,
      grid: {
        ...prev.grid,
        spacing: Math.max(4, spacing)
      }
    }));
  }, []);

  // Toggle snap to grid
  const toggleSnapToGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      grid: {
        ...prev.grid,
        snapEnabled: !prev.grid.snapEnabled
      }
    }));
  }, []);

  // Select object
  const selectObject = useCallback((objectId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedObjectId: objectId
    }));
  }, []);

  // Apply preset
  const applyPresetToObjects = useCallback((preset: PositioningPreset) => {
    preset.objects.forEach(presetObject => {
      const object = objects.find(obj => obj.id === presetObject.id);
      if (object) {
        updateObjectPosition(presetObject.id, presetObject.position);
      }
    });
  }, [objects, updateObjectPosition]);

  // Undo position change
  const undoPosition = useCallback(() => {
    if (state.historyIndex > 0) {
      const previousEntry = state.positionHistory[state.historyIndex - 1];
      onObjectUpdate(previousEntry.objectId, { position: previousEntry.position });
      
      setState(prev => ({
        ...prev,
        historyIndex: prev.historyIndex - 1
      }));
    }
  }, [state.historyIndex, state.positionHistory, onObjectUpdate]);

  // Redo position change
  const redoPosition = useCallback(() => {
    if (state.historyIndex < state.positionHistory.length - 1) {
      const nextEntry = state.positionHistory[state.historyIndex + 1];
      onObjectUpdate(nextEntry.objectId, { position: nextEntry.position });
      
      setState(prev => ({
        ...prev,
        historyIndex: prev.historyIndex + 1
      }));
    }
  }, [state.historyIndex, state.positionHistory, onObjectUpdate]);

  // Reset all positions
  const resetAllPositions = useCallback(() => {
    objects.forEach(obj => {
      const originalPosition = state.positionHistory.find(entry => 
        entry.objectId === obj.id
      );
      if (originalPosition) {
        onObjectUpdate(obj.id, { position: originalPosition.position });
      }
    });
  }, [objects, state.positionHistory, onObjectUpdate]);

  // Get current drag position for an object
  const getDragPosition = useCallback((objectId: string): ObjectPosition | null => {
    if (!dragState.isDragging || dragState.draggedObjectId !== objectId) {
      return null;
    }

    const object = objects.find(obj => obj.id === objectId);
    if (!object) return null;

    return {
      ...object.position,
      x: object.position.x + dragState.dragOffset.x,
      y: object.position.y + dragState.dragOffset.y
    };
  }, [dragState, objects]);

  // Check if object is selected
  const isObjectSelected = useCallback((objectId: string): boolean => {
    return state.selectedObjectId === objectId;
  }, [state.selectedObjectId]);

  // Check if object is being dragged
  const isObjectDragging = useCallback((objectId: string): boolean => {
    return dragState.isDragging && dragState.draggedObjectId === objectId;
  }, [dragState]);

  return {
    state,
    dragState,
    canvasRef,
    // Actions
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
    // Getters
    getDragPosition,
    isObjectSelected,
    isObjectDragging,
    // Presets
    availablePresets: POSITIONING_PRESETS,
    getPresetById
  };
};
