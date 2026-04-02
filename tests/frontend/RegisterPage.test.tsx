/**
 * Frontend Tests: Register Page
 * Week 4 – Frontend Testing
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

global.fetch = jest.fn()

import RegisterPage from '@/app/register/page'

describe('RegisterPage – Rendering', () => {
  beforeEach(() => jest.clearAllMocks())

  it('RP-01: renders create account heading', () => {
    render(<RegisterPage />)
    expect(screen.getByText('Create your account')).toBeInTheDocument()
  })

  it('RP-02: renders all form fields', () => {
    render(<RegisterPage />)
    expect(screen.getByPlaceholderText(/aditya pratama/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@binus/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/min. 8 characters/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/repeat your password/i)).toBeInTheDocument()
  })

  it('RP-03: renders terms checkbox', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('RP-04: renders Create Account button', () => {
    render(<RegisterPage />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('RP-05: renders link to login page', () => {
    render(<RegisterPage />)
    const links = screen.getAllByRole('link')
    const loginLinks = links.filter(l => l.getAttribute('href') === '/login')
    expect(loginLinks.length).toBeGreaterThan(0)
  })
})

describe('RegisterPage – Validation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('RP-06: shows error for short name', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'A')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'test@binus.ac.id')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Pass1234!')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('RP-07: shows error for invalid email', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'Brian')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'notanemail')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Pass1234!')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    })
  })

  it('RP-08: shows error for short password', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'Brian')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'test@binus.ac.id')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Ab1')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Ab1')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
  })

  it('RP-09: shows error when passwords do not match', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'Brian')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'test@binus.ac.id')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Different1!')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    })
  })

  it('RP-10: shows error when terms not accepted', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'Brian')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'test@binus.ac.id')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Pass1234!')
    // Don't check terms
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/terms of service/i)).toBeInTheDocument()
    })
  })
})

describe('RegisterPage – Password Strength Indicator', () => {
  beforeEach(() => jest.clearAllMocks())

  it('RP-11: shows strength indicator when typing password', async () => {
    render(<RegisterPage />)
    const pwdInput = screen.getByPlaceholderText(/min. 8 characters/i)
    await userEvent.type(pwdInput, 'weak')
    await waitFor(() => {
      expect(screen.getByText(/weak/i)).toBeInTheDocument()
    })
  })

  it('RP-12: shows Good strength for valid password', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Passw0rd')
    await waitFor(() => {
      expect(screen.getByText(/good|strong/i)).toBeInTheDocument()
    })
  })

  it('RP-13: shows passwords match indicator', async () => {
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Pass1234!')
    await waitFor(() => {
      expect(screen.getByText(/passwords match/i)).toBeInTheDocument()
    })
  })
})

describe('RegisterPage – API Integration', () => {
  beforeEach(() => jest.clearAllMocks())

  it('RP-14: redirects to dashboard on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'abc', user: { id: '1' } }),
    })
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'Brian')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'brian@binus.ac.id')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Pass1234!')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('RP-15: shows API error on duplicate email', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Email already registered.' }),
    })
    render(<RegisterPage />)
    await userEvent.type(screen.getByPlaceholderText(/aditya pratama/i), 'Brian')
    await userEvent.type(screen.getByPlaceholderText(/you@binus/i), 'existing@binus.ac.id')
    await userEvent.type(screen.getByPlaceholderText(/min. 8 characters/i), 'Pass1234!')
    await userEvent.type(screen.getByPlaceholderText(/repeat your password/i), 'Pass1234!')
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/already registered/i)).toBeInTheDocument()
    })
  })
})
