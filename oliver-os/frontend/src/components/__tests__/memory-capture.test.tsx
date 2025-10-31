/**
 * Memory Capture Component Tests
 * Tests for MemoryCapture component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MemoryCapture from '../memory-capture/MemoryCapture';

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Web Speech API
global.SpeechRecognition = vi.fn().mockImplementation(() => ({
  continuous: false,
  interimResults: false,
  lang: 'en-US',
  start: vi.fn(),
  stop: vi.fn(),
  onresult: null,
  onerror: null,
  onend: null,
})) as any;

(global as any).webkitSpeechRecognition = global.SpeechRecognition;

// Mock MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
  state: 'inactive',
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null,
  onstop: null,
})) as any;

global.fetch = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('MemoryCapture', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('renders memory capture interface', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: [], stats: { total: 0, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 } }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryCapture />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Memory Capture/i)).toBeInTheDocument();
  });

  it('displays capture tab by default', () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: [], stats: { total: 0, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 } }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryCapture />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Quick Capture/i)).toBeInTheDocument();
  });

  it('captures text memory', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: [], stats: { total: 0, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Memory captured successfully', memory: { id: '1' } }),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryCapture />
      </QueryClientProvider>
    );

    const textarea = screen.getByPlaceholderText(/Quick capture your thoughts/i);
    fireEvent.change(textarea, { target: { value: 'Test memory' } });

    const submitButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory/capture'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('switches to timeline tab', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ memories: [], stats: { total: 0, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 } }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryCapture />
      </QueryClientProvider>
    );

    const timelineTab = screen.getByText(/Timeline/i);
    fireEvent.click(timelineTab);

    await waitFor(() => {
      expect(screen.getByText(/Timeline/i)).toBeInTheDocument();
    });
  });

  it('searches memories', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ memories: [], stats: { total: 0, byStatus: {}, byType: {}, queueSize: 0, processingRate: 0 } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [], query: 'test', count: 0 }),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryCapture />
      </QueryClientProvider>
    );

    const searchTab = screen.getByText(/Search/i);
    fireEvent.click(searchTab);

    const searchInput = screen.getByPlaceholderText(/Search memories/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory/search'),
        expect.any(Object)
      );
    });
  });
});

