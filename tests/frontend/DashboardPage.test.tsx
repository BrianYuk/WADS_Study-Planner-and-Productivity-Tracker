/**
 * Frontend Tests: Dashboard Page
 * Week 4 – Frontend Testing
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

import DashboardPage from '@/app/dashboard/page'

describe('DashboardPage – Rendering', () => {
  beforeEach(() => jest.clearAllMocks())

  it('DB-01: renders the dashboard greeting', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('DB-02: renders AI burnout banner', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/ai wellness check/i)).toBeInTheDocument()
  })

  it('DB-03: renders stat cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/today/i)).toBeInTheDocument()
    expect(screen.getByText(/streak/i)).toBeInTheDocument()
  })

  it('DB-04: renders sidebar navigation', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
    expect(screen.getByText('Timer')).toBeInTheDocument()
  })

  it('DB-05: renders topbar with notification bell', () => {
    render(<DashboardPage />)
    expect(screen.getByText('🔔')).toBeInTheDocument()
  })

  it('DB-06: renders AI-Prioritized Tasks section', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/ai-prioritized tasks/i)).toBeInTheDocument()
  })

  it('DB-07: renders LOW burnout risk badge', () => {
    render(<DashboardPage />)
    expect(screen.getByText(/low burnout risk/i)).toBeInTheDocument()
  })
})

describe('DashboardPage – Navigation', () => {
  beforeEach(() => jest.clearAllMocks())

  it('DB-08: clicking Tasks nav shows tasks page', () => {
    render(<DashboardPage />)
    const tasksBtns = screen.getAllByText('Tasks')
    fireEvent.click(tasksBtns[0])
    expect(screen.getByText(/todo/i)).toBeInTheDocument()
  })

  it('DB-09: clicking Timer nav shows timer page', () => {
    render(<DashboardPage />)
    const timerBtns = screen.getAllByText('Timer')
    fireEvent.click(timerBtns[0])
    expect(screen.getByText(/pomodoro/i)).toBeInTheDocument()
  })

  it('DB-10: clicking Goals nav shows goals page', () => {
    render(<DashboardPage />)
    const goalsBtns = screen.getAllByText('Goals')
    fireEvent.click(goalsBtns[0])
    expect(screen.getByText(/active goals/i)).toBeInTheDocument()
  })

  it('DB-11: clicking Analytics nav shows analytics page', () => {
    render(<DashboardPage />)
    const analyticsBtns = screen.getAllByText('Analytics')
    fireEvent.click(analyticsBtns[0])
    expect(screen.getByText(/study hours/i)).toBeInTheDocument()
  })

  it('DB-12: clicking Notifications nav shows notifications page', () => {
    render(<DashboardPage />)
    const notifBtns = screen.getAllByText('Notifications')
    fireEvent.click(notifBtns[0])
    expect(screen.getByText(/mark all read/i)).toBeInTheDocument()
  })

  it('DB-13: clicking Settings nav shows settings page', () => {
    render(<DashboardPage />)
    const settingsBtns = screen.getAllByText('Settings')
    fireEvent.click(settingsBtns[0])
    expect(screen.getByText(/manage your information/i)).toBeInTheDocument()
  })

  it('DB-14: logout button redirects to home', () => {
    render(<DashboardPage />)
    const logoutBtns = screen.getAllByText('↩')
    fireEvent.click(logoutBtns[0])
    expect(mockPush).toHaveBeenCalledWith('/')
  })
})

describe('DashboardPage – Timer', () => {
  beforeEach(() => jest.clearAllMocks())

  it('DB-15: timer shows 25:00 by default (Pomodoro)', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Timer')[0])
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('DB-16: can switch to Deep Work mode', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Timer')[0])
    fireEvent.click(screen.getByText(/deep work/i))
    expect(screen.getByText('50:00')).toBeInTheDocument()
  })

  it('DB-17: can switch to Break mode', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Timer')[0])
    fireEvent.click(screen.getByText(/break/i))
    expect(screen.getByText('05:00')).toBeInTheDocument()
  })

  it('DB-18: Start button changes to Pause when clicked', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Timer')[0])
    const startBtn = screen.getByText(/▶ start/i)
    fireEvent.click(startBtn)
    expect(screen.getByText(/⏸ pause/i)).toBeInTheDocument()
  })

  it('DB-19: reset button resets timer', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Timer')[0])
    fireEvent.click(screen.getByText(/▶ start/i))
    fireEvent.click(screen.getByText('↺'))
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })
})

describe('DashboardPage – Tasks', () => {
  beforeEach(() => jest.clearAllMocks())

  it('DB-20: tasks page shows kanban columns', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Tasks')[0])
    expect(screen.getByText('TODO')).toBeInTheDocument()
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
    expect(screen.getByText('DONE')).toBeInTheDocument()
  })

  it('DB-21: tasks page shows task items', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Tasks')[0])
    expect(screen.getByText(/data structures/i)).toBeInTheDocument()
  })
})

describe('DashboardPage – Goals', () => {
  beforeEach(() => jest.clearAllMocks())

  it('DB-22: goals page shows progress bars', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Goals')[0])
    expect(screen.getByText(/weekly study/i)).toBeInTheDocument()
  })

  it('DB-23: new goal button opens form', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Goals')[0])
    fireEvent.click(screen.getByText(/\+ new goal/i))
    expect(screen.getByText(/create new goal/i)).toBeInTheDocument()
  })

  it('DB-24: goal form can be cancelled', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Goals')[0])
    fireEvent.click(screen.getByText(/\+ new goal/i))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText(/create new goal/i)).not.toBeVisible()
  })
})

describe('DashboardPage – Settings', () => {
  beforeEach(() => jest.clearAllMocks())

  it('DB-25: settings shows profile tab by default', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Settings')[0])
    expect(screen.getByText(/manage your information/i)).toBeInTheDocument()
  })

  it('DB-26: can switch to Notifications settings tab', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Settings')[0])
    fireEvent.click(screen.getByText('Notifs'))
    expect(screen.getByText(/task reminders/i)).toBeInTheDocument()
  })

  it('DB-27: danger zone shows delete options', () => {
    render(<DashboardPage />)
    fireEvent.click(screen.getAllByText('Settings')[0])
    fireEvent.click(screen.getByText('Danger'))
    expect(screen.getByText(/danger zone/i)).toBeInTheDocument()
    expect(screen.getByText(/delete account/i)).toBeInTheDocument()
  })
})
