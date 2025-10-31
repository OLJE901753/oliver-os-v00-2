import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock ResizeObserver (required by React Flow)
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
} as any

// Mock scrollIntoView (required by Assistant Chat)
Element.prototype.scrollIntoView = vi.fn(() => {})

// Mock IntersectionObserver (often required by React components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {
    // Mock implementation
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
} as any

// Mock matchMedia (required by some responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock getComputedStyle (required by some CSS-in-JS libraries)
window.getComputedStyle = vi.fn(() => ({
  getPropertyValue: vi.fn(() => ''),
})) as any