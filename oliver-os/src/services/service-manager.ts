/**
 * Oliver-OS Service Manager
 * Manages microservices lifecycle and communication
 */

import { Logger } from '../core/logger';
import { Config } from '../core/config';
import { AgentManager } from './agent-manager';
import type { SpawnRequest } from './agent-manager';

export interface Service {
  id: string;
  name: string;
  status: 'starting' | 'running' | 'stopping' | 'stopped' | 'error';
  startTime?: Date;
  metadata: Record<string, unknown>;
}

export class ServiceManager {
  private services: Map<string, Service> = new Map();
  private _agentManager: AgentManager;
  private _logger: Logger;
  // private _config: Config; // Unused for now

  constructor(_config: Config) {
    // this._config = _config; // Unused for now
    this._logger = new Logger('ServiceManager');
    this._agentManager = new AgentManager(_config);
  }

  async initialize(): Promise<void> {
    this._logger.info('🚀 Initializing Service Manager...');
    
    // Initialize agent manager
    await this._agentManager.initialize();
    
    // Register core services
    await this.registerCoreServices();
    
    this._logger.info(`✅ Service Manager initialized with ${this.services.size} services`);
  }

  private async registerCoreServices(): Promise<void> {
    // Register system services
    const coreServices = [
      { id: 'system-health', name: 'System Health Monitor' },
      { id: 'process-manager', name: 'Process Manager' },
      { id: 'api-gateway', name: 'API Gateway' },
      { id: 'security-service', name: 'Security Service' }
    ];

    for (const service of coreServices) {
      await this.registerService(service.id, service.name, {});
    }
  }

  async registerService(id: string, name: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const service: Service = {
      id,
      name,
      status: 'starting',
      metadata
    };

    this.services.set(id, service);
    this._logger.info(`📝 Registered service: ${name} (${id})`);
    
    // Actual service initialization
    await this.initializeService(service);
    service.status = 'running';
    service.startTime = new Date();
    this._logger.info(`✅ Service started: ${name}`);
  }

  /**
   * Initialize a service with proper async handling
   */
  private async initializeService(service: Service): Promise<void> {
    // Add actual initialization logic here
    // For now, just simulate with a small delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Validate service configuration
    if (!service.id || !service.name) {
      throw new Error(`Invalid service configuration: ${service.id}`);
    }
    
    // Additional initialization steps would go here
    this._logger.debug(`Initialized service: ${service.name}`);
  }

  async unregisterService(id: string): Promise<void> {
    const service = this.services.get(id);
    if (!service) {
      throw new Error(`Service not found: ${id}`);
    }

    service.status = 'stopping';
    this._logger.info(`🛑 Stopping service: ${service.name}`);
    
    // Actual service shutdown
    await this.shutdownService(service);
    service.status = 'stopped';
    this.services.delete(id);
    this._logger.info(`✅ Service stopped: ${service.name}`);
  }

  /**
   * Shutdown a service with proper cleanup
   */
  private async shutdownService(service: Service): Promise<void> {
    // Add actual shutdown logic here
    // For now, just simulate with a small delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Cleanup resources, close connections, etc.
    this._logger.debug(`Shutdown service: ${service.name}`);
  }

  getServices(): Service[] {
    return Array.from(this.services.values());
  }

  getService(id: string): Service | undefined {
    return this.services.get(id);
  }

  getRunningServices(): Service[] {
    return this.getServices().filter(service => service.status === 'running');
  }

  // Agent Management Methods
  async spawnAgent(request: SpawnRequest) {
    return await this._agentManager.spawnAgent(request);
  }

  async spawnMultipleAgents(requests: SpawnRequest[]) {
    return await this._agentManager.spawnMultipleAgents(requests);
  }

  getAgents() {
    return this._agentManager.getAgents();
  }

  getSpawnedAgents() {
    return this._agentManager.getSpawnedAgents();
  }

  getAgent(id: string) {
    return this._agentManager.getAgent(id);
  }

  getSpawnedAgent(id: string) {
    return this._agentManager.getSpawnedAgent(id);
  }

  async shutdown(): Promise<void> {
    this._logger.info('🛑 Shutting down Service Manager...');
    
    // Shutdown agent manager
    await this._agentManager.shutdown();
    
    const services = Array.from(this.services.values());
    for (const service of services) {
      await this.unregisterService(service.id);
    }
    
    this._logger.info('✅ Service Manager shutdown complete');
  }
}
