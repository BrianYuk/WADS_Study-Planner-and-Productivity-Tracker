/**
 * Frontend Form Validation Test Suite — Kira Flow
 * COMP6703001 Web Application Development & Security
 *
 * Maps to rubric Section 7.1 Frontend Testing:
 *   - Form validation testing
 *   - UI behavior testing
 *   - Error handling tests
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock global fetch
global.fetch = jest.fn()

import RegisterPage from '@/app/register/page'
import LoginPage from '@/app/login/page'

// ─────────────────────────────────────────────────────────────
// Register Page — Form Validation
// ─────────────────────────────────────────────────────────────
describe('Frontend: Register Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '1' } }),
    })
  })

  it('FE-REG-01: renders all registration fields', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText(/min\. 8 characters/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/repeat your password/i)).toBeInTheDocument()
  })

  it('FE-REG-02: shows error for invalid email format', async () => {
    render(<RegisterPage />)
    fireEvent.change(screen.getByPlaceholderText(/aditya pratama/i), { target: { value: 'Test Student' } })
    fireEvent.change(screen.getByPlaceholderText(/you@.*binus\.ac\.id/i), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByPlaceholderText(/min\. 8 characters/i), { target: { value: 'ValidPass123' } })
    fireEvent.change(screen.getByPlaceholderText(/repeat your password/i), { target: { value: 'ValidPass123' } })
    fireEvent.click(document.getElementById('terms')!)

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('FE-REG-03: shows error when password is too short', async () => {
    render(<RegisterPage />)
    fireEvent.change(screen.getByPlaceholderText(/aditya pratama/i), { target: { value: 'Test Student' } })
    fireEvent.change(screen.getByPlaceholderText(/you@.*binus\.ac\.id/i), { target: { value: 'student@binus.ac.id' } })
    fireEvent.change(screen.getByPlaceholderText(/min\. 8 characters/i), { target: { value: 'Ab1' } })
    fireEvent.change(screen.getByPlaceholderText(/repeat your password/i), { target: { value: 'Ab1' } })
    fireEvent.click(document.getElementById('terms')!)

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('FE-REG-04: shows error when passwords do not match', async () => {
    render(<RegisterPage />)
    fireEvent.change(screen.getByPlaceholderText(/aditya pratama/i), { target: { value: 'Test Student' } })
    fireEvent.change(screen.getByPlaceholderText(/you@.*binus\.ac\.id/i), { target: { value: 'student@binus.ac.id' } })
    fireEvent.change(screen.getByPlaceholderText(/min\. 8 characters/i), { target: { value: 'ValidPass123' } })
    fireEvent.change(screen.getByPlaceholderText(/repeat your password/i), { target: { value: 'Different123' } })
    fireEvent.click(document.getElementById('terms')!)

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    })
  })

  it('FE-REG-05: password strength meter updates as user types', () => {
    render(<RegisterPage />)
    const pwd = screen.getByPlaceholderText(/min\. 8 characters/i)
    fireEvent.change(pwd, { target: { value: 'ValidPass123!' } })
    // Strength requirements appear once a password is entered
    expect(screen.getByText(/8\+ chars/i)).toBeInTheDocument()
    expect(screen.getByText(/uppercase/i)).toBeInTheDocument()
    expect(screen.getByText(/number/i)).toBeInTheDocument()
  })

  it('FE-REG-06: blocks submission when terms not accepted', async () => {
    render(<RegisterPage />)
    fireEvent.change(screen.getByPlaceholderText(/aditya pratama/i), { target: { value: 'Test Student' } })
    fireEvent.change(screen.getByPlaceholderText(/you@.*binus\.ac\.id/i), { target: { value: 'student@binus.ac.id' } })
    fireEvent.change(screen.getByPlaceholderText(/min\. 8 characters/i), { target: { value: 'ValidPass123' } })
    fireEvent.change(screen.getByPlaceholderText(/repeat your password/i), { target: { value: 'ValidPass123' } })
    // Deliberately do NOT check the terms checkbox

    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText(/please accept the terms/i)).toBeInTheDocument()
    })
    // fetch should NOT have been called since validation blocked it
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────────────────────
// Login Page — Form Validation & Error Handling
// ─────────────────────────────────────────────────────────────
describe('Frontend: Login Form Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('FE-LOG-01: renders the login card', () => {
    render(<LoginPage />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('FE-LOG-02: shows error when fields are empty on submit', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/fill in all fields/i)).toBeInTheDocument()
    })
  })

  it('FE-LOG-03: shows error for invalid email format', async () => {
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText(/you@.*binus\.ac\.id/i), { target: { value: 'bad-email' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'something' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('FE-LOG-04: displays server error on failed login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    })
    render(<LoginPage />)
    fireEvent.change(screen.getByPlaceholderText(/you@.*binus\.ac\.id/i), { target: { value: 'student@binus.ac.id' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: 'WrongPass123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('FE-LOG-05: fills demo credentials when demo button clicked', () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByText(/fill demo credentials/i))
    const email = screen.getByPlaceholderText(/you@.*binus\.ac\.id/i) as HTMLInputElement
    expect(email.value).toBe('demo@kiraflow.app')
  })
})
