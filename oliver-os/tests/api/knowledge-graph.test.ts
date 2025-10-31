/**
 * Phase 4.2: Backend API Testing
 * Comprehensive test suites for all API endpoints
 * Following BMAD principles: Break, Map, Automate, Document
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { Config } from '../../src/core/config';
import { KnowledgeGraphService } from '../../src/services/knowledge/knowledge-graph-service';
import { createKnowledgeGraphRoutes } from '../../src/routes/knowledge';

describe('Knowledge Graph API Endpoints', () => {
  let app: express.Application;
  let knowledgeGraphService: KnowledgeGraphService;
  let config: Config;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock config
    config = {
      get: vi.fn((key: string, defaultValue?: any) => {
        const configMap: Record<string, any> = {
          'openai.apiKey': 'test-key',
          'openai.baseURL': 'https://api.openai.com/v1',
        };
        return configMap[key] || defaultValue;
      }),
    } as any;

    // Create mock knowledge graph service
    knowledgeGraphService = {
      createNode: vi.fn(),
      getNode: vi.fn(),
      updateNode: vi.fn(),
      deleteNode: vi.fn(),
      getRelatedNodes: vi.fn(),
      getAllNodes: vi.fn(),
      searchNodes: vi.fn(),
      createRelationship: vi.fn(),
      deleteRelationship: vi.fn(),
      getAllRelationships: vi.fn(),
      getGraphStats: vi.fn(),
    } as any;

    // Register routes
    app.use('/api/knowledge', createKnowledgeGraphRoutes(knowledgeGraphService));
  });

  describe('POST /api/knowledge/nodes', () => {
    it('creates a new node successfully', async () => {
      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test Concept',
        content: 'Test content',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (knowledgeGraphService.createNode as any).mockResolvedValue(mockNode);

      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: 'concept',
          title: 'Test Concept',
          content: 'Test content',
        })
        .expect(201);

      expect(response.body.message).toBe('Node created successfully');
      expect(response.body.node).toEqual(mockNode);
      expect(knowledgeGraphService.createNode).toHaveBeenCalledWith({
        type: 'concept',
        title: 'Test Concept',
        content: 'Test content',
        metadata: undefined,
        tags: undefined,
      });
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: 'concept',
          // Missing title and content
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields');
      expect(response.body.message).toContain('type, title, and content are required');
    });

    it('handles service errors gracefully', async () => {
      (knowledgeGraphService.createNode as any).mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/knowledge/nodes')
        .send({
          type: 'concept',
          title: 'Test Concept',
          content: 'Test content',
        })
        .expect(500);

      expect(response.body.error).toBe('Failed to create node');
      expect(response.body.message).toBe('Service error');
    });
  });

  describe('GET /api/knowledge/nodes/:id', () => {
    it('retrieves a node by ID', async () => {
      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test Concept',
        content: 'Test content',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (knowledgeGraphService.getNode as any).mockResolvedValue(mockNode);

      const response = await request(app)
        .get('/api/knowledge/nodes/node-1')
        .expect(200);

      expect(response.body).toEqual(mockNode);
      expect(knowledgeGraphService.getNode).toHaveBeenCalledWith('node-1');
    });

    it('returns 404 when node not found', async () => {
      (knowledgeGraphService.getNode as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/knowledge/nodes/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('Node not found');
      expect(response.body.id).toBe('nonexistent');
    });
  });

  describe('GET /api/knowledge/nodes', () => {
    it('retrieves all nodes', async () => {
      const mockNodes = [
        {
          id: 'node-1',
          type: 'concept',
          title: 'Test Concept 1',
          content: 'Test content 1',
        },
        {
          id: 'node-2',
          type: 'project',
          title: 'Test Project',
          content: 'Test content 2',
        },
      ];

      (knowledgeGraphService.getAllNodes as any).mockResolvedValue(mockNodes);

      const response = await request(app)
        .get('/api/knowledge/nodes')
        .expect(200);

      expect(response.body).toEqual(mockNodes);
      expect(knowledgeGraphService.getAllNodes).toHaveBeenCalled();
    });
  });

  describe('POST /api/knowledge/relationships', () => {
    it('creates a new relationship', async () => {
      const mockRelationship = {
        id: 'rel-1',
        fromNodeId: 'node-1',
        toNodeId: 'node-2',
        type: 'related_to',
        strength: 0.8,
        timestamp: new Date().toISOString(),
      };

      (knowledgeGraphService.createRelationship as any).mockResolvedValue(mockRelationship);

      const response = await request(app)
        .post('/api/knowledge/relationships')
        .send({
          fromNodeId: 'node-1',
          toNodeId: 'node-2',
          type: 'related_to',
          strength: 0.8,
        })
        .expect(201);

      expect(response.body.message).toBe('Relationship created successfully');
      expect(response.body.relationship).toEqual(mockRelationship);
    });
  });

  describe('GET /api/knowledge/stats', () => {
    it('retrieves graph statistics', async () => {
      const mockStats = {
        totalNodes: 10,
        totalRelationships: 15,
        nodesByType: {
          concept: 5,
          project: 5,
        },
        relationshipsByType: {
          related_to: 15,
        },
        averageConnections: 1.5,
      };

      (knowledgeGraphService.getGraphStats as any).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/knowledge/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
    });
  });
});

