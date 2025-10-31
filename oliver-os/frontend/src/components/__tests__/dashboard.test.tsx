/**
 * Dashboard Component Tests
 * Tests for Dashboard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../dashboard/Dashboard';

global.fetch = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('Dashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('renders dashboard interface', () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], memories: [], stats: {} }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Oliver-OS Dashboard/i)).toBeInTheDocument();
  });

  it('displays overview tab by default', () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], memories: [], stats: {} }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Overview/i)).toBeInTheDocument();
  });

  it('fetches learning events data', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/learning/events'),
        expect.any(Object)
      );
    });
  });

  it('fetches knowledge graph stats', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        totalNodes: 0,
        totalRelationships: 0,
        nodesByType: {},
        relationshipsByType: {},
        averageConnections: 0,
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge/stats'),
        expect.any(Object)
      );
    });
  });

  it('fetches memory stats', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        total: 0,
        byStatus: {},
        byType: {},
        queueSize: 0,
        processingRate: 0,
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory/stats'),
        expect.any(Object)
      );
    });
  });

  it('switches between tabs', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ events: [], memories: [], stats: {} }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    const learningTab = screen.getByText(/Learning/i);
    fireEvent.click(learningTab);

    await waitFor(() => {
      expect(screen.getByText(/Learning Events/i)).toBeInTheDocument();
    });
  });
});

