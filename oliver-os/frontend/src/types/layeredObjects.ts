/**
 * TypeScript interfaces for the AI Art Layer-Based UI System
 * Defines the structure for layered objects with 3-layer system
 */

export interface LayeredObjectAssets {
  /** Full background image with all objects */
  fullBackground: string;
  /** Background image with this object removed (hole) */
  backgroundWithoutObject: string;
  /** Isolated object PNG */
  objectIsolated: string;
}

export interface ObjectPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectInteraction {
  /** Click handler function */
  onClick?: () => void;
  /** Hover handler function */
  onHover?: () => void;
  /** Whether the object is currently interactive */
  interactive: boolean;
  /** Custom CSS classes for different states */
  stateClasses?: {
    default?: string;
    hover?: string;
    active?: string;
    disabled?: string;
  };
}

export interface LayeredObjectConfig {
  /** Unique identifier for the object */
  id: string;
  /** Display name */
  name: string;
  /** Object type for categorization */
  type: 'hub' | 'panel' | 'icon' | 'screen' | 'connection' | 'custom';
  /** Asset paths for the 3-layer system */
  assets: LayeredObjectAssets;
  /** Position and dimensions */
  position: ObjectPosition;
  /** Interaction configuration */
  interaction: ObjectInteraction;
  /** Z-index for layering */
  zIndex: number;
  /** Whether object is visible by default */
  visible: boolean;
  /** Animation configuration */
  animation?: {
    /** Transition duration in ms */
    duration?: number;
    /** Easing function */
    easing?: string;
    /** Hover scale factor */
    hoverScale?: number;
    /** Click animation type */
    clickAnimation?: 'pulse' | 'glow' | 'scale' | 'none';
  };
  /** Metadata for the object */
  metadata?: {
    description?: string;
    tags?: string[];
    priority?: number;
    group?: string;
  };
}

export interface AssetLoadingState {
  /** Whether assets are currently loading */
  loading: boolean;
  /** Whether assets have loaded successfully */
  loaded: boolean;
  /** Error message if loading failed */
  error?: string;
  /** Progress percentage (0-100) */
  progress: number;
}

export interface LayeredObjectState {
  /** Current visibility state */
  visible: boolean;
  /** Current interaction state */
  interactive: boolean;
  /** Whether object is currently hovered */
  hovered: boolean;
  /** Whether object is currently active/clicked */
  active: boolean;
  /** Asset loading state */
  assetState: AssetLoadingState;
  /** Custom state data */
  customState?: Record<string, any>;
}

export interface InteractiveCanvasConfig {
  /** Canvas dimensions */
  width: number;
  height: number;
  /** Background configuration */
  background: {
    /** Main background image */
    image?: string;
    /** Fallback background color */
    fallbackColor?: string;
    /** Background fit mode */
    fit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  };
  /** Global interaction settings */
  globalInteraction: {
    /** Whether canvas is interactive */
    enabled: boolean;
    /** Click handler for canvas background */
    onBackgroundClick?: () => void;
  };
  /** Performance settings */
  performance: {
    /** Enable asset preloading */
    preloadAssets: boolean;
    /** Maximum concurrent asset loads */
    maxConcurrentLoads: number;
    /** Asset cache size limit */
    cacheSizeLimit: number;
  };
}

export interface ObjectRegistry {
  /** Registry version */
  version: string;
  /** Canvas configuration */
  canvas: InteractiveCanvasConfig;
  /** Object groups for organization */
  groups: Record<string, {
    objects: string[];
    priority: number;
    behavior: 'always_visible' | 'independent' | 'connected_to_hub' | 'static' | 'dynamic';
    groupAnimation?: string;
  }>;
  /** Individual object configurations */
  objects: LayeredObjectConfig[];
}

export interface AssetManagerState {
  /** Currently loading assets */
  loading: Set<string>;
  /** Successfully loaded assets */
  loaded: Set<string>;
  /** Failed asset loads */
  failed: Set<string>;
  /** Asset cache */
  cache: Map<string, HTMLImageElement>;
  /** Loading progress */
  progress: number;
  /** Total assets to load */
  totalAssets: number;
}

export interface LayeredObjectProps {
  /** Object configuration */
  config: LayeredObjectConfig;
  /** Current state */
  state: LayeredObjectState;
  /** State update function */
  onStateChange: (updates: Partial<LayeredObjectState>) => void;
  /** Asset manager instance */
  assetManager: AssetManagerState;
  /** Whether object is in development mode */
  devMode?: boolean;
}

export interface InteractiveCanvasProps {
  /** Canvas configuration */
  config: InteractiveCanvasConfig;
  /** Object registry */
  registry: ObjectRegistry;
  /** Whether canvas is in development mode */
  devMode?: boolean;
  /** Custom CSS classes */
  className?: string;
}

// Utility types
export type ObjectStateUpdate = Partial<LayeredObjectState>;
export type AssetPath = string;
export type ObjectId = string;
export type GroupId = string;

// Event types
export interface ObjectClickEvent {
  objectId: ObjectId;
  position: { x: number; y: number };
  timestamp: number;
}

export interface ObjectHoverEvent {
  objectId: ObjectId;
  position: { x: number; y: number };
  timestamp: number;
}

// Animation types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  iterations?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

export interface TransitionConfig {
  property: string;
  duration: number;
  easing: string;
  delay?: number;
}
