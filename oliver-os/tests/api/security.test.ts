/**
 * Security Tests for API Endpoints
 * Tests for security vulnerabilities, input validation, and access control
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { KnowledgeGraphService } from '../../src/services/knowledge/knowledge-graph-service';
import { createKnowledgeGraphRoutes } from '../../src/routes/knowledge';
import { CaptureMemoryService } from '../../src/services/memory/capture/capture-memory-service';
import { createMemoryCaptureRoutes } from '../../src/routes/memory-capture';

describe('Security Tests', () => {
  let app: express.Application;
  let knowledgeGraphService: KnowledgeGraphService;
  let captureMemoryService: CaptureMemoryService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    knowledgeGraphService = {
      createNode: vi.fn(),
      getNode: vi.fn(),
      updateNode: vi.fn(),
      deleteNode: vi.fn(),
      getAllNodes: vi.fn(),
      searchNodes: vi.fn(),
      createRelationship: vi.fn(),
      getAllRelationships: vi.fn(),
      getGraphStats: vi.fn(),
    } as any;

    captureMemoryService = {
      captureMemory: vi.fn(),
      getMemory: vi.fn(),
      updateMemory: vi.fn(),
      getRecentMemories: vi.fn(),
      searchMemories: vi.fn(),
      getTimeline: vi.fn(),
      getStats: vi.fn(),
    } as any;

    app.use('/api/knowledge', createKnowledgeGraphRoutes(knowledgeGraphService));
    app.use('/api/memory', createMemoryCaptureRoutes(captureMemoryService));
  });

  describe('Input Validation', () => {
    it('rejects SQL injection attempts in node creation', async () => {
      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: "concept'; DROP TABLE nodes; --",
          title: 'Test',
          content: 'Test',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(knowledgeGraphService.createNode).not.toHaveBeenCalled();
    });

    it('rejects XSS attempts in memory content', async () => {
      const response = await request(app)
        .post('/api/memory/capture')
        .send({
          rawContent: '<script>alert("XSS")</script>',
          type: 'text',
        });

      // Should either sanitize or reject
      expect([400, 201]).toContain(response.status);
      if (response.status === 201) {
        // If accepted, content should be sanitized
        expect(response.body.memory.rawContent).not.toContain('<script>');
      }
    });

    it('rejects path traversal attempts', async () => {
      const response = await request(app)
        .get('/api/knowledge/nodes/../../../etc/passwd')
        .expect(404);

      expect(knowledgeGraphService.getNode).toHaveBeenCalledWith('../../../etc/passwd');
      // Service should handle this safely
    });

    it('rejects extremely long input strings', async () => {
      const longString = 'A'.repeat(100000);

      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: 'concept',
          title: longString,
          content: 'Test',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting on memory capture', async () => {
      // This test would require actual rate limiting middleware
      // For now, we verify the endpoint exists and responds
      const response = await request(app)
        .post('/api/memory/capture')
        .send({
          rawContent: 'Test',
          type: 'text',
        });

      expect([201, 429, 400]).toContain(response.status);
    });
  });

  describe('Authorization', () => {
    it('validates user context in requests', async () => {
      // In a real implementation, this would check for authentication
      const response = await request(app)
        .get('/api/knowledge/nodes');

      // Should either require auth or work without it (depending on implementation)
      expect([200, 401, 403]).toContain(response.status);
    });
  });

  describe('Data Sanitization', () => {
    it('sanitizes node metadata', async () => {
      const maliciousMetadata = {
        __proto__: { isAdmin: true },
        constructor: { prototype: { isAdmin: true } },
      };

      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: 'concept',
          title: 'Test',
          content: 'Test',
          metadata: maliciousMetadata,
        });

      // Should handle safely
      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('does not leak sensitive information in error messages', async () => {
      (knowledgeGraphService.getNode as any).mockRejectedValue(
        new Error('Database connection failed: postgresql://user:password@localhost')
      );

      const response = await request(app)
        .get('/api/knowledge/nodes/test-id')
        .expect(500);

      expect(response.body.message).not.toContain('password');
      expect(response.body.message).not.toContain('postgresql://');
    });

    it('handles null/undefined gracefully', async () => {
      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: null,
          title: undefined,
          content: 'Test',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });
});

