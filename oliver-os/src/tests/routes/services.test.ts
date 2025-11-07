/**
 * Services Route Tests
 * Comprehensive tests for service management endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { servicesRouter, initializeServicesRouter } from '../../routes/services';
import type { ServiceManager } from '../../services/service-manager';
import type { Service } from '../../services/service-manager';

describe('Services Route Tests', () => {
  let app: express.Application;
  let mockServiceManager: ServiceManager;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock service manager
    mockServiceManager = {
      getServices: vi.fn(),
      registerService: vi.fn(),
      unregisterService: vi.fn(),
      getService: vi.fn(),
    } as any;

    // Initialize router with mock service manager
    initializeServicesRouter(mockServiceManager);
    
    // Register routes
    app.use('/api/services', servicesRouter);
  });

  describe('GET /api/services', () => {
    it('should return all services', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Test Service 1',
          status: 'running',
          startTime: new Date(),
          metadata: { version: '1.0' }
        },
        {
          id: 'service-2',
          name: 'Test Service 2',
          status: 'stopped',
          startTime: new Date(),
          metadata: {}
        }
      ];

      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue(mockServices);

      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(Array.isArray(response.body.services)).toBe(true);
      expect(response.body.services.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.running).toBe(1);
      expect(response.body.timestamp).toBeDefined();
      expect(mockServiceManager.getServices).toHaveBeenCalled();
    });

    it('should return empty array when no services', async () => {
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body.services).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.running).toBe(0);
    });

    it('should return 503 when ServiceManager not initialized', async () => {
      // Reset the router with null
      initializeServicesRouter(null as any);

      const response = await request(app)
        .get('/api/services')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ServiceManager not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/services')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve services');
    });
  });

  describe('GET /api/services/:id', () => {
    it('should return specific service by ID', async () => {
      const mockServices: Service[] = [
        {
          id: 'service-1',
          name: 'Test Service',
          status: 'running',
          startTime: new Date(),
          metadata: { version: '1.0' }
        }
      ];

      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue(mockServices);

      const response = await request(app)
        .get('/api/services/service-1')
        .expect(200);

      expect(response.body.id).toBe('service-1');
      expect(response.body.name).toBe('Test Service');
      expect(response.body.status).toBe('running');
      expect(response.body.metadata).toEqual({ version: '1.0' });
    });

    it('should return 404 when service not found', async () => {
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .get('/api/services/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Service not found');
      expect(response.body.id).toBe('non-existent');
      expect(response.body.message).toBe('The requested service does not exist');
    });

    it('should return 503 when ServiceManager not initialized', async () => {
      initializeServicesRouter(null as any);

      const response = await request(app)
        .get('/api/services/service-1')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ServiceManager not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Service lookup failed');
      });

      const response = await request(app)
        .get('/api/services/service-1')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve service');
    });
  });

  describe('POST /api/services', () => {
    it('should create a new service successfully', async () => {
      // Mock getServices to return the new service after registration
      // The route generates service ID as `service-${Date.now()}`, so we need to capture it
      let capturedServiceId: string | null = null;
      
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockImplementation(
        async (id: string) => {
          capturedServiceId = id;
        }
      );
      
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        if (capturedServiceId) {
          return [{
            id: capturedServiceId,
            name: 'New Service',
            status: 'running' as const,
            startTime: new Date(),
            metadata: { environment: 'test' }
          }];
        }
        return [];
      });

      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'New Service',
          metadata: { environment: 'test' }
        })
        .expect(201);

      expect(response.body.message).toBe('Service created successfully');
      expect(response.body.service).toBeDefined();
      expect(response.body.service.name).toBe('New Service');
      expect(mockServiceManager.registerService).toHaveBeenCalled();
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({
          metadata: { environment: 'test' }
        })
        .expect(400);

      expect(response.body.error).toBe('Service name is required');
      expect(response.body.message).toBe('Please provide a name for the service');
      expect(mockServiceManager.registerService).not.toHaveBeenCalled();
    });

    it('should use empty object for metadata when not provided', async () => {
      let capturedServiceId: string | null = null;
      
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockImplementation(
        async (id: string) => {
          capturedServiceId = id;
        }
      );
      
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        if (capturedServiceId) {
          return [{
            id: capturedServiceId,
            name: 'New Service',
            status: 'running' as const,
            startTime: new Date(),
            metadata: {}
          }];
        }
        return [];
      });

      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'New Service'
        })
        .expect(201);

      expect(response.body.service.metadata).toEqual({});
      expect(mockServiceManager.registerService).toHaveBeenCalledWith(
        expect.any(String),
        'New Service',
        {}
      );
    });

    it('should return 503 when ServiceManager not initialized', async () => {
      initializeServicesRouter(null as any);

      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'New Service'
        })
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ServiceManager not initialized');
    });

    it('should handle service registration errors', async () => {
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Registration failed')
      );

      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'New Service'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Registration failed');
    });

    it('should handle case when service is not found after registration', async () => {
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'New Service'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Service registration failed');
    });
  });

  describe('DELETE /api/services/:id', () => {
    it('should delete a service successfully', async () => {
      const serviceToDelete: Service = {
        id: 'service-1',
        name: 'Service to Delete',
        status: 'running',
        startTime: new Date(),
        metadata: {}
      };

      const allServices: Service[] = [serviceToDelete];

      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue(allServices);
      (mockServiceManager.unregisterService as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/services/service-1')
        .expect(200);

      expect(response.body.message).toBe('Service deleted successfully');
      expect(response.body.service.id).toBe('service-1');
      expect(response.body.service.name).toBe('Service to Delete');
      expect(mockServiceManager.unregisterService).toHaveBeenCalledWith('service-1');
    });

    it('should return 404 when service not found', async () => {
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .delete('/api/services/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Service not found');
      expect(response.body.id).toBe('non-existent');
      expect(response.body.message).toBe('The service to delete does not exist');
      expect(mockServiceManager.unregisterService).not.toHaveBeenCalled();
    });

    it('should return 503 when ServiceManager not initialized', async () => {
      initializeServicesRouter(null as any);

      const response = await request(app)
        .delete('/api/services/service-1')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ServiceManager not initialized');
    });

    it('should handle service deletion errors', async () => {
      const serviceToDelete: Service = {
        id: 'service-1',
        name: 'Service to Delete',
        status: 'running',
        startTime: new Date(),
        metadata: {}
      };

      const allServices: Service[] = [serviceToDelete];

      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue(allServices);
      (mockServiceManager.unregisterService as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Deletion failed')
      );

      const response = await request(app)
        .delete('/api/services/service-1')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Deletion failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Content-Type', 'application/json')
        .send('{"name": "Test", invalid json}')
        .expect(400);

      // Express should handle malformed JSON and return 400
      expect(response.status).toBe(400);
    });

    it('should handle very long service names', async () => {
      const longName = 'A'.repeat(10000);
      let capturedServiceId: string | null = null;
      
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockImplementation(
        async (id: string) => {
          capturedServiceId = id;
        }
      );
      
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        if (capturedServiceId) {
          return [{
            id: capturedServiceId,
            name: longName,
            status: 'running' as const,
            startTime: new Date(),
            metadata: {}
          }];
        }
        return [];
      });

      const response = await request(app)
        .post('/api/services')
        .send({ name: longName })
        .expect(201);

      expect(response.body.service.name).toBe(longName);
      expect(response.body.service.name.length).toBe(10000);
    });

    it('should handle special characters in service ID from route parameter', async () => {
      const specialId = 'service-!@#$%^&*()';
      const mockService: Service = {
        id: specialId,
        name: 'Special Service',
        status: 'running',
        startTime: new Date(),
        metadata: {}
      };

      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([mockService]);

      const response = await request(app)
        .get(`/api/services/${encodeURIComponent(specialId)}`)
        .expect(200);

      expect(response.body.id).toBe(specialId);
    });

    it('should handle empty string as service name', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({ name: '' })
        .expect(400);

      expect(response.body.error).toBe('Service name is required');
    });

    it('should handle null as service name', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({ name: null })
        .expect(400);

      expect(response.body.error).toBe('Service name is required');
    });

    it('should handle non-string service name', async () => {
      // When name is a number, JavaScript truthiness makes it pass the !name check
      // But the route will try to use it, which may cause issues
      // Setup mock to handle this edge case
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([]);
      
      const response = await request(app)
        .post('/api/services')
        .send({ name: 12345 });

      // Should either validate as invalid (400) or handle gracefully (500)
      // The route doesn't validate type, so it may pass through and fail later
      expect([400, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).toBe('Service name is required');
      }
    });

    it('should handle very large metadata objects', async () => {
      // Create a reasonably large metadata object (not so large it hits Express body parser limit)
      const largeMetadata: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key-${i}`] = `value-${i}`.repeat(10);
      }

      let capturedServiceId: string | null = null;
      
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockImplementation(
        async (id: string) => {
          capturedServiceId = id;
        }
      );
      
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        if (capturedServiceId) {
          return [{
            id: capturedServiceId,
            name: 'Large Metadata Service',
            status: 'running' as const,
            startTime: new Date(),
            metadata: largeMetadata
          }];
        }
        return [];
      });

      const response = await request(app)
        .post('/api/services')
        .send({ name: 'Large Metadata Service', metadata: largeMetadata })
        .expect(201);

      expect(Object.keys(response.body.service.metadata).length).toBe(100);
    });

    it('should handle nested metadata structures', async () => {
      const nestedMetadata = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              array: [1, 2, 3]
            }
          }
        }
      };

      let capturedServiceId: string | null = null;
      
      (mockServiceManager.registerService as ReturnType<typeof vi.fn>).mockImplementation(
        async (id: string) => {
          capturedServiceId = id;
        }
      );
      
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockImplementation(() => {
        if (capturedServiceId) {
          return [{
            id: capturedServiceId,
            name: 'Nested Metadata Service',
            status: 'running' as const,
            startTime: new Date(),
            metadata: nestedMetadata
          }];
        }
        return [];
      });

      const response = await request(app)
        .post('/api/services')
        .send({ name: 'Nested Metadata Service', metadata: nestedMetadata })
        .expect(201);

      expect(response.body.service.metadata).toEqual(nestedMetadata);
    });

    it('should handle multiple sequential requests to same endpoint', async () => {
      // Setup mock to return empty array
      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([]);
      
      // Make multiple sequential requests
      const response1 = await request(app).get('/api/services');
      const response2 = await request(app).get('/api/services');
      const response3 = await request(app).get('/api/services');
      
      // All requests should succeed
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      
      // All should return consistent structure
      [response1, response2, response3].forEach(response => {
        expect(Array.isArray(response.body.services)).toBe(true);
        expect(response.body.total).toBe(0);
        expect(response.body.running).toBe(0);
      });
    });

    it('should handle URL-encoded service IDs', async () => {
      const serviceId = 'service with spaces';
      const encodedId = encodeURIComponent(serviceId);
      const mockService: Service = {
        id: serviceId,
        name: 'Service with Spaces',
        status: 'running',
        startTime: new Date(),
        metadata: {}
      };

      (mockServiceManager.getServices as ReturnType<typeof vi.fn>).mockReturnValue([mockService]);

      const response = await request(app)
        .get(`/api/services/${encodedId}`)
        .expect(200);

      expect(response.body.id).toBe(serviceId);
    });

    it('should handle missing Content-Type header', async () => {
      // Express requires Content-Type for JSON parsing
      // Without it, the body won't be parsed and name will be undefined
      const response = await request(app)
        .post('/api/services')
        .send('{"name": "Test Service"}');

      // Should return 400 because name is missing (not parsed from body)
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Service name is required');
    });
  });
});

