import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  AssetManagerState, 
  LayeredObjectConfig,
  AssetLoadingState 
} from '../types/layeredObjects';

/**
 * Custom hook for managing AI art assets with efficient loading and caching
 * Handles the 3-layer system: full background, background without object, isolated object
 */
export const useAssetManager = (objects: LayeredObjectConfig[]) => {
  const [state, setState] = useState<AssetManagerState>({
    loading: new Set(),
    loaded: new Set(),
    failed: new Set(),
    cache: new Map(),
    progress: 0,
    totalAssets: 0
  });

  const loadingPromises = useRef<Map<string, Promise<HTMLImageElement>>>(new Map());
  const maxConcurrentLoads = 5;
  const cacheSizeLimit = 50;

  // Calculate total assets to load
  useEffect(() => {
    const totalAssets = objects.reduce((total, obj) => {
      return total + Object.keys(obj.assets).length;
    }, 0);
    
    setState(prev => ({ ...prev, totalAssets }));
  }, [objects]);

  // Load a single asset
  const loadAsset = useCallback(async (assetPath: string): Promise<HTMLImageElement> => {
    // Return cached asset if available
    if (state.cache.has(assetPath)) {
      return state.cache.get(assetPath)!;
    }

    // Return existing promise if already loading
    if (loadingPromises.current.has(assetPath)) {
      return loadingPromises.current.get(assetPath)!;
    }

    // Create new loading promise
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // Add to cache
        if (state.cache.size >= cacheSizeLimit) {
          // Remove oldest cached item (simple LRU)
          const firstKey = state.cache.keys().next().value;
          if (firstKey) {
            state.cache.delete(firstKey);
          }
        }
        
        state.cache.set(assetPath, img);
        
        // Update state
        setState(prev => ({
          ...prev,
          loading: new Set([...prev.loading].filter(key => key !== assetPath)),
          loaded: new Set([...prev.loaded, assetPath]),
          progress: Math.round((prev.loaded.size + 1) / prev.totalAssets * 100)
        }));
        
        loadingPromises.current.delete(assetPath);
        resolve(img);
      };
      
      img.onerror = (error) => {
        setState(prev => ({
          ...prev,
          loading: new Set([...prev.loading].filter(key => key !== assetPath)),
          failed: new Set([...prev.failed, assetPath]),
          progress: Math.round((prev.loaded.size) / prev.totalAssets * 100)
        }));
        
        loadingPromises.current.delete(assetPath);
        reject(new Error(`Failed to load asset: ${assetPath}`));
      };
      
      img.src = assetPath;
    });

    loadingPromises.current.set(assetPath, promise);
    
    setState(prev => ({
      ...prev,
      loading: new Set([...prev.loading, assetPath])
    }));

    return promise;
  }, [state.cache, state.loaded.size, state.totalAssets]);

  // Load all assets for a specific object
  const loadObjectAssets = useCallback(async (objectConfig: LayeredObjectConfig) => {
    const assetPaths = Object.values(objectConfig.assets);
    const promises = assetPaths.map(path => loadAsset(path));
    
    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error(`Failed to load assets for object ${objectConfig.id}:`, error);
      return false;
    }
  }, [loadAsset]);

  // Load all assets with concurrency control
  const loadAllAssets = useCallback(async () => {
    const allAssetPaths = objects.flatMap(obj => Object.values(obj.assets));
    
    // Process assets in batches to control concurrency
    for (let i = 0; i < allAssetPaths.length; i += maxConcurrentLoads) {
      const batch = allAssetPaths.slice(i, i + maxConcurrentLoads);
      const promises = batch.map(path => loadAsset(path));
      
      try {
        await Promise.all(promises);
      } catch (error) {
        console.error(`Failed to load asset batch starting at index ${i}:`, error);
      }
    }
  }, [objects, loadAsset]);

  // Preload critical assets (first few objects)
  const preloadCriticalAssets = useCallback(async () => {
    const criticalObjects = objects.slice(0, 3); // First 3 objects
    const promises = criticalObjects.map(obj => loadObjectAssets(obj));
    
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to preload critical assets:', error);
    }
  }, [objects, loadObjectAssets]);

  // Get asset loading state for a specific object
  const getObjectAssetState = useCallback((objectConfig: LayeredObjectConfig): AssetLoadingState => {
    const assetPaths = Object.values(objectConfig.assets);
    const loadedCount = assetPaths.filter(path => state.loaded.has(path)).length;
    const failedCount = assetPaths.filter(path => state.failed.has(path)).length;
    const loadingCount = assetPaths.filter(path => state.loading.has(path)).length;
    
    const progress = assetPaths.length > 0 ? Math.round((loadedCount / assetPaths.length) * 100) : 100;
    const loaded = loadedCount === assetPaths.length;
    const loading = loadingCount > 0;
    const error = failedCount > 0 ? `${failedCount} assets failed to load` : undefined;
    
    return { loading, loaded, error, progress };
  }, [state]);

  // Check if all assets are loaded
  const allAssetsLoaded = state.loaded.size === state.totalAssets && state.totalAssets > 0;

  // Get loading progress percentage
  const loadingProgress = state.totalAssets > 0 ? Math.round((state.loaded.size / state.totalAssets) * 100) : 0;

  // Clear cache
  const clearCache = useCallback(() => {
    setState(prev => ({
      ...prev,
      cache: new Map(),
      loaded: new Set(),
      failed: new Set(),
      progress: 0
    }));
    loadingPromises.current.clear();
  }, []);

  // Retry failed assets
  const retryFailedAssets = useCallback(async () => {
    const failedPaths = Array.from(state.failed);
    setState(prev => ({
      ...prev,
      failed: new Set()
    }));
    
    const promises = failedPaths.map(path => loadAsset(path));
    await Promise.allSettled(promises);
  }, [state.failed, loadAsset]);

  return {
    // State
    state,
    allAssetsLoaded,
    loadingProgress,
    
    // Actions
    loadAsset,
    loadObjectAssets,
    loadAllAssets,
    preloadCriticalAssets,
    clearCache,
    retryFailedAssets,
    
    // Utilities
    getObjectAssetState,
    isAssetLoaded: (assetPath: string) => state.loaded.has(assetPath),
    isAssetLoading: (assetPath: string) => state.loading.has(assetPath),
    isAssetFailed: (assetPath: string) => state.failed.has(assetPath),
    getCachedAsset: (assetPath: string) => state.cache.get(assetPath)
  };
};
