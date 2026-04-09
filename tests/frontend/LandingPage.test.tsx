/**
 * Frontend Tests: Landing Page
 * Week 4 – Frontend Testing
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

import LandingPage from '@/app/page'

describe('LandingPage – Rendering', () => {
  it('LA-01: renders the hero heading', () => {
    render(<LandingPage />)
    expect(screen.getByText(/your ai study partner/i)).toBeInTheDocument()
  })

  it('LA-02: renders Get Started CTA button', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link')
    const ctaLink = links.find(l => l.textContent?.includes('Start for free'))
    expect(ctaLink).toBeInTheDocument()
  })

  it('LA-03: renders Sign In link', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link')
    const signIn = links.find(l => l.getAttribute('href') === '/login')
    expect(signIn).toBeInTheDocument()
  })

  it('LA-04: renders 6 feature cards', () => {
    render(<LandingPage />)
    expect(screen.getByText(/ai task prioritization/i)).toBeInTheDocument()
    expect(screen.getByText(/burnout detection/i)).toBeInTheDocument()
    expect(screen.getByText(/smart scheduling/i)).toBeInTheDocument()
    expect(screen.getByText(/study timer/i)).toBeInTheDocument()
    expect(screen.getByText(/analytics/i)).toBeInTheDocument()
    expect(screen.getByText(/secure by design/i)).toBeInTheDocument()
  })

  it('LA-05: renders stats row', () => {
    render(<LandingPage />)
    expect(screen.getByText(/free to use/i)).toBeInTheDocument()
  })

  it('LA-06: renders footer with BINUS credit', () => {
    render(<LandingPage />)
    expect(screen.getByText(/binus university/i)).toBeInTheDocument()
  })

  it('LA-07: Get Started links to /register', () => {
    render(<LandingPage />)
    const links = screen.getAllByRole('link')
    const registerLinks = links.filter(l => l.getAttribute('href') === '/register')
    expect(registerLinks.length).toBeGreaterThan(0)
  })

  it('LA-08: renders AI Priority Queue preview', () => {
    render(<LandingPage />)
    expect(screen.getByText(/ai priority queue/i)).toBeInTheDocument()
  })
})
