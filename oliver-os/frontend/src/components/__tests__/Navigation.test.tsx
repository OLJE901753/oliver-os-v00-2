import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { Navigation } from '../layout/Navigation'

const NavigationWithRouter = () => (
  <BrowserRouter>
    <Navigation />
  </BrowserRouter>
)

describe('Navigation', () => {
  it('renders the logo and title', () => {
    render(<NavigationWithRouter />)
    expect(screen.getByText('Oliver-OS')).toBeInTheDocument()
    expect(screen.getByText('AI Brain Interface')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<NavigationWithRouter />)
    expect(screen.getByText('Brain Interface')).toBeInTheDocument()
    expect(screen.getByText('Collaborate')).toBeInTheDocument()
    expect(screen.getByText('Visualize')).toBeInTheDocument()
    expect(screen.getByText('Thoughts')).toBeInTheDocument()
  })

  it('renders user menu', () => {
    render(<NavigationWithRouter />)
    expect(screen.getByText('User')).toBeInTheDocument()
  })
})
