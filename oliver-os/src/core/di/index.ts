/**
 * Dependency Injection Module Exports
 * Central export point for all DI functionality
 */

import { DIContainer } from './container';
import * as ServiceIdSymbols from './service-identifiers';
import { bootstrapContainer, initializeServices } from './bootstrap';

// Singleton container instance
export const container = new DIContainer();

// Service identifiers as a namespace object
export const ServiceIds = ServiceIdSymbols;

/**
 * Get service from DI container (synchronous, for already initialized services)
 */
export function getService<T>(identifier: symbol | string | Function): T {
  return container.get<T>(identifier);
}

/**
 * Resolve service from DI container (async, handles initialization)
 */
export async function resolveService<T>(identifier: symbol | string | Function): Promise<T> {
  return container.resolve<T>(identifier);
}

// Bootstrap functions
export { bootstrapContainer, initializeServices };

// Re-export types
export type { ServiceIdentifier, ServiceFactory, ServiceInstance, ServiceRegistration } from './container';

// Re-export container class for advanced usage
export { DIContainer } from './container';

