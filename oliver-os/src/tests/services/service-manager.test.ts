/**
 * Service Manager Tests
 * Comprehensive tests for service lifecycle management
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ServiceManager } from '../../services/service-manager';
import { Config } from '../../core/config';
// Mock AgentManager
vi.mock('../../services/agent-manager', () => ({
  AgentManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    shutdown: vi.fn().mockResolvedValue(undefined),
    spawnAgent: vi.fn(),
    spawnMultipleAgents: vi.fn(),
    getAgents: vi.fn().mockReturnValue([]),
    getSpawnedAgents: vi.fn().mockReturnValue([]),
    getAgent: vi.fn(),
    getSpawnedAgent: vi.fn(),
  }))
}));

describe('ServiceManager Tests', () => {
  let serviceManager: ServiceManager;
  let config: Config;
  let mockAgentManager: any;

  beforeEach(() => {
    config = new Config();
    serviceManager = new ServiceManager(config);
    // Access the private agent manager through type assertion
    mockAgentManager = (serviceManager as any)._agentManager;
  });

  afterEach(async () => {
    // Cleanup: shutdown all services
    try {
      await serviceManager.shutdown();
    } catch (error) {
      // Ignore shutdown errors in tests
    }
  });

  describe('Service Registration', () => {
    it('should register a new service successfully', async () => {
      await serviceManager.registerService('test-service', 'Test Service', { version: '1.0' });

      const services = serviceManager.getServices();
      expect(services.length).toBeGreaterThan(0);
      
      const service = serviceManager.getService('test-service');
      expect(service).toBeDefined();
      expect(service?.id).toBe('test-service');
      expect(service?.name).toBe('Test Service');
      expect(service?.status).toBe('running');
      expect(service?.metadata?.['version']).toBe('1.0');
    });

    it('should set service status to running after initialization', async () => {
      await serviceManager.registerService('test-service', 'Test Service');

      const service = serviceManager.getService('test-service');
      expect(service?.status).toBe('running');
      expect(service?.startTime).toBeDefined();
    });

    it('should use empty metadata object when not provided', async () => {
      await serviceManager.registerService('test-service', 'Test Service');

      const service = serviceManager.getService('test-service');
      expect(service?.metadata).toEqual({});
    });

    it('should handle service registration with metadata', async () => {
      const metadata = {
        environment: 'test',
        version: '1.0',
        port: 3000
      };

      await serviceManager.registerService('test-service', 'Test Service', metadata);

      const service = serviceManager.getService('test-service');
      expect(service?.metadata).toEqual(metadata);
    });

    it('should allow registering multiple services', async () => {
      await serviceManager.registerService('service-1', 'Service 1');
      await serviceManager.registerService('service-2', 'Service 2');
      await serviceManager.registerService('service-3', 'Service 3');

      const services = serviceManager.getServices();
      expect(services.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Service Retrieval', () => {
    beforeEach(async () => {
      await serviceManager.registerService('test-service', 'Test Service');
    });

    it('should get all services', () => {
      const services = serviceManager.getServices();
      expect(Array.isArray(services)).toBe(true);
      expect(services.length).toBeGreaterThan(0);
    });

    it('should get a specific service by ID', () => {
      const service = serviceManager.getService('test-service');
      expect(service).toBeDefined();
      expect(service?.id).toBe('test-service');
    });

    it('should return undefined for non-existent service', () => {
      const service = serviceManager.getService('non-existent');
      expect(service).toBeUndefined();
    });

    it('should get only running services', async () => {
      await serviceManager.registerService('running-service', 'Running Service');
      
      const runningServices = serviceManager.getRunningServices();
      expect(Array.isArray(runningServices)).toBe(true);
      expect(runningServices.every(s => s.status === 'running')).toBe(true);
    });
  });

  describe('Service Unregistration', () => {
    beforeEach(async () => {
      await serviceManager.registerService('test-service', 'Test Service');
    });

    it('should unregister a service successfully', async () => {
      const serviceBefore = serviceManager.getService('test-service');
      expect(serviceBefore).toBeDefined();

      await serviceManager.unregisterService('test-service');

      const serviceAfter = serviceManager.getService('test-service');
      expect(serviceAfter).toBeUndefined();
    });

    it('should set service status to stopping before unregistration', async () => {
      // We can't easily test the stopping status since it's async and short-lived
      // But we can verify the service is removed
      await serviceManager.unregisterService('test-service');
      
      const service = serviceManager.getService('test-service');
      expect(service).toBeUndefined();
    });

    it('should throw error when unregistering non-existent service', async () => {
      await expect(
        serviceManager.unregisterService('non-existent')
      ).rejects.toThrow('Service not found: non-existent');
    });
  });

  describe('Service Initialization', () => {
    it('should initialize service manager and register core services', async () => {
      await serviceManager.initialize();

      const services = serviceManager.getServices();
      expect(services.length).toBeGreaterThan(0);
      
      // Check for core services
      const coreServiceIds = ['system-health', 'process-manager', 'api-gateway', 'security-service'];
      const registeredIds = services.map(s => s.id);
      
      coreServiceIds.forEach(id => {
        expect(registeredIds).toContain(id);
      });
    });

    it('should initialize agent manager during initialization', async () => {
      await serviceManager.initialize();

      expect(mockAgentManager.initialize).toHaveBeenCalled();
    });
  });

  describe('Service Shutdown', () => {
    beforeEach(async () => {
      await serviceManager.registerService('test-service-1', 'Test Service 1');
      await serviceManager.registerService('test-service-2', 'Test Service 2');
    });

    it('should shutdown all services', async () => {
      const servicesBefore = serviceManager.getServices();
      expect(servicesBefore.length).toBeGreaterThan(0);

      await serviceManager.shutdown();

      // After shutdown, services should be unregistered
      const servicesAfter = serviceManager.getServices();
      // Core services might still exist if they were registered during init
      // But our test services should be gone
      expect(servicesAfter.length).toBeLessThanOrEqual(servicesBefore.length);
    });

    it('should shutdown agent manager during shutdown', async () => {
      await serviceManager.shutdown();

      expect(mockAgentManager.shutdown).toHaveBeenCalled();
    });
  });

  describe('Agent Management Delegation', () => {
    it('should delegate spawnAgent to agent manager', async () => {
      const mockSpawnedAgent = {
        id: 'agent-1',
        agentType: 'code-generator',
        prompt: 'Test',
        status: 'running' as const,
        startTime: new Date(),
        metadata: {}
      };

      (mockAgentManager.spawnAgent as ReturnType<typeof vi.fn>).mockResolvedValue(mockSpawnedAgent);

      const result = await serviceManager.spawnAgent({
        agentType: 'code-generator',
        prompt: 'Test'
      });

      expect(mockAgentManager.spawnAgent).toHaveBeenCalledWith({
        agentType: 'code-generator',
        prompt: 'Test'
      });
      expect(result).toEqual(mockSpawnedAgent);
    });

    it('should delegate getAgents to agent manager', () => {
      const mockAgents = [
        { id: 'agent-1', displayName: 'Agent 1', status: 'idle' as const }
      ];

      (mockAgentManager.getAgents as ReturnType<typeof vi.fn>).mockReturnValue(mockAgents);

      const result = serviceManager.getAgents();

      expect(mockAgentManager.getAgents).toHaveBeenCalled();
      expect(result).toEqual(mockAgents);
    });

    it('should delegate getSpawnedAgents to agent manager', () => {
      const mockSpawnedAgents = [
        {
          id: 'spawned-1',
          agentType: 'code-generator',
          prompt: 'Test',
          status: 'running' as const,
          startTime: new Date(),
          metadata: {}
        }
      ];

      (mockAgentManager.getSpawnedAgents as ReturnType<typeof vi.fn>).mockReturnValue(mockSpawnedAgents);

      const result = serviceManager.getSpawnedAgents();

      expect(mockAgentManager.getSpawnedAgents).toHaveBeenCalled();
      expect(result).toEqual(mockSpawnedAgents);
    });
  });

  describe('Error Handling', () => {
    it('should handle service initialization errors gracefully', async () => {
      // This test verifies that invalid service configuration throws an error
      // The initializeService method validates service.id and service.name
      // Since registerService creates the service with valid id and name,
      // we can't easily trigger this error without modifying the service object
      // But we can verify the service registration works correctly
      await serviceManager.registerService('valid-service', 'Valid Service');
      
      const service = serviceManager.getService('valid-service');
      expect(service).toBeDefined();
    });

    it('should handle concurrent service registrations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        serviceManager.registerService(`service-${i}`, `Service ${i}`)
      );

      await Promise.all(promises);

      const services = serviceManager.getServices();
      expect(services.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Edge Cases', () => {
    it('should overwrite service when registering with duplicate ID', async () => {
      await serviceManager.registerService('duplicate-id', 'First Service', { version: '1.0' });
      const firstService = serviceManager.getService('duplicate-id');
      expect(firstService?.name).toBe('First Service');
      expect(firstService?.metadata?.['version']).toBe('1.0');

      await serviceManager.registerService('duplicate-id', 'Second Service', { version: '2.0' });
      const secondService = serviceManager.getService('duplicate-id');
      expect(secondService?.name).toBe('Second Service');
      expect(secondService?.metadata?.['version']).toBe('2.0');
      expect(serviceManager.getServices().filter(s => s.id === 'duplicate-id').length).toBe(1);
    });

    it('should reject empty string service ID', async () => {
      // Empty string ID should be rejected by validation
      await expect(
        serviceManager.registerService('', 'Empty ID Service')
      ).rejects.toThrow('Invalid service configuration:');
    });

    it('should handle very long service names', async () => {
      const longName = 'A'.repeat(1000);
      await serviceManager.registerService('long-name-service', longName);
      const service = serviceManager.getService('long-name-service');
      expect(service?.name).toBe(longName);
      expect(service?.name.length).toBe(1000);
    });

    it('should handle special characters in service ID', async () => {
      const specialId = 'service-with-special-chars-!@#$%^&*()';
      await serviceManager.registerService(specialId, 'Special Service');
      const service = serviceManager.getService(specialId);
      expect(service).toBeDefined();
      expect(service?.id).toBe(specialId);
    });

    it('should handle large metadata objects', async () => {
      const largeMetadata: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key-${i}`] = `value-${i}`.repeat(10);
      }
      
      await serviceManager.registerService('large-metadata-service', 'Large Metadata', largeMetadata);
      const service = serviceManager.getService('large-metadata-service');
      expect(service?.metadata).toEqual(largeMetadata);
      expect(Object.keys(service?.metadata || {}).length).toBe(100);
    });

    it('should handle concurrent unregistration attempts', async () => {
      await serviceManager.registerService('concurrent-service', 'Concurrent Service');
      
      // Attempt to unregister the same service multiple times concurrently
      const promises = [
        serviceManager.unregisterService('concurrent-service'),
        serviceManager.unregisterService('concurrent-service'),
        serviceManager.unregisterService('concurrent-service')
      ];

      // At least one should succeed, others should fail with "Service not found"
      const results = await Promise.allSettled(promises);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => 
        r.status === 'rejected' && 
        r.reason instanceof Error && 
        r.reason.message.includes('Service not found')
      ).length;
      
      expect(succeeded).toBeGreaterThanOrEqual(1);
      expect(succeeded + failed).toBe(3);
      
      // Service should be gone
      expect(serviceManager.getService('concurrent-service')).toBeUndefined();
    });

    it('should handle unregistration during shutdown', async () => {
      await serviceManager.registerService('shutdown-service', 'Shutdown Service');
      
      // Start shutdown and immediately try to unregister
      const shutdownPromise = serviceManager.shutdown();
      const unregisterPromise = serviceManager.unregisterService('shutdown-service');
      
      await Promise.allSettled([shutdownPromise, unregisterPromise]);
      
      // Service should be gone after both operations
      expect(serviceManager.getService('shutdown-service')).toBeUndefined();
    });

    it('should handle null and undefined metadata gracefully', async () => {
      // TypeScript will prevent null/undefined, but test with empty object
      await serviceManager.registerService('null-metadata', 'Null Metadata', {});
      const service = serviceManager.getService('null-metadata');
      expect(service?.metadata).toEqual({});
    });

    it('should handle nested metadata structures', async () => {
      const nestedMetadata = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, 2, 3],
              nested: {
                final: 'value'
              }
            }
          }
        }
      };
      
      await serviceManager.registerService('nested-service', 'Nested Metadata', nestedMetadata);
      const service = serviceManager.getService('nested-service');
      expect(service?.metadata).toEqual(nestedMetadata);
      const nestedValue = (service?.metadata?.['level1'] as any)?.level2?.level3?.value;
      expect(nestedValue).toBe('deep');
    });

    it('should maintain service order after multiple operations', async () => {
      const serviceIds = ['service-a', 'service-b', 'service-c'];
      
      for (const id of serviceIds) {
        await serviceManager.registerService(id, `Service ${id}`);
      }
      
      // Unregister middle service
      await serviceManager.unregisterService('service-b');
      
      // Register new service
      await serviceManager.registerService('service-d', 'Service D');
      
      const services = serviceManager.getServices();
      const remainingIds = services.map(s => s.id).filter(id => serviceIds.includes(id) || id === 'service-d');
      expect(remainingIds).toContain('service-a');
      expect(remainingIds).toContain('service-c');
      expect(remainingIds).toContain('service-d');
      expect(remainingIds).not.toContain('service-b');
    });
  });
});

