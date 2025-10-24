import { useState, useCallback, useEffect } from 'react';
import type { LayeredObjectConfig, ObjectInteractionState } from '../types/layeredObjects';

/**
 * Hook for managing object interactions and cascade effects
 * Handles the state of which objects are active and their relationships
 */
export const useObjectInteractions = (objects: LayeredObjectConfig[]) => {
  const [state, setState] = useState<ObjectInteractionState>({
    activeObjects: new Set(),
    objectStates: new Map(),
    interactionHistory: []
  });

  // Initialize object states
  useEffect(() => {
    const initialStates = new Map<string, 'idle' | 'active' | 'processing' | 'disabled'>();
    objects.forEach(obj => {
      initialStates.set(obj.id, 'idle');
    });
    
    setState(prev => ({
      ...prev,
      objectStates: initialStates
    }));
  }, [objects]);

  const activateObject = useCallback((objectId: string) => {
    setState(prev => {
      const object = objects.find(obj => obj.id === objectId);
      if (!object?.interactions) return prev;

      const newActiveObjects = new Set(prev.activeObjects);
      newActiveObjects.add(objectId);

      const newObjectStates = new Map(prev.objectStates);
      newObjectStates.set(objectId, 'active');

      // Activate affected objects with cascade delay
      if (object.interactions.affects) {
        const cascadeDelay = object.interactions.cascadeDelay || 100;
        
        object.interactions.affects.forEach((targetId, index) => {
          // Stagger the activation for visual effect
          setTimeout(() => {
            setState(currentState => {
              const updatedActiveObjects = new Set(currentState.activeObjects);
              updatedActiveObjects.add(targetId);
              
              const updatedObjectStates = new Map(currentState.objectStates);
              updatedObjectStates.set(targetId, 'active');
              
              return {
                ...currentState,
                activeObjects: updatedActiveObjects,
                objectStates: updatedObjectStates
              };
            });
          }, cascadeDelay * (index + 1));
        });
      }

      // Record interaction
      const newHistory = [...prev.interactionHistory, {
        timestamp: Date.now(),
        source: objectId,
        targets: object.interactions.affects || [],
        action: 'activate' as const
      }];

      // Trigger onActivate callback
      if (object.interactions.onActivate) {
        object.interactions.onActivate(object.interactions.affects || []);
      }


      return {
        ...prev,
        activeObjects: newActiveObjects,
        objectStates: newObjectStates,
        interactionHistory: newHistory
      };
    });
  }, [objects]);

  const deactivateObject = useCallback((objectId: string) => {
    setState(prev => {
      const object = objects.find(obj => obj.id === objectId);
      if (!object?.interactions) return prev;

      const newActiveObjects = new Set(prev.activeObjects);
      newActiveObjects.delete(objectId);

      const newObjectStates = new Map(prev.objectStates);
      newObjectStates.set(objectId, 'idle');

      // Deactivate affected objects
      if (object.interactions.affects) {
        object.interactions.affects.forEach(targetId => {
          newActiveObjects.delete(targetId);
          newObjectStates.set(targetId, 'idle');
        });
      }

      // Trigger onDeactivate callback
      if (object.interactions.onDeactivate) {
        object.interactions.onDeactivate(object.interactions.affects || []);
      }


      return {
        ...prev,
        activeObjects: newActiveObjects,
        objectStates: newObjectStates
      };
    });
  }, [objects]);

  const toggleObject = useCallback((objectId: string) => {
    if (state.activeObjects.has(objectId)) {
      deactivateObject(objectId);
    } else {
      activateObject(objectId);
    }
  }, [state.activeObjects, activateObject, deactivateObject]);

  const isObjectActive = useCallback((objectId: string) => {
    return state.activeObjects.has(objectId);
  }, [state.activeObjects]);

  const getObjectState = useCallback((objectId: string) => {
    return state.objectStates.get(objectId) || 'idle';
  }, [state.objectStates]);

  const resetAllObjects = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeObjects: new Set(),
      objectStates: new Map(objects.map(obj => [obj.id, 'idle']))
    }));
    console.log('🔄 Reset all objects to idle state');
  }, [objects]);

  const getActiveObjects = useCallback(() => {
    return Array.from(state.activeObjects);
  }, [state.activeObjects]);

  const getInteractionHistory = useCallback(() => {
    return state.interactionHistory;
  }, [state.interactionHistory]);

  return {
    state,
    activateObject,
    deactivateObject,
    toggleObject,
    isObjectActive,
    getObjectState,
    resetAllObjects,
    getActiveObjects,
    getInteractionHistory
  };
};
