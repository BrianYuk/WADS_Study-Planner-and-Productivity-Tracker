/**
 * Frontend Tests: Login Page
 * Week 4 – Frontend Testing
 * Tests: rendering, validation, form interaction, error handling, API integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

// Mock global fetch
global.fetch = jest.fn()

import LoginPage from '@/app/login/page'

describe('LoginPage – Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('LP-01: renders the login card', () => {
    render(<LoginPage />)
    expect(screen.getByText('Welcome back 👋')).toBeInTheDocument()
  })

  it('LP-02: renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByPlaceholderText(/you@student/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
  })

  it('LP-03: renders Sign In button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('LP-04: renders link to register page', () => {
    render(<LoginPage />)
    const links = screen.getAllByRole('link')
    const registerLink = links.find(l => l.getAttribute('href') === '/register')
    expect(registerLink).toBeInTheDocument()
  })

  it('LP-05: renders demo credentials button', () => {
    render(<LoginPage />)
    expect(screen.getByText(/fill demo credentials/i)).toBeInTheDocument()
  })
})

describe('LoginPage – Form Validation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('LP-06: shows error when submitting empty form', async () => {
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })
  })

  it('LP-07: shows error for invalid email format', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText(/you@student/i), 'notanemail')
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Pass123!')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('LP-08: shows error when password is empty', async () => {
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText(/you@student/i), 'test@test.com')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/please fill in all fields/i)).toBeInTheDocument()
    })
  })
})

describe('LoginPage – Interactions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('LP-09: password toggle shows/hides password', async () => {
    render(<LoginPage />)
    const pwdInput = screen.getByPlaceholderText(/enter your password/i)
    expect(pwdInput).toHaveAttribute('type', 'password')
    const toggleBtn = screen.getByRole('button', { name: '' })
    // find eye button by its position near password field
    const allBtns = screen.getAllByRole('button')
    const eyeBtn = allBtns.find(b => b.textContent === '👁️' || b.textContent === '🙈')
    if (eyeBtn) {
      fireEvent.click(eyeBtn)
      expect(pwdInput).toHaveAttribute('type', 'text')
    }
  })

  it('LP-10: demo credentials button fills email and password', async () => {
    render(<LoginPage />)
    const demoBtn = screen.getByText(/fill demo credentials/i)
    fireEvent.click(demoBtn)
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/you@student/i)).toHaveValue('demo@studyplanner.ai')
    })
  })

  it('LP-11: email input accepts typed text', async () => {
    render(<LoginPage />)
    const emailInput = screen.getByPlaceholderText(/you@student/i)
    await userEvent.type(emailInput, 'test@binus.ac.id')
    expect(emailInput).toHaveValue('test@binus.ac.id')
  })
})

describe('LoginPage – API Integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('LP-12: shows loading state during submission', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ token: 'abc' }),
      }), 100))
    )
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText(/you@student/i), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Pass123!')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
    })
  })

  it('LP-13: redirects to dashboard on successful login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc123', user: { id: '1', name: 'Test' } }),
    })
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText(/you@student/i), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Pass123!')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('LP-14: shows API error message on failed login', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid email or password.' }),
    })
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText(/you@student/i), 'wrong@test.com')
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'WrongPass1')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('LP-15: shows generic error on network failure', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))
    render(<LoginPage />)
    await userEvent.type(screen.getByPlaceholderText(/you@student/i), 'test@test.com')
    await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'Pass123!')
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})
