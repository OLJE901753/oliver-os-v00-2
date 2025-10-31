/**
 * Phase 4: Testing & Quality Assurance
 * Comprehensive test suites for all frontend components
 * Following BMAD principles: Break, Map, Automate, Document
 */

/**
 * 4.1 Knowledge Graph Component Tests
 * Tests for KnowledgeGraphViz component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KnowledgeGraphViz from '../knowledge-graph/KnowledgeGraphViz';

// Mock React Flow
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => <div data-testid="react-flow">{children}</div>,
  Background: () => <div>Background</div>,
  Controls: () => <div>Controls</div>,
  MiniMap: () => <div>MiniMap</div>,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  addEdge: vi.fn(),
}));

// Mock API calls
global.fetch = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('KnowledgeGraphViz', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('renders knowledge graph visualization', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nodes: [], relationships: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeGraphViz />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Knowledge Graph Visualization/i)).toBeInTheDocument();
  });

  it('displays search input', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nodes: [], relationships: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeGraphViz />
      </QueryClientProvider>
    );

    expect(screen.getByPlaceholderText(/Search nodes/i)).toBeInTheDocument();
  });

  it('displays filter dropdown', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nodes: [], relationships: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeGraphViz />
      </QueryClientProvider>
    );

    expect(screen.getByText(/All Types/i)).toBeInTheDocument();
  });

  it('creates new node when button clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nodes: [], relationships: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeGraphViz />
      </QueryClientProvider>
    );

    const newNodeButton = screen.getByText(/New Node/i);
    fireEvent.click(newNodeButton);

    await waitFor(() => {
      expect(screen.getByText(/Create New Node/i)).toBeInTheDocument();
    });
  });

  it('searches nodes when search term entered', async () => {
    const mockNodes = [
      {
        id: '1',
        type: 'concept',
        title: 'Test Concept',
        content: 'Test content',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nodes: mockNodes, relationships: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <KnowledgeGraphViz />
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText(/Search nodes/i);
    fireEvent.change(searchInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});

