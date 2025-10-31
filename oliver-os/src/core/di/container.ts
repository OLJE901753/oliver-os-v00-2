/**
 * Dependency Injection Container
 * Lightweight DI container following BMAD principles
 * Provides service registration, resolution, and lifecycle management
 */

import { Logger } from '../../core/logger';

export type ServiceIdentifier = string | symbol | Function;
export type ServiceFactory<T = unknown> = (container: DIContainer) => T | Promise<T>;
export type ServiceInstance<T = unknown> = T;

export interface ServiceRegistration<T = unknown> {
  identifier: ServiceIdentifier;
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: ServiceInstance<T>;
  dependencies?: ServiceIdentifier[];
}

export class DIContainer {
  private services: Map<ServiceIdentifier, ServiceRegistration> = new Map();
  private _logger: Logger;
  private initialized: Set<ServiceIdentifier> = new Set();

  constructor() {
    this._logger = new Logger('DIContainer');
  }

  /**
   * Register a service
   */
  register<T>(
    identifier: ServiceIdentifier,
    factory: ServiceFactory<T>,
    options: { singleton?: boolean; dependencies?: ServiceIdentifier[] } = {}
  ): this {
    const { singleton = true, dependencies = [] } = options;
    
    this.services.set(identifier, {
      identifier,
      factory,
      singleton,
      dependencies
    });
    
    this._logger.debug(`📝 Registered service: ${String(identifier)}`);
    return this;
  }

  /**
   * Register a singleton service instance
   */
  registerInstance<T>(identifier: ServiceIdentifier, instance: T): this {
    this.services.set(identifier, {
      identifier,
      factory: () => instance,
      singleton: true,
      instance
    });
    
    this._logger.debug(`📝 Registered service instance: ${String(identifier)}`);
    return this;
  }

  /**
   * Resolve a service
   */
  async resolve<T>(identifier: ServiceIdentifier): Promise<T> {
    const registration = this.services.get(identifier);
    
    if (!registration) {
      throw new Error(`Service not found: ${String(identifier)}`);
    }

    // Return singleton instance if available
    if (registration.singleton && registration.instance) {
      return registration.instance as T;
    }

    // Resolve dependencies first
    const dependencies = await this.resolveDependencies(registration.dependencies || []);

    // Create instance
    const instance = await registration.factory(this);
    
    // Store singleton instance
    if (registration.singleton) {
      registration.instance = instance;
    }

    return instance as T;
  }

  /**
   * Resolve a service synchronously (for already initialized singletons)
   */
  get<T>(identifier: ServiceIdentifier): T {
    const registration = this.services.get(identifier);
    
    if (!registration) {
      throw new Error(`Service not found: ${String(identifier)}`);
    }

    if (!registration.instance) {
      throw new Error(`Service not initialized: ${String(identifier)}. Use resolve() for async initialization.`);
    }

    return registration.instance as T;
  }

  /**
   * Check if a service is registered
   */
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }

  /**
   * Check if a service instance exists
   */
  isInitialized(identifier: ServiceIdentifier): boolean {
    const registration = this.services.get(identifier);
    return registration?.singleton === true && registration.instance !== undefined;
  }

  /**
   * Resolve multiple dependencies
   */
  private async resolveDependencies(identifiers: ServiceIdentifier[]): Promise<unknown[]> {
    return Promise.all(identifiers.map(id => this.resolve(id)));
  }

  /**
   * Initialize all registered services
   */
  async initialize(): Promise<void> {
    this._logger.info('🚀 Initializing DI container services...');
    
    const orderedServices = this.topologicalSort();
    
    for (const identifier of orderedServices) {
      if (!this.initialized.has(identifier)) {
        await this.resolve(identifier);
        this.initialized.add(identifier);
      }
    }
    
    this._logger.info(`✅ DI container initialized (${this.initialized.size} services)`);
  }

  /**
   * Topological sort for dependency resolution order
   */
  private topologicalSort(): ServiceIdentifier[] {
    const visited = new Set<ServiceIdentifier>();
    const visiting = new Set<ServiceIdentifier>();
    const result: ServiceIdentifier[] = [];

    const visit = (identifier: ServiceIdentifier): void => {
      if (visiting.has(identifier)) {
        throw new Error(`Circular dependency detected involving: ${String(identifier)}`);
      }
      
      if (visited.has(identifier)) {
        return;
      }

      visiting.add(identifier);
      const registration = this.services.get(identifier);
      
      if (registration?.dependencies) {
        for (const dep of registration.dependencies) {
          visit(dep);
        }
      }
      
      visiting.delete(identifier);
      visited.add(identifier);
      result.push(identifier);
    };

    for (const identifier of this.services.keys()) {
      if (!visited.has(identifier)) {
        visit(identifier);
      }
    }

    return result;
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    this.services.clear();
    this.initialized.clear();
    this._logger.debug('🧹 DI container cleared');
  }

  /**
   * Get all registered service identifiers
   */
  getRegisteredServices(): ServiceIdentifier[] {
    return Array.from(this.services.keys());
  }
}

// Export singleton instance
export const container = new DIContainer();

