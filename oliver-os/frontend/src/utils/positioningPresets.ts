import type { PositioningPreset, ObjectPosition } from '../types/layeredObjects';

/**
 * Positioning Presets for Common Layouts
 * Provides pre-configured positioning for different UI arrangements
 */

// Default canvas size (viewport)
const DEFAULT_CANVAS_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Brain Core - Full viewport coverage
const BRAIN_CORE_POSITION: ObjectPosition = {
  x: 0,
  y: 0,
  width: DEFAULT_CANVAS_SIZE.width,
  height: DEFAULT_CANVAS_SIZE.height,
  anchor: 'top-left',
  snapToGrid: {
    enabled: true,
    spacing: 16
  }
};

// Data Panel Left - Left side panel
const DATA_PANEL_LEFT_POSITION: ObjectPosition = {
  x: 20,
  y: 100,
  width: 300,
  height: 400,
  anchor: 'top-left',
  alignment: {
    horizontal: 'left',
    vertical: 'top'
  },
  snapToGrid: {
    enabled: true,
    spacing: 16
  }
};

// Data Panel Right - Right side panel
const DATA_PANEL_RIGHT_POSITION: ObjectPosition = {
  x: DEFAULT_CANVAS_SIZE.width - 320,
  y: 100,
  width: 300,
  height: 400,
  anchor: 'top-right',
  alignment: {
    horizontal: 'right',
    vertical: 'top'
  },
  snapToGrid: {
    enabled: true,
    spacing: 16
  }
};

// Status Icon - Top right corner
const STATUS_ICON_POSITION: ObjectPosition = {
  x: DEFAULT_CANVAS_SIZE.width - 80,
  y: 20,
  width: 60,
  height: 60,
  anchor: 'top-right',
  alignment: {
    horizontal: 'right',
    vertical: 'top'
  },
  snapToGrid: {
    enabled: true,
    spacing: 8
  }
};

// Control Panel - Bottom center
const CONTROL_PANEL_POSITION: ObjectPosition = {
  x: DEFAULT_CANVAS_SIZE.width / 2 - 200,
  y: DEFAULT_CANVAS_SIZE.height - 100,
  width: 400,
  height: 80,
  anchor: 'bottom-center',
  alignment: {
    horizontal: 'center',
    vertical: 'bottom'
  },
  snapToGrid: {
    enabled: true,
    spacing: 16
  }
};

// Preset: Full Brain Interface
export const FULL_BRAIN_INTERFACE_PRESET: PositioningPreset = {
  id: 'full-brain-interface',
  name: 'Full Brain Interface',
  description: 'Complete brain interface with all panels and controls',
  canvasSize: DEFAULT_CANVAS_SIZE,
  objects: [
    {
      id: 'brain-core',
      position: BRAIN_CORE_POSITION
    },
    {
      id: 'data-panel-left',
      position: DATA_PANEL_LEFT_POSITION
    },
    {
      id: 'data-panel-right',
      position: DATA_PANEL_RIGHT_POSITION
    },
    {
      id: 'status-icon',
      position: STATUS_ICON_POSITION
    },
    {
      id: 'control-panel',
      position: CONTROL_PANEL_POSITION
    }
  ]
};

// Preset: Minimal Brain Core
export const MINIMAL_BRAIN_CORE_PRESET: PositioningPreset = {
  id: 'minimal-brain-core',
  name: 'Minimal Brain Core',
  description: 'Just the brain core without additional panels',
  canvasSize: DEFAULT_CANVAS_SIZE,
  objects: [
    {
      id: 'brain-core',
      position: BRAIN_CORE_POSITION
    }
  ]
};

// Preset: Data Focus Layout
export const DATA_FOCUS_LAYOUT_PRESET: PositioningPreset = {
  id: 'data-focus-layout',
  name: 'Data Focus Layout',
  description: 'Brain core with prominent data panels',
  canvasSize: DEFAULT_CANVAS_SIZE,
  objects: [
    {
      id: 'brain-core',
      position: BRAIN_CORE_POSITION
    },
    {
      id: 'data-panel-left',
      position: {
        ...DATA_PANEL_LEFT_POSITION,
        width: 350,
        height: 500
      }
    },
    {
      id: 'data-panel-right',
      position: {
        ...DATA_PANEL_RIGHT_POSITION,
        width: 350,
        height: 500
      }
    }
  ]
};

// Preset: Control Center Layout
export const CONTROL_CENTER_LAYOUT_PRESET: PositioningPreset = {
  id: 'control-center-layout',
  name: 'Control Center Layout',
  description: 'Brain core with prominent control panel',
  canvasSize: DEFAULT_CANVAS_SIZE,
  objects: [
    {
      id: 'brain-core',
      position: BRAIN_CORE_POSITION
    },
    {
      id: 'control-panel',
      position: {
        ...CONTROL_PANEL_POSITION,
        width: 600,
        height: 120
      }
    },
    {
      id: 'status-icon',
      position: STATUS_ICON_POSITION
    }
  ]
};

// Preset: Mobile Layout
export const MOBILE_LAYOUT_PRESET: PositioningPreset = {
  id: 'mobile-layout',
  name: 'Mobile Layout',
  description: 'Optimized for mobile screens',
  canvasSize: {
    width: 375,
    height: 667
  },
  objects: [
    {
      id: 'brain-core',
      position: {
        x: 0,
        y: 0,
        width: 375,
        height: 667,
        anchor: 'top-left'
      }
    },
    {
      id: 'status-icon',
      position: {
        x: 315,
        y: 20,
        width: 50,
        height: 50,
        anchor: 'top-right'
      }
    },
    {
      id: 'control-panel',
      position: {
        x: 20,
        y: 567,
        width: 335,
        height: 80,
        anchor: 'bottom-left'
      }
    }
  ]
};

// Preset: Tablet Layout
export const TABLET_LAYOUT_PRESET: PositioningPreset = {
  id: 'tablet-layout',
  name: 'Tablet Layout',
  description: 'Optimized for tablet screens',
  canvasSize: {
    width: 768,
    height: 1024
  },
  objects: [
    {
      id: 'brain-core',
      position: {
        x: 0,
        y: 0,
        width: 768,
        height: 1024,
        anchor: 'top-left'
      }
    },
    {
      id: 'data-panel-left',
      position: {
        x: 20,
        y: 100,
        width: 250,
        height: 400,
        anchor: 'top-left'
      }
    },
    {
      id: 'data-panel-right',
      position: {
        x: 498,
        y: 100,
        width: 250,
        height: 400,
        anchor: 'top-right'
      }
    },
    {
      id: 'status-icon',
      position: {
        x: 688,
        y: 20,
        width: 60,
        height: 60,
        anchor: 'top-right'
      }
    },
    {
      id: 'control-panel',
      position: {
        x: 184,
        y: 924,
        width: 400,
        height: 80,
        anchor: 'bottom-center'
      }
    }
  ]
};

// All available presets
export const POSITIONING_PRESETS: PositioningPreset[] = [
  FULL_BRAIN_INTERFACE_PRESET,
  MINIMAL_BRAIN_CORE_PRESET,
  DATA_FOCUS_LAYOUT_PRESET,
  CONTROL_CENTER_LAYOUT_PRESET,
  MOBILE_LAYOUT_PRESET,
  TABLET_LAYOUT_PRESET
];

/**
 * Get preset by ID
 */
export const getPresetById = (id: string): PositioningPreset | undefined => {
  return POSITIONING_PRESETS.find(preset => preset.id === id);
};

/**
 * Apply preset to object registry
 */
export const applyPreset = (preset: PositioningPreset, objects: any[]): any[] => {
  return objects.map(obj => {
    const presetObject = preset.objects.find(presetObj => presetObj.id === obj.id);
    if (presetObject) {
      return {
        ...obj,
        position: presetObject.position
      };
    }
    return obj;
  });
};

/**
 * Create custom preset from current object positions
 */
export const createCustomPreset = (
  id: string,
  name: string,
  description: string,
  objects: any[],
  canvasSize: { width: number; height: number }
): PositioningPreset => {
  return {
    id,
    name,
    description,
    canvasSize,
    objects: objects.map(obj => ({
      id: obj.id,
      position: obj.position
    }))
  };
};

/**
 * Validate preset compatibility with current objects
 */
export const validatePreset = (preset: PositioningPreset, availableObjects: string[]): {
  valid: boolean;
  missingObjects: string[];
  extraObjects: string[];
} => {
  const presetObjectIds = preset.objects.map(obj => obj.id);
  const missingObjects = presetObjectIds.filter(id => !availableObjects.includes(id));
  const extraObjects = availableObjects.filter(id => !presetObjectIds.includes(id));

  return {
    valid: missingObjects.length === 0,
    missingObjects,
    extraObjects
  };
};
