/**
 * E2E Test Setup for Frontend Components
 * Integration tests for component interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import KnowledgeGraphViz from '../knowledge-graph/KnowledgeGraphViz';
import MemoryCapture from '../memory-capture/MemoryCapture';
import AssistantChat from '../assistant/AssistantChat';
import Dashboard from '../dashboard/Dashboard';
import React from 'react';

// Mock all API calls
global.fetch = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

describe('E2E Component Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  describe('Knowledge Graph Integration', () => {
    it('creates node and displays in graph', async () => {
      const mockNode = {
        id: 'node-1',
        type: 'concept',
        title: 'Test Node',
        content: 'Test content',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nodes: [], relationships: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Node created successfully',
            node: mockNode,
          }),
        });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <KnowledgeGraphViz />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const newNodeButton = screen.getByText(/New Node/i);
      fireEvent.click(newNodeButton);

      await waitFor(() => {
        expect(screen.getByText(/Create New Node/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText(/Enter node title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Node' } });

      const contentInput = screen.getByPlaceholderText(/Enter node content/i);
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      const saveButton = screen.getByText(/Save/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/knowledge/nodes'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Test Node'),
          })
        );
      });
    });
  });

  describe('Memory Capture Integration', () => {
    it('captures memory and displays in timeline', async () => {
      const mockMemory = {
        id: 'memory-1',
        rawContent: 'Test memory',
        type: 'text',
        status: 'raw',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            memories: [],
            stats: { total: 0, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            message: 'Memory captured successfully',
            memory: mockMemory,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            memories: [mockMemory],
            count: 1,
          }),
        });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <MemoryCapture />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const textarea = screen.getByPlaceholderText(/Quick capture your thoughts/i);
      fireEvent.change(textarea, { target: { value: 'Test memory' } });

      const submitButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/memory/capture'),
          expect.any(Object)
        );
      });

      const timelineTab = screen.getByText(/Timeline/i);
      fireEvent.click(timelineTab);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/memory/timeline'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Assistant Chat Integration', () => {
    it('sends message and receives response with citations', async () => {
      const mockResponse = {
        sessionId: 'session-1',
        message: 'Test response',
        citations: [
          {
            nodeId: 'node-1',
            title: 'Test Node',
            excerpt: 'Test excerpt',
          },
        ],
        contextNodes: ['node-1'],
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockResponse,
          }),
        });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <AssistantChat />
          </MemoryRouter>
        </QueryClientProvider>
      );

      const input = screen.getByPlaceholderText(/Ask me anything/i);
      fireEvent.change(input, { target: { value: 'Test question' } });

      const sendButton = screen.getByRole('button', { name: /send/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/assistant/chat'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Test question'),
          })
        );
      });
    });
  });

  describe('Dashboard Integration', () => {
    it('displays all stats from different services', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ events: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            totalNodes: 10,
            totalRelationships: 20,
            nodesByType: { concept: 5, project: 5 },
            relationshipsByType: { related_to: 20 },
            averageConnections: 2.0,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            total: 50,
            byStatus: { raw: 10, processing: 5, organized: 35 },
            byType: { text: 40, voice: 10 },
            queueSize: 2,
            processingRate: 5,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            status: 'healthy',
          }),
        });

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Dashboard />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/learning/events'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/knowledge/stats'),
          expect.any(Object)
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/memory/stats'),
          expect.any(Object)
        );
      });
    });
  });
});

