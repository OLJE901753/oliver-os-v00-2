export type ObjectType = 
  | 'hub' 
  | 'panel' 
  | 'profile' 
  | 'visualization' 
  | 'label' 
  | 'cluster'
  | 'icon'
  | 'icon_cluster'
  | 'status_grid'
  | 'ui_overlay'
  | 'connection_system';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface AnimationConfig {
  pulse?: { speed: number; intensity: number };
  glow?: { color?: string; radius?: number; intensity?: number };
  scale?: number;
  rotation?: { speed: number; axis: 'x' | 'y' | 'z' };
  particles?: { count: number; speed: number };
  float?: { speed: number; amplitude: number };
  scanlines?: boolean;
  textScroll?: { speed: number; direction: 'up' | 'down' };
  dataFlow?: { speed: number };
  barAnimate?: { speed: number; reactive: boolean };
  iconPulse?: { stagger: boolean };
  iconRotate?: { speed: number };
  orbPulse?: { speed: number };
  rotate?: { speed: number };
  circularPattern?: { speed: number };
  visualNoise?: { intensity: number };
  digitalNoise?: { speed: number; intensity: number };
  typing?: { speed: number; fingers: string };
  [key: string]: unknown;
}

export interface BehaviorConfig {
  onClick: 'focus' | 'link' | 'toggle' | 'menu' | 'settings' | 'execute' | 'none';
  onHover?: 'glow' | 'scale' | 'info' | 'none';
  draggable?: boolean;
  static?: boolean;
  dynamic?: boolean;
}

export interface DataConfig {
  source?: string;
  updateInterval?: number;
  displays?: string[];
  maxLines?: number;
  fontSize?: string;
  fontFamily?: string;
  visualization?: string;
  type?: string;
}

export interface VisualObject {
  id: string;
  name: string;
  type: ObjectType;
  group: string;
  position: Position;
  size: Size;
  gridPosition: string;
  colors: string[];
  enabled: boolean;
  interactive: boolean;
  animations: {
    idle: AnimationConfig;
    hover?: AnimationConfig;
    focused?: AnimationConfig;
  };
  behavior: BehaviorConfig;
  data?: DataConfig;
  connections?: string[];
  description: string;
  text?: string;
  elements?: Array<{
    type: string;
    shape?: string;
    color?: string;
    content?: string;
  }>;
  icons?: string[];
}

export interface ObjectsConfig {
  version: string;
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
  };
  groups: Record<string, {
    objects: string[];
    priority: number;
    behavior: string;
    groupAnimation?: string;
  }>;
  objects: VisualObject[];
}

export interface SystemStatus {
  processes: Array<{
    id: string;
    name: string;
    status: string;
    cpu: number;
    memory: number;
  }>;
  services: Array<{
    id: string;
    name: string;
    enabled: boolean;
    status: string;
  }>;
  health: {
    cpu: number;
    memory: number;
    uptime: number;
    status: string;
  };
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
  }>;
}
