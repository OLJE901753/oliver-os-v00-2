import type { 
  ObjectRegistry, 
  LayeredObjectConfig, 
  InteractiveCanvasConfig
} from '../types/layeredObjects';

/**
 * Object Registry System
 * Manages configuration for all layered objects and canvas settings
 * Provides utilities for object management and validation
 */

// Default canvas configuration
const defaultCanvasConfig: InteractiveCanvasConfig = {
  width: '100vw', // Use full viewport width
  height: '100vh', // Use full viewport height
  background: {
    image: undefined, // Let the LayeredObject control the background
    fallbackColor: '#0A0A0A',
    fit: '100% 100%' // Stretch to fill the canvas completely
  },
  globalInteraction: {
    enabled: true,
    onBackgroundClick: () => {
      console.log('Canvas background clicked');
    }
  },
  performance: {
    preloadAssets: true,
    maxConcurrentLoads: 5,
    cacheSizeLimit: 50
  }
};



// Brain Core Object Configuration
const brainCoreObject: LayeredObjectConfig = {
  id: 'brain-core',
  name: 'Neural Core Brain',
  type: 'hub',
  assets: {
    fullBackground: '/assets/objects/brain-core/full-background.png',
    backgroundWithoutObject: '/assets/objects/brain-core/background-without-object.png',
    objectIsolated: '/assets/objects/brain-core/object-isolated.png'
  },
  position: { x: 0, y: 0, width: '100vw', height: '100vh' }, // Cover the full viewport
  interaction: {
    interactive: true,
    onClick: () => {
      console.log('Brain core clicked!');
      alert('Brain core activated! Neural interface online.');
    },
    onHover: () => {
      console.log('Brain core hovered!');
    },
    stateClasses: {
      default: 'default-state',
      hover: 'hover-state',
      active: 'active-state',
      disabled: 'disabled-state'
    }
  },
  zIndex: 100,
  visible: true,
  animation: {
    duration: 300,
    easing: 'ease-out',
    hoverScale: 1.05,
    clickAnimation: 'pulse'
  },
  metadata: {
    description: 'Central AI brain hub - the core of your neural interface',
    tags: ['hub', 'core', 'ai'],
    priority: 1,
    group: 'central_hub'
  }
};


// Brain Core Object Registry
export const defaultObjectRegistry: ObjectRegistry = {
  version: '1.0.0',
  canvas: defaultCanvasConfig,
  groups: {
    central_hub: {
      objects: ['brain-core'],
      priority: 100,
      behavior: 'always_visible'
    }
  },
  objects: [brainCoreObject] // Only the brain core object
};

/**
 * Object Registry Manager Class
 * Provides utilities for managing and validating object configurations
 */
export class ObjectRegistryManager {
  private registry: ObjectRegistry;

  constructor(registry: ObjectRegistry = defaultObjectRegistry) {
    this.registry = registry;
  }

  /**
   * Get the current registry
   */
  getRegistry(): ObjectRegistry {
    return this.registry;
  }

  /**
   * Update the registry
   */
  updateRegistry(registry: ObjectRegistry): void {
    this.registry = registry;
  }

  /**
   * Get all objects in a specific group
   */
  getObjectsByGroup(groupId: string): LayeredObjectConfig[] {
    const group = this.registry.groups[groupId];
    if (!group) return [];

    return this.registry.objects.filter(obj => 
      group.objects.includes(obj.id)
    );
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: LayeredObjectConfig['type']): LayeredObjectConfig[] {
    return this.registry.objects.filter(obj => obj.type === type);
  }

  /**
   * Get object by ID
   */
  getObjectById(id: string): LayeredObjectConfig | undefined {
    return this.registry.objects.find(obj => obj.id === id);
  }

  /**
   * Get visible objects sorted by z-index
   */
  getVisibleObjects(): LayeredObjectConfig[] {
    return this.registry.objects
      .filter(obj => obj.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Get interactive objects
   */
  getInteractiveObjects(): LayeredObjectConfig[] {
    return this.registry.objects.filter(obj => obj.interaction.interactive);
  }

  /**
   * Add a new object to the registry
   */
  addObject(objectConfig: LayeredObjectConfig): void {
    // Validate object configuration
    if (!this.validateObjectConfig(objectConfig)) {
      throw new Error(`Invalid object configuration for ${objectConfig.id}`);
    }

    // Check for duplicate ID
    if (this.getObjectById(objectConfig.id)) {
      throw new Error(`Object with ID ${objectConfig.id} already exists`);
    }

    this.registry.objects.push(objectConfig);
  }

  /**
   * Update an existing object
   */
  updateObject(id: string, updates: Partial<LayeredObjectConfig>): void {
    const index = this.registry.objects.findIndex(obj => obj.id === id);
    if (index === -1) {
      throw new Error(`Object with ID ${id} not found`);
    }

    const updatedObject = { ...this.registry.objects[index], ...updates };
    
    if (!this.validateObjectConfig(updatedObject)) {
      throw new Error(`Invalid updated configuration for ${id}`);
    }

    this.registry.objects[index] = updatedObject;
  }

  /**
   * Remove an object from the registry
   */
  removeObject(id: string): void {
    const index = this.registry.objects.findIndex(obj => obj.id === id);
    if (index === -1) {
      throw new Error(`Object with ID ${id} not found`);
    }

    this.registry.objects.splice(index, 1);

    // Remove from groups
    Object.keys(this.registry.groups).forEach(groupId => {
      const group = this.registry.groups[groupId];
      group.objects = group.objects.filter(objId => objId !== id);
    });
  }

  /**
   * Validate object configuration
   */
  validateObjectConfig(config: LayeredObjectConfig): boolean {
    // Check required fields
    if (!config.id || !config.name || !config.type || !config.assets || !config.position) {
      return false;
    }

    // Check asset paths
    const { fullBackground, backgroundWithoutObject, objectIsolated } = config.assets;
    if (!fullBackground || !backgroundWithoutObject || !objectIsolated) {
      return false;
    }

    // Check position values
    const { x, y, width, height } = config.position;
    if (typeof x !== 'number' || typeof y !== 'number' || 
        typeof width !== 'number' || typeof height !== 'number' ||
        width <= 0 || height <= 0) {
      return false;
    }

    // Check z-index
    if (typeof config.zIndex !== 'number' || config.zIndex < 0) {
      return false;
    }

    return true;
  }

  /**
   * Validate the entire registry
   */
  validateRegistry(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate canvas configuration
    if (!this.registry.canvas || !this.registry.canvas.width || !this.registry.canvas.height) {
      errors.push('Invalid canvas configuration');
    }

    // Validate objects
    this.registry.objects.forEach((obj, index) => {
      if (!this.validateObjectConfig(obj)) {
        errors.push(`Invalid object configuration at index ${index}: ${obj.id}`);
      }
    });

    // Validate groups
    Object.entries(this.registry.groups).forEach(([groupId, group]) => {
      group.objects.forEach(objId => {
        if (!this.getObjectById(objId)) {
          errors.push(`Group ${groupId} references non-existent object: ${objId}`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Export registry as JSON
   */
  exportRegistry(): string {
    return JSON.stringify(this.registry, null, 2);
  }

  /**
   * Import registry from JSON
   */
  importRegistry(jsonString: string): void {
    try {
      const registry = JSON.parse(jsonString) as ObjectRegistry;
      
      const validation = this.validateRegistry();
      if (!validation.valid) {
        throw new Error(`Invalid registry: ${validation.errors.join(', ')}`);
      }

      this.registry = registry;
    } catch (error) {
      throw new Error(`Failed to import registry: ${error}`);
    }
  }
}

// Create default registry manager instance
export const objectRegistryManager = new ObjectRegistryManager();

// Export default registry for easy access
export { defaultObjectRegistry as objectRegistry };