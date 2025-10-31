/**
 * Assistant API Endpoints Tests
 * Tests for assistant service endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { AssistantService } from '../../src/services/assistant/assistant-service';
import { createAssistantRoutes } from '../../src/routes/assistant';

describe('Assistant API Endpoints', () => {
  let app: express.Application;
  let assistantService: AssistantService;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Create mock assistant service
    assistantService = {
      chat: vi.fn(),
      getSuggestions: vi.fn(),
      refineIdea: vi.fn(),
      getSessions: vi.fn(),
      getSessionMessages: vi.fn(),
    } as any;

    // Register routes
    app.use('/api/assistant', createAssistantRoutes(assistantService));
  });

  describe('POST /api/assistant/chat', () => {
    it('processes a chat message successfully', async () => {
      const mockResponse = {
        sessionId: 'session-1',
        message: 'Hello! How can I help you?',
        suggestions: [],
        citations: [],
        contextNodes: [],
      };

      (assistantService.chat as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/assistant/chat')
        .send({
          message: 'Hello',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);
      expect(assistantService.chat).toHaveBeenCalledWith(
        {
          message: 'Hello',
          sessionId: undefined,
          context: undefined,
        },
        'default'
      );
    });

    it('returns 400 when message is missing', async () => {
      const response = await request(app)
        .post('/api/assistant/chat')
        .send({
          // Missing message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('message is required');
    });

    it('handles chat with session ID', async () => {
      const mockResponse = {
        sessionId: 'session-1',
        message: 'Response',
        suggestions: [],
        citations: [],
        contextNodes: [],
      };

      (assistantService.chat as any).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/assistant/chat')
        .send({
          sessionId: 'session-1',
          message: 'Follow-up question',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(assistantService.chat).toHaveBeenCalledWith(
        {
          sessionId: 'session-1',
          message: 'Follow-up question',
          context: undefined,
        },
        'default'
      );
    });
  });

  describe('GET /api/assistant/suggestions', () => {
    it('retrieves proactive suggestions', async () => {
      const mockSuggestions = [
        {
          type: 'review_node',
          title: 'Review Node',
          description: 'Review this node',
          nodeId: 'node-1',
        },
      ];

      (assistantService.getSuggestions as any).mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .get('/api/assistant/suggestions')
        .query({ currentNodeId: 'node-1' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSuggestions);
      expect(assistantService.getSuggestions).toHaveBeenCalledWith('node-1', []);
    });

    it('handles suggestions with recent nodes', async () => {
      const mockSuggestions: any[] = [];

      (assistantService.getSuggestions as any).mockResolvedValue(mockSuggestions);

      const response = await request(app)
        .get('/api/assistant/suggestions')
        .query({
          currentNodeId: 'node-1',
          recentNodes: 'node-2,node-3',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(assistantService.getSuggestions).toHaveBeenCalledWith('node-1', ['node-2', 'node-3']);
    });
  });

  describe('POST /api/assistant/refine-idea', () => {
    it('refines a business idea', async () => {
      const mockRefinements = {
        suggestions: [
          {
            component: 'value_proposition',
            issue: 'Missing value proposition',
            suggestion: 'Add a clear value proposition',
          },
        ],
        confidence: 0.85,
      };

      (assistantService.refineIdea as any).mockResolvedValue(mockRefinements);

      const response = await request(app)
        .post('/api/assistant/refine-idea')
        .send({
          nodeId: 'node-1',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRefinements);
      expect(assistantService.refineIdea).toHaveBeenCalledWith('node-1');
    });

    it('returns 400 when nodeId is missing', async () => {
      const response = await request(app)
        .post('/api/assistant/refine-idea')
        .send({
          // Missing nodeId
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('nodeId is required');
    });
  });

  describe('GET /api/assistant/sessions', () => {
    it('retrieves all chat sessions', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          userId: 'user-1',
          startedAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          messageCount: 5,
        },
      ];

      (assistantService.getSessions as any).mockReturnValue(mockSessions);

      const response = await request(app)
        .get('/api/assistant/sessions')
        .query({ limit: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSessions);
      expect(assistantService.getSessions).toHaveBeenCalledWith('default', 50);
    });
  });

  describe('GET /api/assistant/sessions/:id', () => {
    it('retrieves session message history', async () => {
      const mockMessages = [
        {
          role: 'user',
          content: 'Hello',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date().toISOString(),
        },
      ];

      (assistantService.getSessionMessages as any).mockReturnValue(mockMessages);

      const response = await request(app)
        .get('/api/assistant/sessions/session-1')
        .query({ limit: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessionId).toBe('session-1');
      expect(response.body.data.messages).toEqual(mockMessages);
      expect(assistantService.getSessionMessages).toHaveBeenCalledWith('session-1', 100);
    });
  });
});

