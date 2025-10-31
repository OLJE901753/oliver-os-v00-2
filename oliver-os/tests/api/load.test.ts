/**
 * Load Testing for API Endpoints
 * Tests for performance under load and concurrent requests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { KnowledgeGraphService } from '../../src/services/knowledge/knowledge-graph-service';
import { createKnowledgeGraphRoutes } from '../../src/routes/knowledge';
import { CaptureMemoryService } from '../../src/services/memory/capture/capture-memory-service';
import { createMemoryCaptureRoutes } from '../../src/routes/memory-capture';

describe('Load Testing', () => {
  let app: express.Application;
  let knowledgeGraphService: KnowledgeGraphService;
  let captureMemoryService: CaptureMemoryService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    knowledgeGraphService = {
      createNode: vi.fn(),
      getNode: vi.fn(),
      getAllNodes: vi.fn(),
      searchNodes: vi.fn(),
      getGraphStats: vi.fn(),
    } as any;

    captureMemoryService = {
      captureMemory: vi.fn(),
      getRecentMemories: vi.fn(),
      searchMemories: vi.fn(),
      getStats: vi.fn(),
    } as any;

    app.use('/api/knowledge', createKnowledgeGraphRoutes(knowledgeGraphService));
    app.use('/api/memory', createMemoryCaptureRoutes(captureMemoryService));
  });

  describe('Concurrent Requests', () => {
    it('handles multiple concurrent node creation requests', async () => {
      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test',
        content: 'Test',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (knowledgeGraphService.createNode as any).mockResolvedValue(mockNode);

      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/knowledge/nodes')
          .send({
            type: 'concept',
            title: `Test ${i}`,
            content: `Test content ${i}`,
          })
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // All requests should succeed
      responses.forEach((response) => {
        expect([201, 200]).toContain(response.status);
      });

      // Should complete within reasonable time (< 2 seconds for 10 requests)
      expect(duration).toBeLessThan(2000);
    });

    it('handles concurrent memory searches', async () => {
      (captureMemoryService.searchMemories as any).mockResolvedValue([]);

      const requests = Array.from({ length: 20 }, () =>
        request(app).get('/api/memory/search').query({ query: 'test' })
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests);
      const endTime = performance.now();
      const duration = endTime - startTime;

      responses.forEach((response) => {
        expect([200, 400]).toContain(response.status);
      });

      // Should handle 20 concurrent searches in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Performance Benchmarks', () => {
    it('node creation responds within acceptable time', async () => {
      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test',
        content: 'Test',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (knowledgeGraphService.createNode as any).mockResolvedValue(mockNode);

      const startTime = performance.now();
      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: 'concept',
          title: 'Test',
          content: 'Test',
        });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(500); // Should respond in under 500ms
    });

    it('graph stats retrieval is fast', async () => {
      (knowledgeGraphService.getGraphStats as any).mockResolvedValue({
        totalNodes: 100,
        totalRelationships: 200,
        nodesByType: {},
        relationshipsByType: {},
        averageConnections: 2,
      });

      const startTime = performance.now();
      const response = await request(app).get('/api/knowledge/stats');
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(300); // Should respond in under 300ms
    });

    it('memory capture handles large payloads efficiently', async () => {
      const largeContent = 'A'.repeat(10000); // 10KB content

      const mockMemory = {
        id: 'memory-1',
        rawContent: largeContent,
        type: 'text',
        status: 'raw',
        timestamp: new Date().toISOString(),
      };

      (captureMemoryService.captureMemory as any).mockResolvedValue(mockMemory);

      const startTime = performance.now();
      const response = await request(app)
        .post('/api/memory/capture')
        .send({
          rawContent: largeContent,
          type: 'text',
        });
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(201);
      expect(duration).toBeLessThan(1000); // Should handle large payloads in under 1s
    });
  });

  describe('Stress Testing', () => {
    it('maintains performance under sustained load', async () => {
      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test',
        content: 'Test',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (knowledgeGraphService.createNode as any).mockResolvedValue(mockNode);

      const batchSize = 50;
      const batches = 5;
      const totalRequests = batchSize * batches;

      const startTime = performance.now();

      for (let batch = 0; batch < batches; batch++) {
        const requests = Array.from({ length: batchSize }, (_, i) =>
          request(app)
            .post('/api/knowledge/nodes')
            .send({
              type: 'concept',
              title: `Test ${batch}-${i}`,
              content: `Test content ${batch}-${i}`,
            })
        );

        await Promise.all(requests);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgTimePerRequest = duration / totalRequests;

      // Average time per request should be reasonable
      expect(avgTimePerRequest).toBeLessThan(100); // Less than 100ms per request on average
    });
  });
});

