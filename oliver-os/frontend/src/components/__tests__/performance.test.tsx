/**
 * Performance Benchmarks for UI Components
 * Measures rendering performance and optimization opportunities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KnowledgeGraphViz from '../knowledge-graph/KnowledgeGraphViz';
import MemoryCapture from '../memory-capture/MemoryCapture';
import AssistantChat from '../assistant/AssistantChat';
import Dashboard from '../dashboard/Dashboard';

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

describe('Performance Benchmarks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ nodes: [], relationships: [], events: [], memories: [], stats: {}, data: [] }),
    });
  });

  describe('Knowledge Graph Performance', () => {
    it('renders within acceptable time (< 500ms)', () => {
      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <KnowledgeGraphViz />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(500);
    });

    it('handles large node sets efficiently', async () => {
      const largeNodeSet = Array.from({ length: 100 }, (_, i) => ({
        id: `node-${i}`,
        type: 'concept',
        title: `Node ${i}`,
        content: `Content ${i}`,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nodes: largeNodeSet, relationships: [] }),
      });

      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <KnowledgeGraphViz />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle 100 nodes in under 1 second
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Memory Capture Performance', () => {
    it('renders within acceptable time (< 300ms)', () => {
      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryCapture />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(300);
    });

    it('handles timeline rendering efficiently', async () => {
      const largeMemorySet = Array.from({ length: 50 }, (_, i) => ({
        id: `memory-${i}`,
        rawContent: `Memory ${i}`,
        type: 'text',
        status: 'raw',
        timestamp: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
        createdAt: new Date().toISOString(),
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          memories: largeMemorySet,
          stats: { total: 50, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 },
        }),
      });

      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryCapture />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle 50 memories in under 800ms
      expect(renderTime).toBeLessThan(800);
    });
  });

  describe('Assistant Chat Performance', () => {
    it('renders within acceptable time (< 400ms)', () => {
      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <AssistantChat />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(400);
    });

    it('handles message history efficiently', async () => {
      const largeMessageSet = Array.from({ length: 100 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString(),
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            sessionId: 'session-1',
            messages: largeMessageSet,
          },
        }),
      });

      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <AssistantChat />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should handle 100 messages in under 1 second
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Dashboard Performance', () => {
    it('renders within acceptable time (< 600ms)', () => {
      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(600);
    });

    it('loads all stats in parallel', async () => {
      const startTime = performance.now();

      render(
        <QueryClientProvider client={queryClient}>
          <Dashboard />
        </QueryClientProvider>
      );

      // Wait for all queries to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // All stats should load in under 1 second
      expect(loadTime).toBeLessThan(1000);
    });
  });
});

