/**
 * Memory Capture API Endpoints Tests
 * Tests for memory capture service endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { CaptureMemoryService } from '../../src/services/memory/capture/capture-memory-service';
import { createMemoryCaptureRoutes } from '../../src/routes/memory-capture';

describe('Memory Capture API Endpoints', () => {
  let app: express.Application;
  let captureMemoryService: CaptureMemoryService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock memory capture service
    captureMemoryService = {
      captureMemory: vi.fn(),
      getMemory: vi.fn(),
      updateMemory: vi.fn(),
      getRecentMemories: vi.fn(),
      searchMemories: vi.fn(),
      getTimeline: vi.fn(),
      getStats: vi.fn(),
    } as any;

    // Register routes
    app.use('/api/memory', createMemoryCaptureRoutes(captureMemoryService));
  });

  describe('POST /api/memory/capture', () => {
    it('captures a new memory successfully', async () => {
      const mockMemory = {
        id: 'memory-1',
        rawContent: 'Test memory',
        type: 'text',
        status: 'raw',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      (captureMemoryService.captureMemory as any).mockResolvedValue(mockMemory);

      const response = await request(app)
        .post('/api/memory/capture')
        .send({
          rawContent: 'Test memory',
          type: 'text',
        })
        .expect(201);

      expect(response.body.message).toBe('Memory captured successfully');
      expect(response.body.memory).toEqual(mockMemory);
      expect(captureMemoryService.captureMemory).toHaveBeenCalledWith({
        rawContent: 'Test memory',
        type: 'text',
      });
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/memory/capture')
        .send({
          // Missing rawContent
          type: 'text',
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/memory/:id', () => {
    it('retrieves a memory by ID', async () => {
      const mockMemory = {
        id: 'memory-1',
        rawContent: 'Test memory',
        type: 'text',
        status: 'raw',
        timestamp: new Date().toISOString(),
      };

      (captureMemoryService.getMemory as any).mockResolvedValue(mockMemory);

      const response = await request(app)
        .get('/api/memory/memory-1')
        .expect(200);

      expect(response.body).toEqual(mockMemory);
      expect(captureMemoryService.getMemory).toHaveBeenCalledWith('memory-1');
    });

    it('returns 404 when memory not found', async () => {
      (captureMemoryService.getMemory as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/memory/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Memory not found');
    });
  });

  describe('GET /api/memory/timeline', () => {
    it('retrieves memory timeline', async () => {
      const mockMemories = [
        {
          id: 'memory-1',
          rawContent: 'Memory 1',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'memory-2',
          rawContent: 'Memory 2',
          timestamp: new Date().toISOString(),
        },
      ];

      (captureMemoryService.getTimeline as any).mockResolvedValue(mockMemories);

      const response = await request(app)
        .get('/api/memory/timeline')
        .query({ limit: 20 })
        .expect(200);

      expect(response.body.memories).toEqual(mockMemories);
      expect(captureMemoryService.getTimeline).toHaveBeenCalledWith(20);
    });
  });

  describe('GET /api/memory/search', () => {
    it('searches memories by query', async () => {
      const mockResults = [
        {
          id: 'memory-1',
          rawContent: 'Test memory',
          excerpt: 'Test memory...',
        },
      ];

      (captureMemoryService.searchMemories as any).mockResolvedValue(mockResults);

      const response = await request(app)
        .get('/api/memory/search')
        .query({ query: 'test' })
        .expect(200);

      expect(response.body.results).toEqual(mockResults);
      expect(response.body.query).toBe('test');
      expect(captureMemoryService.searchMemories).toHaveBeenCalledWith('test');
    });
  });

  describe('GET /api/memory/stats', () => {
    it('retrieves memory statistics', async () => {
      const mockStats = {
        totalMemories: 50,
        statusCounts: {
          raw: 10,
          processing: 5,
          organized: 35,
        },
        typeCounts: {
          text: 40,
          voice: 10,
        },
        queueSize: 2,
        processingRate: 5,
      };

      (captureMemoryService.getStats as any).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/memory/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
    });
  });
});

