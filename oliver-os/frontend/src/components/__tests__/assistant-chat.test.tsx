/**
 * Assistant Chat Component Tests
 * Tests for AssistantChat component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssistantChat from '../assistant/AssistantChat';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

global.fetch = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('AssistantChat', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('renders assistant chat interface', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AssistantChat />
      </QueryClientProvider>
    );

    expect(screen.getByText(/AI Assistant/i)).toBeInTheDocument();
  });

  it('displays empty state when no messages', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AssistantChat />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Start a conversation/i)).toBeInTheDocument();
  });

  it('sends message when input submitted', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            sessionId: 'session-1',
            message: 'Test response',
            contextNodes: [],
          },
        }),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <AssistantChat />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(/Ask me anything/i);
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assistant/chat'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('creates new session when new session button clicked', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'session-1',
            userId: 'user-1',
            startedAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            messageCount: 0,
          },
        }),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <AssistantChat />
      </QueryClientProvider>
    );

    const newSessionButton = screen.getByRole('button', { name: /new session/i });
    fireEvent.click(newSessionButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('displays proactive suggestions', async () => {
    const mockSuggestions = [
      {
        type: 'review_node',
        title: 'Review Node',
        description: 'Review this node',
        nodeId: 'node-1',
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockSuggestions,
        }),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <AssistantChat />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assistant/suggestions'),
        expect.any(Object)
      );
    });
  });
});

