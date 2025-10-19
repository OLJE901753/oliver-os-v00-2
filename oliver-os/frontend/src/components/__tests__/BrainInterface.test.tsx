import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrainInterface } from '../brain-interface/BrainInterface'

// Mock the useSocket hook
vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({
    isConnected: true,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  }),
}))

// Mock the useThoughtStore hook
vi.mock('@/stores/thoughtStore', () => ({
  useThoughtStore: () => ({
    thoughts: [],
    addThought: vi.fn(),
    processingStatus: null,
  }),
}))

describe('BrainInterface', () => {
  it('renders the main title', () => {
    render(<BrainInterface />)
    expect(screen.getByText('Oliver-OS Brain Interface')).toBeInTheDocument()
  })

  it('renders the thought input area', () => {
    render(<BrainInterface />)
    expect(screen.getByPlaceholderText('Share your thoughts... What\'s on your mind?')).toBeInTheDocument()
  })

  it('renders the process thought button', () => {
    render(<BrainInterface />)
    expect(screen.getByText('Process Thought')).toBeInTheDocument()
  })

  it('shows connection status', () => {
    render(<BrainInterface />)
    expect(screen.getByText('Connected to AI Brain')).toBeInTheDocument()
  })
})
