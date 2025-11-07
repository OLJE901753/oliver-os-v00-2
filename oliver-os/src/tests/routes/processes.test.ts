/**
 * Processes Route Tests
 * Comprehensive tests for process management endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { processesRouter, initializeProcessesRouter } from '../../routes/processes';
import type { ProcessManager } from '../../core/process-manager';
import type { Process } from '../../core/process-manager';

describe('Processes Route Tests', () => {
  let app: express.Application;
  let mockProcessManager: ProcessManager;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock process manager
    mockProcessManager = {
      getProcesses: vi.fn(),
      startProcess: vi.fn(),
      stopProcess: vi.fn(),
      getProcess: vi.fn(),
    } as any;

    // Initialize router with mock process manager
    initializeProcessesRouter(mockProcessManager);
    
    // Register routes
    app.use('/api/processes', processesRouter);
  });

  describe('GET /api/processes', () => {
    it('should return all processes', async () => {
      const mockProcesses: Process[] = [
        {
          id: 'proc-1',
          name: 'Test Process 1',
          status: 'running',
          pid: 1234,
          startTime: new Date(),
          metadata: { type: 'test' }
        },
        {
          id: 'proc-2',
          name: 'Test Process 2',
          status: 'stopped',
          pid: 5678,
          startTime: new Date(),
          endTime: new Date(),
          metadata: {}
        }
      ];

      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue(mockProcesses);

      const response = await request(app)
        .get('/api/processes')
        .expect(200);

      expect(Array.isArray(response.body.processes)).toBe(true);
      expect(response.body.processes.length).toBe(2);
      expect(response.body.total).toBe(2);
      expect(response.body.running).toBe(1);
      expect(response.body.timestamp).toBeDefined();
      expect(mockProcessManager.getProcesses).toHaveBeenCalled();
    });

    it('should return empty array when no processes', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .get('/api/processes')
        .expect(200);

      expect(response.body.processes).toEqual([]);
      expect(response.body.total).toBe(0);
      expect(response.body.running).toBe(0);
    });

    it('should return 503 when ProcessManager not initialized', async () => {
      initializeProcessesRouter(null as any);

      const response = await request(app)
        .get('/api/processes')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ProcessManager not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/processes')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve processes');
    });
  });

  describe('GET /api/processes/:id', () => {
    it('should return specific process by ID', async () => {
      const mockProcesses: Process[] = [
        {
          id: 'proc-1',
          name: 'Test Process',
          status: 'running',
          pid: 1234,
          startTime: new Date(),
          metadata: { type: 'test' }
        }
      ];

      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue(mockProcesses);

      const response = await request(app)
        .get('/api/processes/proc-1')
        .expect(200);

      expect(response.body.id).toBe('proc-1');
      expect(response.body.name).toBe('Test Process');
      expect(response.body.status).toBe('running');
      expect(response.body.pid).toBe(1234);
      expect(response.body.metadata).toEqual({ type: 'test' });
    });

    it('should return 404 when process not found', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .get('/api/processes/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Process not found');
      expect(response.body.id).toBe('non-existent');
      expect(response.body.message).toBe('The requested process does not exist');
    });

    it('should return 503 when ProcessManager not initialized', async () => {
      initializeProcessesRouter(null as any);

      const response = await request(app)
        .get('/api/processes/proc-1')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ProcessManager not initialized');
    });

    it('should handle service errors gracefully', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Process lookup failed');
      });

      const response = await request(app)
        .get('/api/processes/proc-1')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Failed to retrieve process');
    });
  });

  describe('POST /api/processes', () => {
    it('should create a new process successfully', async () => {
      const processId = 'proc-123';
      const newProcess: Process = {
        id: processId,
        name: 'New Process',
        status: 'running',
        pid: 9999,
        startTime: new Date(),
        metadata: { environment: 'test' }
      };

      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([newProcess]);

      const response = await request(app)
        .post('/api/processes')
        .send({
          name: 'New Process',
          description: 'Test process',
          metadata: { environment: 'test' }
        })
        .expect(201);

      expect(response.body.message).toBe('Process created successfully');
      expect(response.body.process).toBeDefined();
      expect(response.body.process.name).toBe('New Process');
      expect(response.body.process.id).toBe(processId);
      expect(mockProcessManager.startProcess).toHaveBeenCalledWith(
        'New Process',
        'Test process',
        { environment: 'test' }
      );
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/processes')
        .send({
          description: 'Test process'
        })
        .expect(400);

      expect(response.body.error).toBe('Process name is required');
      expect(response.body.message).toBe('Please provide a name for the process');
      expect(mockProcessManager.startProcess).not.toHaveBeenCalled();
    });

    it('should use empty object for metadata when not provided', async () => {
      const processId = 'proc-123';
      const newProcess: Process = {
        id: processId,
        name: 'New Process',
        status: 'running',
        pid: 9999,
        startTime: new Date(),
        metadata: {}
      };

      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([newProcess]);

      const response = await request(app)
        .post('/api/processes')
        .send({
          name: 'New Process'
        })
        .expect(201);

      expect(response.body.process.metadata).toEqual({});
      expect(mockProcessManager.startProcess).toHaveBeenCalledWith(
        'New Process',
        undefined,
        {}
      );
    });

    it('should return 503 when ProcessManager not initialized', async () => {
      initializeProcessesRouter(null as any);

      const response = await request(app)
        .post('/api/processes')
        .send({
          name: 'New Process'
        })
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ProcessManager not initialized');
    });

    it('should handle process creation errors', async () => {
      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Process creation failed')
      );

      const response = await request(app)
        .post('/api/processes')
        .send({
          name: 'New Process'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Process creation failed');
    });

    it('should handle case when process is not found after creation', async () => {
      const processId = 'proc-123';
      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .post('/api/processes')
        .send({
          name: 'New Process'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Process creation failed');
    });
  });

  describe('DELETE /api/processes/:id', () => {
    it('should delete a process successfully', async () => {
      const processToDelete: Process = {
        id: 'proc-1',
        name: 'Process to Delete',
        status: 'running',
        pid: 1234,
        startTime: new Date(),
        metadata: {}
      };

      const allProcesses: Process[] = [processToDelete];

      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue(allProcesses);
      (mockProcessManager.stopProcess as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/processes/proc-1')
        .expect(200);

      expect(response.body.message).toBe('Process deleted successfully');
      expect(response.body.process.id).toBe('proc-1');
      expect(response.body.process.name).toBe('Process to Delete');
      expect(mockProcessManager.stopProcess).toHaveBeenCalledWith('proc-1');
    });

    it('should return 404 when process not found', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const response = await request(app)
        .delete('/api/processes/non-existent')
        .expect(404);

      expect(response.body.error).toBe('Process not found');
      expect(response.body.id).toBe('non-existent');
      expect(response.body.message).toBe('The process to delete does not exist');
      expect(mockProcessManager.stopProcess).not.toHaveBeenCalled();
    });

    it('should return 503 when ProcessManager not initialized', async () => {
      initializeProcessesRouter(null as any);

      const response = await request(app)
        .delete('/api/processes/proc-1')
        .expect(503);

      expect(response.body.error).toBe('Service unavailable');
      expect(response.body.message).toBe('ProcessManager not initialized');
    });

    it('should handle process deletion errors', async () => {
      const processToDelete: Process = {
        id: 'proc-1',
        name: 'Process to Delete',
        status: 'running',
        pid: 1234,
        startTime: new Date(),
        metadata: {}
      };

      const allProcesses: Process[] = [processToDelete];

      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue(allProcesses);
      (mockProcessManager.stopProcess as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Process stop failed')
      );

      const response = await request(app)
        .delete('/api/processes/proc-1')
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
      expect(response.body.message).toBe('Process stop failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/processes')
        .set('Content-Type', 'application/json')
        .send('{"name": "Test", invalid json}')
        .expect(400);
      
      expect(response.status).toBe(400);
    });

    it('should handle very long process names', async () => {
      const longName = 'A'.repeat(10000);
      const processId = 'proc-long-name';
      const newProcess: Process = {
        id: processId,
        name: longName,
        status: 'running',
        pid: 9999,
        startTime: new Date(),
        metadata: {}
      };

      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([newProcess]);

      const response = await request(app)
        .post('/api/processes')
        .send({ name: longName })
        .expect(201);

      expect(response.body.process.name).toBe(longName);
      expect(response.body.process.name.length).toBe(10000);
    });

    it('should handle special characters in process ID from route parameter', async () => {
      const specialId = 'proc-!@#$%^&*()';
      const mockProcess: Process = {
        id: specialId,
        name: 'Special Process',
        status: 'running',
        pid: 1234,
        startTime: new Date(),
        metadata: {}
      };

      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([mockProcess]);

      const response = await request(app)
        .get(`/api/processes/${encodeURIComponent(specialId)}`)
        .expect(200);

      expect(response.body.id).toBe(specialId);
    });

    it('should handle empty string as process name', async () => {
      const response = await request(app)
        .post('/api/processes')
        .send({ name: '' })
        .expect(400);

      expect(response.body.error).toBe('Process name is required');
    });

    it('should handle null as process name', async () => {
      const response = await request(app)
        .post('/api/processes')
        .send({ name: null })
        .expect(400);

      expect(response.body.error).toBe('Process name is required');
    });

    it('should handle non-string process name', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);
      
      const response = await request(app)
        .post('/api/processes')
        .send({ name: 12345 });

      expect([400, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.error).toBe('Process name is required');
      }
    });

    it('should handle very large metadata objects', async () => {
      const largeMetadata: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeMetadata[`key-${i}`] = `value-${i}`.repeat(10);
      }

      const processId = 'proc-large-metadata';
      const newProcess: Process = {
        id: processId,
        name: 'Large Metadata Process',
        status: 'running',
        pid: 9999,
        startTime: new Date(),
        metadata: largeMetadata
      };

      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([newProcess]);

      const response = await request(app)
        .post('/api/processes')
        .send({ name: 'Large Metadata Process', metadata: largeMetadata })
        .expect(201);

      expect(Object.keys(response.body.process.metadata).length).toBe(100);
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

      const processId = 'proc-nested';
      const newProcess: Process = {
        id: processId,
        name: 'Nested Metadata Process',
        status: 'running',
        pid: 9999,
        startTime: new Date(),
        metadata: nestedMetadata
      };

      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([newProcess]);

      const response = await request(app)
        .post('/api/processes')
        .send({ name: 'Nested Metadata Process', metadata: nestedMetadata })
        .expect(201);

      expect(response.body.process.metadata).toEqual(nestedMetadata);
    });

    it('should handle multiple sequential requests to same endpoint', async () => {
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);
      
      const response1 = await request(app).get('/api/processes');
      const response2 = await request(app).get('/api/processes');
      const response3 = await request(app).get('/api/processes');
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
      
      [response1, response2, response3].forEach(response => {
        expect(Array.isArray(response.body.processes)).toBe(true);
        expect(response.body.total).toBe(0);
        expect(response.body.running).toBe(0);
      });
    });

    it('should handle URL-encoded process IDs', async () => {
      const processId = 'process with spaces';
      const encodedId = encodeURIComponent(processId);
      const mockProcess: Process = {
        id: processId,
        name: 'Process with Spaces',
        status: 'running',
        pid: 1234,
        startTime: new Date(),
        metadata: {}
      };

      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([mockProcess]);

      const response = await request(app)
        .get(`/api/processes/${encodedId}`)
        .expect(200);

      expect(response.body.id).toBe(processId);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'B'.repeat(5000);
      const processId = 'proc-long-desc';
      const newProcess: Process = {
        id: processId,
        name: 'Long Description Process',
        status: 'running',
        pid: 9999,
        startTime: new Date(),
        metadata: {}
      };

      (mockProcessManager.startProcess as ReturnType<typeof vi.fn>).mockResolvedValue(processId);
      (mockProcessManager.getProcesses as ReturnType<typeof vi.fn>).mockReturnValue([newProcess]);

      await request(app)
        .post('/api/processes')
        .send({ name: 'Long Description Process', description: longDescription })
        .expect(201);

      expect(mockProcessManager.startProcess).toHaveBeenCalledWith(
        'Long Description Process',
        longDescription,
        {}
      );
    });
  });
});

