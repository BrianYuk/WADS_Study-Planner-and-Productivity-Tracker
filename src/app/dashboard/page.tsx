'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Logo from '@/components/Logo'


type Task = {
  id: string
  title: string
  description?: string | null
  subject?: string | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dueDate?: string | null
  estimatedMins?: number | null
  aiPriority?: number | null
  tags: string[]
}

type Notification = {
  id: string
  title: string
  message: string
  type: 'REMINDER' | 'ACHIEVEMENT' | 'AI_INSIGHT' | 'SYSTEM'
  isRead: boolean
  sentAt: string
}

const notifMeta: Record<string,{ic:string,ibg:string,cls:string}> = {
  REMINDER: {ic:'⚠️', ibg:'rgba(239,68,68,.12)', cls:'ur'},
  AI_INSIGHT: {ic:'🤖', ibg:'rgba(99,102,241,.12)', cls:'ub'},
  ACHIEVEMENT: {ic:'🔥', ibg:'rgba(245,158,11,.12)', cls:'ua'},
  SYSTEM: {ic:'📋', ibg:'rgba(99,102,241,.12)', cls:''},
}

type StudySessionItem = {
  id: string
  subject?: string | null
  startTime: string
  endTime?: string | null
  durationMins?: number | null
  focusScore?: number | null
  type: 'POMODORO' | 'DEEP_WORK' | 'REVIEW' | 'PRACTICE' | 'READING'
  task?: { title: string; subject?: string | null } | null
}

const sessionIcons: Record<string,string> = { POMODORO:'🍅', DEEP_WORK:'🧠', REVIEW:'📖', PRACTICE:'✏️', READING:'📚' }

type Page = 'dashboard'|'tasks'|'kira'|'timer'|'calendar'|'goals'|'analytics'|'notifications'|'settings'

export default function DashboardPage() {
  const router = useRouter()
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerRemain, setTimerRemain] = useState(1500)
  const [timerTotal, setTimerTotal] = useState(1500)
  const [timerMode, setTimerMode] = useState('Pomodoro')
  const [customH, setCustomH] = useState(0)
  const [customM, setCustomM] = useState(25)
  const [customS, setCustomS] = useState(0)
  const [showCustomSetup, setShowCustomSetup] = useState(false)
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notifLoading, setNotifLoading] = useState(false)
  const unreadCount = notifications.filter(n=>!n.isRead).length
  const [settingsTab, setSettingsTab] = useState('profile')
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  // ── Real API state ──────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', subject: '', priority: 'MEDIUM' as Task['priority'], dueDate: '' })
  const [taskError, setTaskError] = useState('')
  const [aiPrioritizing, setAiPrioritizing] = useState(false)
  const [userName, setUserName] = useState('Student')
  const [userEmail, setUserEmail] = useState('')
  // Kira AI Chat state
  const [chatMessages, setChatMessages] = useState<{role:'user'|'assistant',content:string}[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSubject, setChatSubject] = useState('General')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement|null>(null)
  // Goals state
  type Goal = { id:string, title:string, description?:string|null, targetDate:string, targetValue:number, currentValue:number, unit:string, type:string, status:string }
  const [goals, setGoals] = useState<Goal[]>([])
  const [newGoal, setNewGoal] = useState({ title:'', type:'WEEKLY', targetValue:'', unit:'hours', targetDate:'' })
  const [goalError, setGoalError] = useState('')
  // Sessions + Analytics state
  const [sessionStart, setSessionStart] = useState<number|null>(null)
  const [sessionSubject, setSessionSubject] = useState('')
  type DailyData = { date:string, label:string, studyMins:number, sessionCount:number, avgFocus:number }
  type SubjectData = { subject:string, totalMins:number, sessions:number }
  type Analytics = {
    tasks: { total:number, todo:number, inProgress:number, completed:number, cancelled:number }
    study: { totalMins7Days:number, sessionCount7Days:number, avgFocusScore:number }
    dailyData: DailyData[]
    subjectBreakdown: SubjectData[]
  }
  const [analytics, setAnalytics] = useState<Analytics|null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  // Today's sessions
  const [todaySessions, setTodaySessions] = useState<StudySessionItem[]>([])
  const [todayTotalMins, setTodayTotalMins] = useState(0)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  // Calendar
  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })

  const titles: Record<Page,string> = {dashboard:'Dashboard',tasks:'Tasks',kira:'Ask Kira',timer:'Study Timer',calendar:'Calendar',goals:'Goals',analytics:'Analytics',notifications:'Notifications',settings:'Settings'}
  const mainNav: {id:Page,icon:string,label:string,badge?:string}[] = [
    {id:'dashboard',icon:'🏠',label:'Dashboard'},
    {id:'tasks',icon:'✅',label:'Tasks',badge:'4'},
    {id:'kira',icon:'🤖',label:'Ask Kira'},
    {id:'timer',icon:'⏱',label:'Timer'},
    {id:'calendar',icon:'📅',label:'Calendar'},
  ]
  const moreNav: {id:Page,icon:string,label:string}[] = [
    {id:'goals',icon:'🎯',label:'Goals'},
    {id:'analytics',icon:'📊',label:'Analytics'},
    {id:'notifications',icon:'🔔',label:'Notifications'},
    {id:'settings',icon:'⚙️',label:'Settings'},
  ]

  function navTo(p: Page) { setPage(p); setSidebarOpen(false); setMoreOpen(false) }

  function formatTime(s: number) {
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60
    return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }
  const circleSize = 260
  const circleR = 118
  const circumference = 2 * Math.PI * circleR
  const dashOffset = circumference * (1 - timerRemain / timerTotal)

  function toggleTimer() {
    if (timerRunning) { if(timerRef.current) clearInterval(timerRef.current); setTimerRunning(false) }
    else {
      if (!sessionStart) setSessionStart(Date.now())
      setTimerRunning(true)
      timerRef.current = setInterval(() => {
        setTimerRemain((r:number) => {
          if (r <= 1) {
            clearInterval(timerRef.current!)
            setTimerRunning(false)
            // Auto-save session when timer completes (skip break mode)
            if (timerMode !== 'Break') saveSession(timerTotal)
            return 0
          }
          return r-1
        })
      }, 1000)
    }
  }

  // Manually finish and save the current session
  function finishSession() {
    if(timerRef.current) clearInterval(timerRef.current)
    setTimerRunning(false)
    const elapsed = timerTotal - timerRemain
    if (elapsed >= 60 && timerMode !== 'Break') {
      saveSession(elapsed)
    } else {
      showToast('Session too short to save (min 1 min)')
    }
    setTimerRemain(timerTotal)
  }
  function resetTimer() { if(timerRef.current) clearInterval(timerRef.current); setTimerRunning(false); setTimerRemain(timerTotal) }
  function setMode(name: string, secs: number) { if(timerRef.current) clearInterval(timerRef.current); setTimerRunning(false); setTimerMode(name); setTimerTotal(secs); setTimerRemain(secs); setShowCustomSetup(false) }
  useEffect(() => () => { if(timerRef.current) clearInterval(timerRef.current) }, [])

  // ── Fetch tasks from real API ─────────────────────────────────
  const fetchTasks = useCallback(async () => {
    setTasksLoading(true)
    try {
      const res = await fetch('/api/tasks')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
      } else if (res.status === 401) {
        router.push('/login')
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setTasksLoading(false)
    }
  }, [router])

  // ── Fetch user info ───────────────────────────────────────────
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data?.user?.name) setUserName(data.user.name)
        if (data?.user?.email) setUserEmail(data.user.email)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchUser()
  }, [fetchTasks, fetchUser])

  // ── Create task ───────────────────────────────────────────────
  async function createTask() {
    if (!newTask.title.trim()) { setTaskError('Title is required'); return }
    setTaskError('')
    try {
      const body: Record<string, unknown> = {
        title: newTask.title,
        priority: newTask.priority,
      }
      if (newTask.subject) body.subject = newTask.subject
      if (newTask.dueDate) body.dueDate = new Date(newTask.dueDate).toISOString()

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setNewTask({ title: '', subject: '', priority: 'MEDIUM', dueDate: '' })
        setShowAddTask(false)
        showToast('✅ Task created!')
        fetchTasks()
      } else {
        const err = await res.json()
        setTaskError(err.error || 'Failed to create task')
      }
    } catch {
      setTaskError('Network error')
    }
  }

  // ── Toggle task complete ──────────────────────────────────────
  async function toggleTask(task: Task) {
    const newStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED'
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setTasks((prev:Task[]) => prev.map((t:Task) => t.id === task.id ? { ...t, status: newStatus } : t))
        if (newStatus === 'COMPLETED') showToast('✅ Task complete!')
      }
    } catch {}
  }

  // ── Delete task ───────────────────────────────────────────────
  async function deleteTask(taskId: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        setTasks((prev:Task[]) => prev.filter((t:Task) => t.id !== taskId))
        showToast('🗑 Task deleted')
      }
    } catch {}
  }

  // ── AI Prioritize ─────────────────────────────────────────────
  async function aiPrioritize() {
    setAiPrioritizing(true)
    showToast('🤖 AI analyzing your tasks...')
    try {
      const res = await fetch('/api/ai/prioritize', { method: 'POST' })
      if (res.ok) {
        showToast('✨ Tasks re-prioritized by AI!')
        fetchTasks()
      } else {
        showToast('⚠️ AI unavailable, try again')
      }
    } catch {
      showToast('⚠️ AI unavailable')
    } finally {
      setAiPrioritizing(false)
    }
  }

  // ── Goals ─────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data.goals || [])
      }
    } catch (err) { console.error('Failed to fetch goals:', err) }
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function createGoal() {
    if (!newGoal.title.trim()) { setGoalError('Title is required'); return }
    if (!newGoal.targetValue || Number(newGoal.targetValue) <= 0) { setGoalError('Target must be a positive number'); return }
    if (!newGoal.targetDate) { setGoalError('Target date is required'); return }
    setGoalError('')
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGoal.title,
          type: newGoal.type,
          targetValue: Number(newGoal.targetValue),
          unit: newGoal.unit,
          targetDate: new Date(newGoal.targetDate).toISOString(),
        }),
      })
      if (res.ok) {
        setNewGoal({ title:'', type:'WEEKLY', targetValue:'', unit:'hours', targetDate:'' })
        setGoalFormOpen(false)
        showToast('🎯 Goal created!')
        fetchGoals()
      } else {
        const err = await res.json()
        setGoalError(err.error || 'Failed to create goal')
      }
    } catch { setGoalError('Network error') }
  }

  // ── Sessions ──────────────────────────────────────────────────
  async function saveSession(durationSecs: number) {
    const durationMins = Math.max(1, Math.round(durationSecs / 60))
    const start = sessionStart ? new Date(sessionStart) : new Date(Date.now() - durationSecs * 1000)
    try {
      const typeMap: Record<string,string> = { 'Pomodoro':'POMODORO', 'Deep Work':'DEEP_WORK', 'Break':'POMODORO' }
      const body: Record<string, unknown> = {
        startTime: start.toISOString(),
        endTime: new Date().toISOString(),
        durationMins,
        type: typeMap[timerMode] || 'POMODORO',
        focusScore: 80,
      }
      if (sessionSubject) body.subject = sessionSubject
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        showToast('✅ Session saved!')
        fetchAnalytics()
        fetchTodaySessions()
      }
    } catch (err) { console.error('Failed to save session:', err) }
    setSessionStart(null)
  }

  // ── Analytics ─────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/analytics/dashboard')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (err) { console.error('Failed to fetch analytics:', err) }
    finally { setAnalyticsLoading(false) }
  }, [])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // ── Today's sessions ───────────────────────────────────────────
  const fetchTodaySessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const start = new Date(); start.setHours(0,0,0,0)
      const end = new Date(); end.setHours(23,59,59,999)
      const res = await fetch(`/api/sessions?from=${start.toISOString()}&to=${end.toISOString()}`)
      if (res.ok) {
        const data = await res.json()
        setTodaySessions(data.sessions || [])
        setTodayTotalMins(data.totalMins || 0)
      }
    } catch (err) { console.error('Failed to fetch sessions:', err) }
    finally { setSessionsLoading(false) }
  }, [])

  useEffect(() => { fetchTodaySessions() }, [fetchTodaySessions])

  function formatClock(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  function formatMinsLabel(mins: number) {
    const h = Math.floor(mins / 60), m = mins % 60
    if (h <= 0) return `${m}m`
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  // ── Notifications ─────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) { console.error('Failed to fetch notifications:', err) }
    finally { setNotifLoading(false) }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  async function markAllNotificationsRead() {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    try { await fetch('/api/notifications', { method: 'PATCH' }) }
    catch (err) { console.error('Failed to mark notifications read:', err) }
    showToast('✓ All read')
  }

  function formatNotifTime(dateStr: string) {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // ── Kira AI Chat ──────────────────────────────────────────────
  async function sendChatMessage() {
    const question = chatInput.trim()
    if (!question || chatLoading) return

    const userMsg = { role: 'user' as const, content: question }
    const newHistory = [...chatMessages, userMsg]
    setChatMessages(newHistory)
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          subject: chatSubject,
          history: chatMessages.slice(-6),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages([...newHistory, { role: 'assistant', content: data.answer }])
      } else {
        setChatMessages([...newHistory, { role: 'assistant', content: 'Sorry, I had trouble answering. Please try again.' }])
      }
    } catch {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Network error. Please check your connection.' }])
    } finally {
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────
  const todoTasks       = tasks.filter(t => t.status === 'TODO')
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS')
  const doneTasks       = tasks.filter(t => t.status === 'COMPLETED')

  function priorityColor(p: string) {
    if (p === 'URGENT') return '#ef4444'
    if (p === 'HIGH')   return '#f59e0b'
    if (p === 'MEDIUM') return '#6366f1'
    return '#475569'
  }

  function formatDue(dateStr?: string | null) {
    if (!dateStr) return null
    const due = new Date(dateStr)
    const now = new Date()
    const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000)
    if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, urgent: true }
    if (diff === 0) return { label: 'Due today', urgent: true }
    if (diff === 1) return { label: 'Due tomorrow', urgent: true }
    return { label: `${diff} days`, urgent: false }
  }

  // ── Calendar ──────────────────────────────────────────────────
  function prevMonth() { setCalendarMonth(d => { const nd = new Date(d); nd.setMonth(nd.getMonth()-1); return nd }) }
  function nextMonth() { setCalendarMonth(d => { const nd = new Date(d); nd.setMonth(nd.getMonth()+1); return nd }) }

  const calendarDays = (() => {
    const year = calendarMonth.getFullYear()
    const month = calendarMonth.getMonth()
    const startOffset = (new Date(year, month, 1).getDay() + 6) % 7
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7
    return Array.from({ length: totalCells }, (_, i) => new Date(year, month, 1 - startOffset + i))
  })()

  const calEvents: Record<string,{t:string,c:string}[]> = {}
  tasks.forEach(t => {
    if (!t.dueDate) return
    const key = new Date(t.dueDate).toDateString()
    if (!calEvents[key]) calEvents[key] = []
    calEvents[key].push({ t: t.title, c: priorityColor(t.priority) })
  })

  const heatLvls = ['#ffffff09','#f59e0b28','#f59e0b55','#f59e0b88','#f59e0b']
  const heatData = (() => {
    const levels = (analytics?.dailyData || []).map(d => {
      if (d.studyMins <= 0) return 0
      if (d.studyMins < 30) return 1
      if (d.studyMins < 60) return 2
      if (d.studyMins < 120) return 3
      return 4
    })
    return [...Array(Math.max(0, 28 - levels.length)).fill(0), ...levels]
  })()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{--bg:#090b12;--sur:#111420;--sur2:#161927;--bdr:rgba(255,255,255,.08);--bdr2:rgba(255,255,255,.12);--amb:#f59e0b;--adim:rgba(245,158,11,.12);--grn:#10b981;--red:#ef4444;--blu:#6366f1;--pur:#8b5cf6;--tx:#f1f5f9;--tx2:#94a3b8;--mut:#475569;--r:14px;--sb:228px;--tb:56px;--bn:60px;}
        body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;height:100vh;overflow:hidden;-webkit-tap-highlight-color:transparent;}
        .app{display:flex;flex-direction:column;height:100vh;height:100dvh;}
        .app-inner{display:flex;flex:1;overflow:hidden;}
        /* Sidebar */
        .sidebar{width:var(--sb);flex-shrink:0;background:var(--sur);border-right:1px solid var(--bdr);display:flex;flex-direction:column;height:100%;overflow:hidden;transition:transform .28s cubic-bezier(.16,1,.3,1);z-index:200;}
        .sb-logo{display:flex;align-items:center;gap:10px;padding:14px 13px 12px;border-bottom:1px solid var(--bdr);flex-shrink:0;}
        .sb-nav{flex:1;overflow-y:auto;padding:8px 6px;}
        .sb-sec{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);padding:9px 10px 4px;}
        .sb-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;transition:all .15s;color:var(--mut);font-weight:500;font-size:13px;position:relative;user-select:none;margin-bottom:1px;border:none;background:none;width:100%;text-align:left;font-family:inherit;}
        .sb-item:hover{background:rgba(255,255,255,.05);color:var(--tx2);}
        .sb-item.active{background:var(--adim);color:var(--amb);font-weight:600;}
        .sb-item.active::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:3px;background:var(--amb);border-radius:0 3px 3px 0;}
        .sb-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0;}
        .sb-badge{margin-left:auto;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .sb-badge-red{background:var(--red);color:#fff;}
        .sb-badge-amb{background:var(--amb);color:#000;}
        .sb-user{padding:11px 10px;border-top:1px solid var(--bdr);display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0;border:none;background:none;width:100%;font-family:inherit;}
        .sb-user:hover{background:rgba(255,255,255,.04);}
        .av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#000;flex-shrink:0;}
        .sb-uname{font-size:13px;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-urole{font-size:11px;color:var(--mut);}
        .online-dot{width:7px;height:7px;border-radius:50%;background:var(--grn);flex-shrink:0;}
        /* Overlay */
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:199;backdrop-filter:blur(2px);}
        .overlay.show{display:block;}
        /* Topbar */
        .topbar{height:var(--tb);border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0;background:var(--sur);}
        .tb-left{display:flex;align-items:center;gap:10px;}
        .tb-title{font-size:16px;font-weight:800;letter-spacing:-0.02em;}
        .menu-btn{width:34px;height:34px;background:rgba(255,255,255,.05);border:1px solid var(--bdr2);border-radius:9px;display:none;align-items:center;justify-content:center;cursor:pointer;font-size:16px;border:1px solid var(--bdr2);}
        .tb-right{display:flex;align-items:center;gap:8px;}
        .icon-btn{position:relative;width:34px;height:34px;background:rgba(255,255,255,.05);border:1px solid var(--bdr2);border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;}
        .notif-dot{position:absolute;top:5px;right:5px;width:8px;height:8px;background:var(--red);border-radius:50%;border:2px solid var(--sur);}
        .tb-date{font-size:11px;font-weight:600;background:rgba(255,255,255,.05);border:1px solid var(--bdr2);border-radius:8px;padding:6px 11px;color:var(--tx2);}
        /* Content */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
        .content{flex:1;overflow-y:auto;padding:18px 16px 90px;}
        /* Pages */
        .dp{display:none;}
        .dp.active{display:block;animation:fadeIn .2s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        /* Cards */
        .card{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:16px;}
        .card-t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:12px;}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        /* Stat card */
        .sc{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:14px 16px;}
        .sc-l{font-size:10px;font-weight:600;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
        .sc-v{font-size:24px;font-weight:900;font-family:'DM Mono',monospace;}
        .delta{font-size:10px;margin-top:4px;display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:100px;font-weight:600;}
        .up{background:rgba(16,185,129,.12);color:var(--grn);}
        .dn{background:rgba(239,68,68,.12);color:var(--red);}
        .pt{height:5px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;}
        .pf{height:100%;border-radius:100px;transition:width .6s ease;}
        /* Badges */
        .badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;white-space:nowrap;}
        .b-cs{background:rgba(245,158,11,.12);color:var(--amb);}
        .b-math{background:rgba(99,102,241,.15);color:#a78bfa;}
        .b-eng{background:rgba(139,92,246,.15);color:#c4b5fd;}
        .b-sci{background:rgba(16,185,129,.12);color:#6ee7b7;}
        .b-urg{background:rgba(239,68,68,.15);color:#fca5a5;}
        .b-hi{background:rgba(245,158,11,.12);color:var(--amb);}
        .b-med{background:rgba(99,102,241,.12);color:#93c5fd;}
        .b-ai{background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15));color:#a78bfa;border:1px solid rgba(99,102,241,.2);}
        .b-done{background:rgba(16,185,129,.12);color:#6ee7b7;}
        /* Buttons */
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px;border-radius:9px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;transition:all .15s;white-space:nowrap;}
        .btn-amb{background:linear-gradient(135deg,var(--amb),#d97706);color:#000;}
        .btn-amb:active{opacity:.85;}
        .btn-ghost{background:rgba(255,255,255,.05);border:1px solid var(--bdr2);color:var(--tx2);}
        .btn-ghost:active{background:rgba(255,255,255,.09);}
        .btn-ai{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;}
        .btn-red{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#fca5a5;}
        /* Custom timer setup */
        .cu-unit{position:relative;display:inline-block;padding:0 3px;border-radius:6px;transition:background .15s;}
        .cu-unit:hover{background:rgba(245,158,11,.12);}
        .cu-arrow{position:absolute;left:50%;transform:translateX(-50%);opacity:0;transition:opacity .15s;background:none;border:none;color:var(--amb);cursor:pointer;font-size:14px;line-height:1;padding:2px 6px;}
        .cu-arrow.up{top:-24px;}
        .cu-arrow.down{bottom:-24px;}
        .cu-unit:hover .cu-arrow{opacity:1;}
        /* AI Banner */
        .ai-banner{background:linear-gradient(135deg,rgba(30,27,75,.9),rgba(49,46,129,.6),rgba(22,25,39,.9));border:1px solid rgba(99,102,241,.25);border-radius:var(--r);padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:14px;}
        .ai-icon{width:40px;height:40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .risk-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;margin-top:6px;background:rgba(16,185,129,.12);color:#6ee7b7;}
        /* Task items */
        .task-item{display:flex;align-items:center;gap:10px;padding:11px 13px;background:var(--sur2);border:1px solid var(--bdr);border-radius:11px;margin-bottom:7px;cursor:pointer;transition:all .15s;}
        .task-item:active{border-color:rgba(245,158,11,.25);}
        .chk{width:18px;height:18px;border-radius:5px;border:2px solid var(--bdr2);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;min-width:18px;}
        .chk.done{background:var(--grn);border-color:var(--grn);color:#fff;font-size:10px;}
        .ti-info{flex:1;min-width:0;}
        .ti-title{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ti-meta{display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap;}
        .ti-due{font-size:11px;color:var(--mut);flex-shrink:0;}
        .ti-due.urg{color:var(--red);}
        /* Bar chart */
        .bar-chart{display:flex;align-items:flex-end;gap:5px;height:80px;padding-top:6px;}
        .bw{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .bar{width:100%;border-radius:3px 3px 0 0;min-height:3px;}
        .blbl{font-size:9px;color:var(--mut);font-family:'DM Mono',monospace;}
        /* Heatmap */
        .heatmap{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
        .hm-c{aspect-ratio:1;border-radius:3px;}
        /* Toggle */
        .toggle{position:relative;width:40px;height:22px;flex-shrink:0;}
        .toggle input{opacity:0;width:0;height:0;}
        .tslider{position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:100px;cursor:pointer;transition:.25s;}
        .tslider::before{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;left:3px;top:3px;transition:.25s;}
        .toggle input:checked+.tslider{background:var(--amb);}
        .toggle input:checked+.tslider::before{transform:translateX(18px);}
        /* Goal cards */
        .goal-card{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:16px;margin-bottom:10px;cursor:pointer;}
        .goal-card:active{border-color:rgba(245,158,11,.25);}
        /* Goal form */
        .goal-form{background:var(--sur2);border:1px solid var(--bdr2);border-radius:var(--r);padding:16px;margin-bottom:16px;display:none;}
        .goal-form.open{display:block;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
        .f-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px;}
        .f-input{width:100%;background:var(--sur);border:1px solid var(--bdr2);border-radius:9px;padding:10px 12px;color:var(--tx);font-family:inherit;font-size:14px;outline:none;}
        .f-input:focus{border-color:var(--amb);}
        .f-select{width:100%;background:var(--sur);border:1px solid var(--bdr2);border-radius:9px;padding:10px 12px;color:var(--tx);font-family:inherit;font-size:14px;outline:none;cursor:pointer;}
        /* Notifications */
        .nf-bar{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:2px;}
        .nf-bar::-webkit-scrollbar{height:0;}
        .nf{padding:6px 13px;border-radius:8px;border:1px solid var(--bdr2);background:transparent;color:var(--mut);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;}
        .nf.active{background:var(--adim);border-color:rgba(245,158,11,.3);color:var(--amb);}
        .notif-item{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;background:var(--sur2);border:1px solid var(--bdr);border-radius:12px;margin-bottom:8px;cursor:pointer;position:relative;}
        .notif-item.ur{border-left:3px solid var(--red);}
        .notif-item.ub{border-left:3px solid var(--blu);}
        .notif-item.ua{border-left:3px solid var(--amb);}
        .n-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .n-title{font-size:13px;font-weight:700;margin-bottom:3px;}
        .n-desc{font-size:12px;color:var(--tx2);line-height:1.4;}
        .n-time{font-size:11px;color:var(--mut);margin-top:4px;}
        .n-dot{position:absolute;top:13px;right:13px;width:7px;height:7px;border-radius:50%;background:var(--amb);}
        /* Settings */
        .settings-layout{display:grid;grid-template-columns:185px 1fr;gap:16px;}
        .settings-nav{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:8px;height:fit-content;}
        .sn-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;color:var(--mut);transition:all .15s;margin-bottom:1px;border:none;background:none;width:100%;font-family:inherit;text-align:left;}
        .sn-item.active{background:var(--adim);color:var(--amb);font-weight:600;}
        .ss{display:none;}
        .ss.active{display:block;}
        .ss-title{font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;}
        .ss-sub{font-size:13px;color:var(--mut);margin-bottom:18px;}
        .s-card{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden;margin-bottom:14px;}
        .sr{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--bdr);}
        .sr:last-child{border-bottom:none;}
        .sr-lbl{font-size:14px;font-weight:600;margin-bottom:2px;}
        .sr-desc{font-size:12px;color:var(--mut);}
        .swatch{width:24px;height:24px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all .15s;}
        .swatch.sel{border-color:#fff;transform:scale(1.15);}
        .danger-box{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:var(--r);padding:16px;}
        /* Bottom nav */
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:calc(60px + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);background:rgba(17,20,32,.96);backdrop-filter:blur(20px);border-top:1px solid var(--bdr);z-index:200;justify-content:space-around;align-items:center;}
        .bn-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 10px;cursor:pointer;flex:1;min-width:0;position:relative;transition:all .15s;border-radius:10px;border:none;background:none;font-family:inherit;}
        .bn-item:active{background:rgba(255,255,255,.06);}
        .bn-item.active .bn-icon,.bn-item.active .bn-lbl{color:var(--amb);}
        .bn-item.active::before{content:'';position:absolute;top:0;left:25%;right:25%;height:2px;background:var(--amb);border-radius:0 0 3px 3px;}
        .bn-icon{font-size:20px;line-height:1;color:var(--mut);}
        .bn-lbl{font-size:10px;font-weight:600;color:var(--mut);white-space:nowrap;}
        .bn-badge{position:absolute;top:4px;right:calc(50% - 16px);background:var(--red);color:#fff;font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);}
        /* More menu */
        .more-menu{position:fixed;bottom:calc(60px + env(safe-area-inset-bottom,0px) + 8px);left:50%;transform:translateX(-50%);background:var(--sur);border:1px solid var(--bdr2);border-radius:16px;padding:8px;min-width:200px;z-index:300;box-shadow:0 20px 60px rgba(0,0,0,.7);display:none;}
        .more-menu.show{display:block;}
        .mm-overlay{display:none;position:fixed;inset:0;z-index:299;}
        .mm-overlay.show{display:block;}
        .mm-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;color:var(--mut);transition:all .15s;border:none;background:none;width:100%;font-family:inherit;text-align:left;}
        .mm-item:active{background:rgba(255,255,255,.06);color:var(--tx);}
        .mm-item.active{background:var(--adim);color:var(--amb);}
        /* Toast */
        #toast{position:fixed;bottom:calc(68px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%) translateY(80px);background:var(--sur2);border:1px solid var(--bdr2);border-radius:12px;padding:11px 18px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,.5);opacity:0;transition:all .3s cubic-bezier(.16,1,.3,1);z-index:9999;white-space:nowrap;max-width:calc(100vw - 32px);}
        #toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
        /* Responsive */
        @media(max-width:640px){
          .sidebar{position:fixed;left:0;top:0;bottom:0;height:100vh;transform:translateX(-100%);z-index:200;}
          .sidebar.open{transform:translateX(0);}
          .menu-btn{display:flex!important;}
          .bottom-nav{display:flex;}
          .content{padding:14px 14px calc(70px + env(safe-area-inset-bottom,0px));}
          .g2,.g3{grid-template-columns:1fr;}
          .g4{grid-template-columns:1fr 1fr;}
          .settings-layout{grid-template-columns:1fr;}
          .settings-nav{display:flex;gap:4px;overflow-x:auto;padding:6px;border-radius:10px;}
          .sn-item{flex-direction:column;gap:3px;font-size:10px;padding:7px 9px;text-align:center;flex-shrink:0;border-radius:8px;}
          .tb-date{display:none;}
          .form-grid{grid-template-columns:1fr;}
        }
        @media(max-width:380px){.g4{grid-template-columns:1fr 1fr;}.sc-v{font-size:20px;}}
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}
        *::-webkit-scrollbar{width:3px;}
        *::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:100px;}
      `}</style>

      {/* Overlays */}
      <div className={`overlay${sidebarOpen?' show':''}`} onClick={()=>setSidebarOpen(false)}/>
      <div className={`mm-overlay${moreOpen?' show':''}`} onClick={()=>setMoreOpen(false)}/>

      {/* More menu */}
      <div className={`more-menu${moreOpen?' show':''}`}>
        {moreNav.map(item=>(
          <button key={item.id} className={`mm-item${page===item.id?' active':''}`} onClick={()=>navTo(item.id)}>
            <span style={{fontSize:18}}>{item.icon}</span>{item.label}
            {item.id==='notifications'&&unreadCount>0 && <span style={{marginLeft:'auto',background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:100}}>{unreadCount}</span>}
          </button>
        ))}
        <div style={{height:1,background:'var(--bdr)',margin:'6px 0'}}/>
        <button className="mm-item" style={{color:'var(--red)'}} onClick={()=>router.push('/')}>
          <span style={{fontSize:18}}>↩</span>Logout
        </button>
      </div>

      <div className="app">
        <div className="app-inner">
          {/* Sidebar */}
          <aside className={`sidebar${sidebarOpen?' open':''}`}>
            <div className="sb-logo">
              <Logo href="/dashboard" iconSize={28} textClassName="text-sm" subtitle="AI · v1.0" />
            </div>
            <nav className="sb-nav">
              <div className="sb-sec">Main</div>
              {[...mainNav,...moreNav].map(item=>(
                <button key={item.id} className={`sb-item${page===item.id?' active':''}`} onClick={()=>navTo(item.id)}>
                  <span className="sb-icon">{item.icon}</span>{item.label}
                  {item.id==='tasks'&&todoTasks.length>0&&<span className="sb-badge sb-badge-amb">{todoTasks.length}</span>}
                  {item.id==='notifications'&&unreadCount>0&&<span className="sb-badge sb-badge-red">{unreadCount}</span>}
                </button>
              ))}
            </nav>
            <button className="sb-user" onClick={()=>navTo('settings')}>
              <div className="av">{userName.charAt(0).toUpperCase()}</div>
              <div style={{flex:1,minWidth:0}}><div className="sb-uname">{userName}</div><div className="sb-urole">Student · BINUS</div></div>
              <div className="online-dot"/>
            </button>
          </aside>

          <div className="main">
            <div className="topbar">
              <div className="tb-left">
                <button className="menu-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
                <div className="tb-title">{titles[page]}</div>
              </div>
              <div className="tb-right">
                <div className="tb-date">Thu 26 Feb 2026</div>
                <button className="icon-btn" onClick={()=>navTo('notifications')}>🔔{unreadCount>0&&<div className="notif-dot"/>}</button>
                <button className="icon-btn" onClick={()=>navTo('settings')}><div className="av" style={{width:26,height:26,fontSize:11}}>A</div></button>
                <button className="btn btn-ghost" style={{fontSize:11,color:'var(--red)',padding:'6px 10px'}} onClick={()=>router.push('/')}>↩</button>
              </div>
            </div>

            <div className="content">

              {/* ── DASHBOARD ── */}
              <div className={`dp${page==='dashboard'?' active':''}`}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                  <div><div style={{fontSize:12,color:'var(--mut)',marginBottom:2}}>Good morning ☀️</div><div style={{fontSize:20,fontWeight:900,letterSpacing:'-0.02em'}}>Welcome back, {userName.split(' ')[0]}</div></div>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>navTo('timer')}>⏱ Start Session</button><button className="btn btn-amb" style={{fontSize:12}} onClick={()=>navTo('tasks')}>+ New Task</button></div>
                </div>
                <div className="ai-banner">
                  <div className="ai-icon">🤖</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,marginBottom:2}}>Meet Kira, your AI study companion</div><div style={{fontSize:12,color:'var(--tx2)'}}>Ask study questions, get AI task prioritization, and optimize your schedule. {tasks.filter(t=>t.status!=='COMPLETED').length} active task{tasks.filter(t=>t.status!=='COMPLETED').length===1?'':'s'} right now.</div></div>
                  <div style={{flexShrink:0}}><button className="btn btn-amb" style={{fontSize:12}} onClick={()=>navTo('kira')}>Ask Kira →</button></div>
                </div>
                <div className="g4" style={{marginBottom:14}}>
                  {[{l:'⏱ This Week',v:analytics?`${(analytics.study.totalMins7Days/60).toFixed(1)}h`:'0h',c:'var(--amb)',d:`${analytics?.study.sessionCount7Days||0} sessions`,cl:''},{l:'✅ Done',v:`${doneTasks.length}`,c:'var(--grn)',d:`of ${tasks.length}`,cl:''},{l:'📋 To Do',v:`${todoTasks.length}`,c:'#f97316',d:'pending',cl:''},{l:'🎯 Focus',v:analytics?`${analytics.study.avgFocusScore}`:'0',c:'var(--tx)',d:'avg score',cl:''}].map(s=>(
                    <div key={s.l} className="sc"><div className="sc-l">{s.l}</div><div className="sc-v" style={{color:s.c}}>{s.v}</div>{s.d&&<span className={`delta ${s.cl}`}>{s.d}</span>}{s.l.includes('Goal')&&<div className="pt" style={{marginTop:7}}><div className="pf" style={{width:'68%',background:'linear-gradient(90deg,#6366f1,#f59e0b)'}}/></div>}</div>
                  ))}
                </div>
                <div className="g2">
                  <div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><div style={{fontSize:13,fontWeight:700}}>🤖 AI-Prioritized Tasks</div><button className="btn btn-ai" style={{padding:'5px 10px',fontSize:11}} onClick={()=>showToast('🤖 AI re-ranking tasks...')}>✨ Re-rank</button></div>
                    {(() => {
                      const pending = [...tasks].filter(t=>t.status==='TODO'||t.status==='IN_PROGRESS').sort((a,b)=>(b.aiPriority||0)-(a.aiPriority||0)).slice(0,3)
                      if (pending.length === 0) return <div style={{fontSize:12,color:'var(--mut)',textAlign:'center',padding:'20px 0'}}>No tasks yet</div>
                      return pending.map(t=>{
                        const due = formatDue(t.dueDate)
                        return (
                          <div key={t.id} className="task-item" onClick={()=>navTo('tasks')}>
                            <div className={`chk${t.status==='COMPLETED'?' done':''}`} onClick={e=>{e.stopPropagation();toggleTask(t)}}>{t.status==='COMPLETED'?'✓':''}</div>
                            <div className="ti-info"><div className="ti-title">{t.title}</div><div className="ti-meta">{t.subject && <span className="badge b-cs">{t.subject}</span>}<span className="badge" style={{background:'rgba(255,255,255,.06)',color:priorityColor(t.priority)}}>{t.priority}</span></div></div>
                            {due && <div className={`ti-due${due.urgent?' urg':''}`}>{due.label}</div>}
                          </div>
                        )
                      })
                    })()}
                    <button className="btn btn-ghost" style={{width:'100%',marginTop:8}} onClick={()=>navTo('tasks')}>View all tasks →</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div className="card"><div className="card-t">📈 Study Hours – This Week</div><div className="bar-chart">{(() => {
                      const daily = analytics?.dailyData || []
                      const maxMins = Math.max(60, ...daily.map((d:DailyData)=>d.studyMins))
                      return daily.map((b:DailyData,i:number)=>{
                        const pct = Math.round((b.studyMins/maxMins)*100)
                        const isWeekend = b.label==='Sat'||b.label==='Sun'
                        return <div key={i} className="bw"><div className="bar" style={{height:`${Math.max(4,pct)}%`,background:`linear-gradient(180deg,${isWeekend?'rgba(255,255,255,.12)':'var(--amb)'},${isWeekend?'rgba(255,255,255,.08)':'var(--amb)'}aa)`}} title={`${(b.studyMins/60).toFixed(1)}h`}/><div className="blbl">{b.label[0]}</div></div>
                      })
                    })()}</div></div>
                    <div className="card">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><div className="card-t" style={{margin:0}}>🎯 Goals</div><button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:11}} onClick={()=>navTo('goals')}>All</button></div>
                      {goals.length===0 && <div style={{fontSize:12,color:'var(--mut)',textAlign:'center',padding:'12px 0'}}>No active goals yet</div>}
                      {goals.slice(0,3).map(g=>{
                        const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                        return (
                          <div key={g.id} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{fontWeight:600}}>{g.title}</span><span style={{fontFamily:"'DM Mono',monospace",color:pct>=100?'var(--grn)':'var(--amb)'}}>{pct}%</span></div><div className="pt"><div className="pf" style={{width:`${pct}%`,background:pct>=100?'var(--grn)':'linear-gradient(90deg,#6366f1,#f59e0b)'}}/></div></div>
                        )
                      })}
                    </div>
                    <div className="card"><div className="card-t">🔥 Activity</div><div className="heatmap">{heatData.map((v,i)=><div key={i} className="hm-c" style={{background:heatLvls[v]}}/>)}</div></div>
                  </div>
                </div>
              </div>

              {/* ── TASKS ── */}
             <div className={`dp${page==='tasks'?' active':''}`}>
                <div className="pg-hdr">
                  <div className="pg-title">✅ Tasks</div>
                  <div style={{display:'flex',gap:8}}>
                    <button className="btn btn-ai" style={{fontSize:12}} onClick={aiPrioritize} disabled={aiPrioritizing}>
                      {aiPrioritizing ? '⏳ Analyzing...' : '🤖 AI Prioritize'}
                    </button>
                    <button className="btn btn-amb" style={{fontSize:12}} onClick={()=>setShowAddTask(v=>!v)}>+ Task</button>
                  </div>
                </div>

                {showAddTask && (
                  <div style={{background:'var(--sur)',border:'1px solid var(--bdr)',borderRadius:'var(--r)',padding:16,marginBottom:12}}>
                    <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>New Task</div>
                    {taskError && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#fca5a5',marginBottom:10}}>{taskError}</div>}
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      <input placeholder="Task title *" value={newTask.title} onChange={e=>setNewTask(v=>({...v,title:e.target.value}))}
                        style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none',width:'100%'}}/>
                      <div style={{display:'flex',gap:8}}>
                        <input placeholder="Subject (optional)" value={newTask.subject} onChange={e=>setNewTask(v=>({...v,subject:e.target.value}))}
                          style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none',flex:1}}/>
                        <select value={newTask.priority} onChange={e=>setNewTask(v=>({...v,priority:e.target.value as Task['priority']}))}
                          style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none'}}>
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                      <input type="datetime-local" value={newTask.dueDate} onChange={e=>setNewTask(v=>({...v,dueDate:e.target.value}))}
                        style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:8,padding:'9px 12px',color:'var(--tx)',fontSize:13,outline:'none',width:'100%'}}/>
                      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                        <button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{setShowAddTask(false);setTaskError('')}}>Cancel</button>
                        <button className="btn btn-amb" style={{fontSize:12}} onClick={createTask}>Create Task</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pg-body">
                  {tasksLoading ? (
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,color:'var(--tx2)',fontSize:13}}>Loading tasks...</div>
                  ) : tasks.length === 0 ? (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,color:'var(--tx2)',gap:12}}>
                      <div style={{fontSize:32}}>📋</div>
                      <div style={{fontSize:13}}>No tasks yet</div>
                      <button className="btn btn-amb" style={{fontSize:12}} onClick={()=>setShowAddTask(true)}>+ Create your first task</button>
                    </div>
                  ) : (
                    [{title:'TODO',color:'var(--mut)',items:todoTasks},{title:'IN PROGRESS',color:'var(--amb)',items:inProgressTasks},{title:'DONE',color:'var(--grn)',items:doneTasks}].map(col=>(
                      <div key={col.title} style={{background:'var(--sur)',border:'1px solid var(--bdr)',borderRadius:'var(--r)',padding:14,flex:1,minWidth:220}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                          <span style={{fontSize:11,fontWeight:700,color:col.color,letterSpacing:'.05em'}}>{col.title}</span>
                          <span style={{fontSize:11,fontWeight:700,background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:100,padding:'2px 8px'}}>{col.items.length}</span>
                        </div>
                        {col.items.length === 0 && <div style={{fontSize:12,color:'var(--mut)',textAlign:'center',padding:'20px 0'}}>Empty</div>}
                        {col.items.map(t=>{
                          const due = formatDue(t.dueDate)
                          return (
                            <div key={t.id} className="task-item" style={{background:'var(--bg)',...(t.status==='COMPLETED'?{opacity:.55}:{})}}>
                              <div className={`chk${t.status==='COMPLETED'?' done':''}`} onClick={()=>toggleTask(t)}>{t.status==='COMPLETED'?'✓':''}</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.title}</div>
                                <div style={{display:'flex',gap:4,marginTop:3,flexWrap:'wrap',alignItems:'center'}}>
                                  {t.subject && <span style={{fontSize:11,background:'var(--sur2)',border:'1px solid var(--bdr)',borderRadius:4,padding:'1px 6px'}}>{t.subject}</span>}
                                  <span style={{fontSize:11,fontWeight:700,color:priorityColor(t.priority)}}>{t.priority}</span>
                                  {due && <span style={{fontSize:11,color:due.urgent?'var(--red)':'var(--mut)'}}>{due.label}</span>}
                                </div>
                              </div>
                              <button onClick={()=>deleteTask(t.id)} style={{background:'none',border:'none',color:'var(--mut)',cursor:'pointer',fontSize:14,padding:'2px 4px',opacity:.5}} title="Delete">✕</button>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── TIMER ── */}
              {/* ── ASK KIRA (AI CHAT) ── */}
              <div className={`dp${page==='kira'?' active':''}`}>
                <div className="pg-hdr">
                  <div className="pg-title">🤖 Ask Kira</div>
                  <select value={chatSubject} onChange={e=>setChatSubject(e.target.value)}
                    style={{background:'var(--sur)',border:'1px solid var(--bdr)',borderRadius:8,padding:'7px 12px',color:'var(--tx)',fontSize:13,outline:'none'}}>
                    <option value="General">General</option>
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="Programming">Programming</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                  </select>
                </div>

                <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 200px)',background:'var(--sur)',border:'1px solid var(--bdr)',borderRadius:'var(--r)',overflow:'hidden'}}>
                  {/* Messages area */}
                  <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:14}}>
                    {chatMessages.length === 0 ? (
                      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--tx2)',gap:14,textAlign:'center'}}>
                        <div style={{fontSize:48}}>🤖</div>
                        <div style={{fontSize:18,fontWeight:700,color:'var(--tx)'}}>Hi, I'm Kira!</div>
                        <div style={{fontSize:13,maxWidth:340}}>Your AI study companion. Ask me anything about your subjects — I'll explain concepts step by step.</div>
                        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',marginTop:8}}>
                          {['Explain recursion','What is photosynthesis?','Help me understand derivatives'].map(s=>(
                            <button key={s} onClick={()=>setChatInput(s)}
                              style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:100,padding:'8px 14px',color:'var(--tx2)',fontSize:12,cursor:'pointer'}}>{s}</button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((m,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                          <div style={{
                            maxWidth:'75%',
                            background:m.role==='user'?'linear-gradient(135deg,#f59e0b,#d97706)':'var(--bg)',
                            color:m.role==='user'?'#000':'var(--tx)',
                            border:m.role==='user'?'none':'1px solid var(--bdr)',
                            borderRadius:14,
                            padding:'11px 15px',
                            fontSize:14,
                            lineHeight:1.6,
                            whiteSpace:'pre-wrap',
                          }}>
                            {m.role==='assistant' && <div style={{fontSize:11,fontWeight:700,color:'var(--amb)',marginBottom:4}}>🤖 KIRA</div>}
                            {m.content}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div style={{display:'flex',justifyContent:'flex-start'}}>
                        <div style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:14,padding:'11px 15px',fontSize:14,color:'var(--tx2)'}}>
                          <span style={{fontSize:11,fontWeight:700,color:'var(--amb)'}}>🤖 KIRA</span><br/>Thinking...
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef}/>
                  </div>

                  {/* Input area */}
                  <div style={{borderTop:'1px solid var(--bdr)',padding:14,display:'flex',gap:10,background:'var(--sur)'}}>
                    <input
                      value={chatInput}
                      onChange={e=>setChatInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChatMessage()}}}
                      placeholder="Ask Kira a study question..."
                      disabled={chatLoading}
                      style={{flex:1,background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:11,padding:'12px 15px',color:'var(--tx)',fontSize:14,outline:'none'}}
                    />
                    <button onClick={sendChatMessage} disabled={chatLoading||!chatInput.trim()}
                      style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',border:'none',borderRadius:11,padding:'0 20px',color:'#000',fontSize:14,fontWeight:700,cursor:chatLoading?'not-allowed':'pointer',opacity:chatLoading||!chatInput.trim()?.5:1}}>
                      Send
                    </button>
                  </div>
                </div>
              </div>

              <div className={`dp${page==='timer'?' active':''}`}>
                <div className="g2" style={{alignItems:'start'}}>
                  <div className="card" style={{textAlign:'center',padding:'24px 18px'}}>
                    <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:18,flexWrap:'wrap',alignItems:'center'}}>
                      {[{n:'Pomodoro',s:1500},{n:'Deep Work',s:3000},{n:'Break',s:300}].map(m=>(
                        <button key={m.n} className={`btn ${timerMode===m.n?'btn-amb':'btn-ghost'}`} style={{fontSize:12}} onClick={()=>setMode(m.n,m.s)}>{m.n==='Pomodoro'?'🍅':m.n==='Deep Work'?'🧠':'☕'} {m.n}</button>
                      ))}
                      <button className={`btn ${timerMode==='Custom'||showCustomSetup?'btn-amb':'btn-ghost'}`} style={{fontSize:12}} onClick={()=>setShowCustomSetup(v=>!v)}>⚙ Set Custom</button>
                    </div>
                    <div style={{position:'relative',width:circleSize,height:circleSize,margin:'0 auto 18px'}}>
                      <svg style={{transform:'rotate(-90deg)'}} width={circleSize} height={circleSize} viewBox={`0 0 ${circleSize} ${circleSize}`}>
                        <circle fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" cx={circleSize/2} cy={circleSize/2} r={circleR}/>
                        <circle fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} cx={circleSize/2} cy={circleSize/2} r={circleR} style={{strokeDashoffset:showCustomSetup?0:dashOffset,transition:'stroke-dashoffset 1s linear'}}/>
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        {showCustomSetup ? (<>
                          <div style={{display:'flex',alignItems:'center',fontFamily:"'DM Mono',monospace",fontSize:38,fontWeight:700,color:'var(--amb)'}}>
                            {[{label:'Hours',val:customH,set:setCustomH,max:99},{label:'Minutes',val:customM,set:setCustomM,max:59},{label:'Seconds',val:customS,set:setCustomS,max:59}].map((u,i)=>(
                              <span key={u.label} style={{display:'flex',alignItems:'center'}}>
                                {i>0 && <span>:</span>}
                                <span className="cu-unit">
                                  <button className="cu-arrow up" onClick={()=>u.set((v:number)=>v>=u.max?0:v+1)}>▲</button>
                                  {String(u.val).padStart(2,'0')}
                                  <button className="cu-arrow down" onClick={()=>u.set((v:number)=>v<=0?u.max:v-1)}>▼</button>
                                </span>
                              </span>
                            ))}
                          </div>
                          <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:2}}>Custom</div>
                        </>) : (<>
                          <div style={{fontFamily:"'DM Mono',monospace",fontSize:38,fontWeight:700,color:'var(--amb)'}}>{formatTime(timerRemain)}</div>
                          <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:2}}>{timerMode}</div>
                        </>)}
                      </div>
                    </div>
                    <input className="f-input" placeholder="What are you studying? (optional)" value={sessionSubject} onChange={e=>setSessionSubject(e.target.value)} style={{maxWidth:260,marginBottom:14,margin:'0 auto 14px',display:'block'}}/>
                    <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                      {showCustomSetup ? (
                        <button className="btn btn-amb" style={{padding:'11px 28px',fontSize:15}} onClick={()=>setMode('Custom', Math.max(1, customH*3600+customM*60+customS))}>▶ Start Custom Timer</button>
                      ) : (<>
                        <button className="btn btn-ghost" onClick={resetTimer}>↺ Reset</button>
                        <button className="btn btn-amb" style={{padding:'11px 28px',fontSize:15}} onClick={toggleTimer}>{timerRunning?'⏸ Pause':'▶ Start'}</button>
                        <button className="btn btn-ghost" onClick={finishSession}>✓ Finish</button>
                      </>)}
                    </div>
                    <div style={{marginTop:12,fontSize:11,color:'var(--mut)'}}>🔥 {todaySessions.length} session{todaySessions.length===1?'':'s'} done today</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div className="card">
                      <div className="card-t">📅 Today&apos;s Sessions</div>
                      {sessionsLoading ? (
                        <div style={{padding:'20px 0',textAlign:'center',color:'var(--mut)',fontSize:13}}>Loading...</div>
                      ) : todaySessions.length === 0 ? (
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:120,color:'var(--tx2)',gap:8}}>
                          <div style={{fontSize:28}}>⏱️</div>
                          <div style={{fontSize:13}}>No sessions yet today</div>
                        </div>
                      ) : (<>
                        {todaySessions.map(s=>(
                          <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--bdr)'}}>
                            <div style={{width:32,height:32,borderRadius:8,background:'rgba(245,158,11,.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{sessionIcons[s.type]||'⏱️'}</div>
                            <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{s.task?.title || s.subject || 'Study Session'}</div><div style={{fontSize:11,color:'var(--mut)'}}>{formatClock(s.startTime)}{s.endTime?` – ${formatClock(s.endTime)}`:''}</div></div>
                            <div style={{textAlign:'right'}}><div style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:'var(--amb)',fontSize:13}}>{s.durationMins||0}min</div><div style={{fontSize:11,color:'var(--grn)'}}>{s.focusScore!=null?`Focus: ${s.focusScore}/10`:''}</div></div>
                          </div>
                        ))}
                        <div style={{paddingTop:10,borderTop:'1px solid var(--bdr)',display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--mut)'}}>Total today:</span><span style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:'var(--amb)'}}>{formatMinsLabel(todayTotalMins)}</span></div>
                      </>)}
                    </div>
                    <div className="card">
                      <div className="card-t">⚙ Settings</div>
                      {[{l:'Auto-start next',on:true},{l:'Sound alerts',on:true},{l:'Long break after 4',on:false}].map(s=>(
                        <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
                          <span style={{fontSize:13,fontWeight:500}}>{s.l}</span>
                          <label className="toggle"><input type="checkbox" defaultChecked={s.on}/><span className="tslider"/></label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CALENDAR ── */}
              <div className={`dp${page==='calendar'?' active':''}`}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}><button className="btn btn-ghost" style={{padding:'7px 12px'}} onClick={prevMonth}>←</button><div style={{fontSize:15,fontWeight:800}}>{calendarMonth.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div><button className="btn btn-ghost" style={{padding:'7px 12px'}} onClick={nextMonth}>→</button></div>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-ai" style={{fontSize:12}} onClick={()=>showToast('🤖 Generating schedule...')}>🤖 AI Plan</button><button className="btn btn-amb" style={{fontSize:12}}>+ Event</button></div>
                </div>
                <div className="card" style={{padding:0,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--bdr)'}}>
                    {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} style={{padding:'10px 4px',textAlign:'center',fontSize:10,fontWeight:700,color:'var(--mut)'}}>{d}</div>)}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                    {calendarDays.map((date,i)=>{
                      const isToday = date.toDateString() === new Date().toDateString()
                      const inMonth = date.getMonth() === calendarMonth.getMonth()
                      const events = calEvents[date.toDateString()] || []
                      return (
                        <div key={i} style={{minHeight:80,padding:'8px 6px',borderRight:'1px solid rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.05)',background:isToday?'rgba(245,158,11,.05)':'',opacity:inMonth?1:0.35}}>
                          <div style={{fontSize:12,fontWeight:isToday?800:600,color:isToday?'var(--amb)':'var(--tx)',marginBottom:4}}>{date.getDate()}</div>
                          {events.slice(0,3).map((ev,j)=><div key={j} style={{background:`${ev.c}22`,borderLeft:`2px solid ${ev.c}`,borderRadius:3,padding:'2px 4px',fontSize:9,marginBottom:2,color:ev.c,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.t}</div>)}
                          {events.length>3 && <div style={{fontSize:9,color:'var(--mut)',marginTop:2}}>+{events.length-3} more</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* ── GOALS ── */}
              <div className={`dp${page==='goals'?' active':''}`}>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}><button className="btn btn-amb" onClick={()=>setGoalFormOpen(!goalFormOpen)}>+ New Goal</button></div>
                <div className={`goal-form${goalFormOpen?' open':''}`}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Create New Goal</div>
                  {goalError && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'#fca5a5',marginBottom:12}}>{goalError}</div>}
                  <div className="form-grid">
                    <div><label className="f-label">Goal Title</label><input className="f-input" placeholder="e.g. Study 20 hours" value={newGoal.title} onChange={e=>setNewGoal(v=>({...v,title:e.target.value}))}/></div>
                    <div><label className="f-label">Type</label><select className="f-select" value={newGoal.type} onChange={e=>setNewGoal(v=>({...v,type:e.target.value}))}><option value="WEEKLY">Weekly</option><option value="DAILY">Daily</option><option value="MONTHLY">Monthly</option><option value="SEMESTER">Semester</option></select></div>
                    <div><label className="f-label">Target</label><input className="f-input" type="number" placeholder="20" value={newGoal.targetValue} onChange={e=>setNewGoal(v=>({...v,targetValue:e.target.value}))}/></div>
                    <div><label className="f-label">Unit</label><select className="f-select" value={newGoal.unit} onChange={e=>setNewGoal(v=>({...v,unit:e.target.value}))}><option value="hours">hours</option><option value="tasks">tasks</option><option value="days">days</option></select></div>
                  </div>
                  <label className="f-label">Target Date</label><input className="f-input" type="date" style={{marginBottom:12}} value={newGoal.targetDate} onChange={e=>setNewGoal(v=>({...v,targetDate:e.target.value}))}/>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-amb" onClick={createGoal}>Save</button><button className="btn btn-ghost" onClick={()=>{setGoalFormOpen(false);setGoalError('')}}>Cancel</button></div>
                </div>
                <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--mut)',marginBottom:10}}>Active Goals</div>
                {goals.length === 0 ? (
                  <div style={{textAlign:'center',padding:'40px 0',color:'var(--tx2)'}}>
                    <div style={{fontSize:32,marginBottom:8}}>🎯</div>
                    <div style={{fontSize:13}}>No goals yet. Create one to start tracking!</div>
                  </div>
                ) : goals.map(g=>{
                  const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
                  return (
                    <div key={g.id} className="goal-card">
                      <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                        <div><div style={{fontSize:14,fontWeight:700}}>🎯 {g.title}</div><div style={{fontSize:11,color:'var(--mut)'}}>{g.type.charAt(0)+g.type.slice(1).toLowerCase()} · Due {new Date(g.targetDate).toLocaleDateString()}</div></div>
                        <div style={{fontSize:20,fontWeight:900,fontFamily:"'DM Mono',monospace",color:'var(--amb)'}}>{pct}%</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <div style={{flex:1,height:7,background:'rgba(255,255,255,.06)',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#6366f1,#f59e0b)',borderRadius:100}}/></div>
                        <div style={{fontSize:11,color:'var(--mut)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>{g.currentValue}/{g.targetValue}{g.unit==='hours'?'h':''}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── ANALYTICS ── */}
              <div className={`dp${page==='analytics'?' active':''}`}>
                <div className="g4" style={{marginBottom:14}}>
                  {[
                    {l:'Study',v:analytics?`${(analytics.study.totalMins7Days/60).toFixed(1)}h`:'0h',c:'var(--amb)',d:'last 7 days'},
                    {l:'Done',v:analytics?`${analytics.tasks.completed}`:'0',c:'var(--grn)',d:'tasks completed'},
                    {l:'Focus',v:analytics?`${analytics.study.avgFocusScore}`:'0',c:'var(--tx)',d:'avg score'},
                    {l:'Sessions',v:analytics?`${analytics.study.sessionCount7Days}`:'0',c:'var(--tx)',d:'this week'},
                  ].map(s=>(
                    <div key={s.l} className="sc"><div className="sc-l">{s.l}</div><div className="sc-v" style={{color:s.c}}>{s.v}</div><span className="delta">{s.d}</span></div>
                  ))}
                </div>
                <div className="g2" style={{marginBottom:12}}>
                  <div className="card"><div className="card-t">📊 Daily Hours (last 7 days)</div><div className="bar-chart">{(() => {
                    const daily = analytics?.dailyData || []
                    const maxMins = Math.max(60, ...daily.map((d:DailyData)=>d.studyMins))
                    return daily.map((b:DailyData,i:number)=>{
                      const pct = Math.round((b.studyMins/maxMins)*100)
                      const isWeekend = b.label==='Sat'||b.label==='Sun'
                      return <div key={i} className="bw"><div className="bar" style={{height:`${Math.max(4,pct)}%`,background:`linear-gradient(180deg,${isWeekend?'rgba(255,255,255,.12)':'var(--amb)'},${isWeekend?'rgba(255,255,255,.08)':'var(--amb)'}aa)`}} title={`${(b.studyMins/60).toFixed(1)}h`}/><div className="blbl">{b.label[0]}</div></div>
                    })
                  })()}</div></div>
                  <div className="card"><div className="card-t">🎯 Subjects (last 30 days)</div>{(() => {
                    const subs = analytics?.subjectBreakdown || []
                    if (subs.length === 0) return <div style={{fontSize:12,color:'var(--mut)',textAlign:'center',padding:'30px 0'}}>No study sessions yet</div>
                    const maxMins = Math.max(1, ...subs.map((s:SubjectData)=>s.totalMins))
                    const colors = ['var(--amb)','var(--blu)','var(--grn)','var(--pur)','#f97316']
                    return subs.slice(0,5).map((s:SubjectData,i:number)=><div key={i} style={{marginBottom:9}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}><span>{s.subject}</span><span style={{fontFamily:"'DM Mono',monospace"}}>{(s.totalMins/60).toFixed(1)}h</span></div><div className="pt" style={{height:5}}><div className="pf" style={{width:`${Math.round((s.totalMins/maxMins)*100)}%`,background:colors[i%colors.length]}}/></div></div>)
                  })()}</div>
                </div>
                <div className="card"><div className="card-t">🤖 AI Features</div><div style={{display:'flex',flexDirection:'column',gap:8}}>{[{t:'📋 Task Prioritization',desc:'AI ranks your tasks by urgency, importance, and effort using Groq Llama 3.3.'},{t:'🤖 Ask Kira (Study Q&A)',desc:'Chat with Kira to get step-by-step explanations for any study topic.'},{t:'🗓 Schedule Optimization',desc:'AI generates an optimized study plan from your tasks and available time.'}].map(a=><div key={a.t} style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:10,padding:'11px 13px'}}><div style={{fontWeight:600,fontSize:13,marginBottom:5}}>{a.t}</div><p style={{fontSize:12,color:'var(--tx2)'}}>{a.desc}</p></div>)}</div></div>
              </div>

              {/* ── NOTIFICATIONS ── */}
              <div className={`dp${page==='notifications'?' active':''}`}>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}><button className="btn btn-ghost" style={{fontSize:12}} onClick={markAllNotificationsRead} disabled={unreadCount===0}>✓ Mark all read</button></div>
                <div className="nf-bar">
                  {['All','Unread','🤖 AI','🔔 Reminders','🏆 Wins'].map(f=><button key={f} className={`nf${f==='All'?' active':''}`} onClick={e=>{document.querySelectorAll('.nf').forEach(b=>b.classList.remove('active'));(e.currentTarget as HTMLElement).classList.add('active')}}>{f}</button>)}
                </div>
                {notifLoading ? (
                  <div style={{fontSize:12,color:'var(--mut)',textAlign:'center',padding:'30px 0'}}>Loading...</div>
                ) : notifications.length === 0 ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:200,color:'var(--tx2)',gap:12}}>
                    <div style={{fontSize:32}}>🔔</div>
                    <div style={{fontSize:13}}>No notifications yet</div>
                  </div>
                ) : notifications.map(n=>{
                  const meta = notifMeta[n.type] || notifMeta.SYSTEM
                  return (
                    <div key={n.id} className={`notif-item${meta.cls?' '+meta.cls:''}`} style={n.isRead?{opacity:.65}:{}}>
                      <div className="n-icon" style={{background:meta.ibg}}>{meta.ic}</div>
                      <div style={{flex:1}}><div className="n-title">{n.title}</div><div className="n-desc">{n.message}</div><div className="n-time">{formatNotifTime(n.sentAt)}</div></div>
                      {!n.isRead && <div className="n-dot" style={meta.cls==='ub'?{background:'var(--blu)'}:{}}/>}
                    </div>
                  )
                })}
              </div>

              {/* ── SETTINGS ── */}
              <div className={`dp${page==='settings'?' active':''}`}>
                <div className="settings-layout">
                  <div className="settings-nav">
                    {[{id:'profile',ic:'👤',l:'Profile'},{id:'prefs',ic:'🎨',l:'Prefs'},{id:'notif',ic:'🔔',l:'Notifs'},{id:'security',ic:'🔒',l:'Security'},{id:'danger',ic:'⚠️',l:'Danger'}].map(t=>(
                      <button key={t.id} className={`sn-item${settingsTab===t.id?' active':''}`} style={t.id==='danger'?{color:'var(--red)'}:{}} onClick={()=>setSettingsTab(t.id)}>
                        <span>{t.ic}</span><span className="sn-lbl">{t.l}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    {settingsTab==='profile'&&<div className="ss active"><div className="ss-title">Profile</div><div className="ss-sub">Manage your information</div><div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}><div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#000'}}>{userName.charAt(0).toUpperCase()}</div><div><div style={{fontSize:17,fontWeight:800}}>{userName}</div><div style={{fontSize:12,color:'var(--mut)'}}>{userEmail||'—'}</div></div></div><div className="s-card">{[{l:'Full Name',v:userName},{l:'Email',v:userEmail||'—'},{l:'Institution',v:'BINUS University'},{l:'Timezone',v:'Asia/Jakarta (UTC+7)'}].map(r=><div key={r.l} className="sr"><div><div className="sr-lbl">{r.l}</div><div className="sr-desc">{r.v}</div></div></div>)}</div></div>}
                    {settingsTab==='prefs'&&<div className="ss active"><div className="ss-title">Preferences</div><div className="ss-sub">Customize your experience</div><div className="s-card"><div className="sr"><div><div className="sr-lbl">Daily Goal</div><div className="sr-desc">Target hours/day</div></div><select className="f-select" style={{width:110}}><option>2h</option><option selected>4h</option><option>6h</option><option>8h</option></select></div><div className="sr"><div><div className="sr-lbl">Accent Color</div><div className="sr-desc">Dashboard theme</div></div><div style={{display:'flex',gap:7}}>{['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6'].map((c,i)=><div key={c} className={`swatch${i===0?' sel':''}`} style={{background:c}} onClick={e=>{document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('sel'));(e.currentTarget as HTMLElement).classList.add('sel');showToast('🎨 Theme updated!')}}/>)}</div></div></div></div>}
                    {settingsTab==='notif'&&<div className="ss active"><div className="ss-title">Notifications</div><div className="ss-sub">What you get notified about</div><div className="s-card">{[{l:'Task Reminders',d:'Before deadlines',on:true},{l:'AI Insights',d:'Task priority & tips',on:true},{l:'Session Prompts',d:'Study reminders',on:true},{l:'Achievements',d:'Streaks & goals',on:false}].map(r=><div key={r.l} className="sr"><div><div className="sr-lbl">{r.l}</div><div className="sr-desc">{r.d}</div></div><label className="toggle"><input type="checkbox" defaultChecked={r.on}/><span className="tslider"/></label></div>)}</div></div>}
                    {settingsTab==='security'&&<div className="ss active"><div className="ss-title">Security</div><div className="ss-sub">Account security settings</div><div className="s-card"><div className="sr"><div><div className="sr-lbl">Password</div><div className="sr-desc">Changed 30 days ago</div></div><button className="btn btn-ghost" style={{fontSize:12,padding:'6px 12px'}}>Change</button></div><div className="sr"><div><div className="sr-lbl">Two-Factor Auth</div><div className="sr-desc">Extra security</div></div><label className="toggle"><input type="checkbox"/><span className="tslider"/></label></div><div className="sr"><div><div className="sr-lbl">Active Sessions</div><div className="sr-desc">1 device signed in</div></div><button className="btn btn-ghost" style={{fontSize:12,padding:'6px 12px'}}>View</button></div></div></div>}
                    {settingsTab==='danger'&&<div className="ss active"><div className="ss-title" style={{color:'var(--red)'}}>Danger Zone</div><div className="ss-sub">Irreversible — proceed carefully</div><div className="danger-box"><div style={{fontSize:13,fontWeight:700,color:'var(--red)',marginBottom:12}}>⚠️ Irreversible Actions</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{[{t:'Clear All Data',d:'Delete sessions, tasks & analytics'},{t:'Delete Account',d:'Permanently remove all data'}].map(a=><div key={a.t} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.15)',borderRadius:10,gap:12}}><div><div style={{fontSize:13,fontWeight:600}}>{a.t}</div><div style={{fontSize:12,color:'var(--mut)'}}>{a.d}</div></div><button className="btn btn-red" style={{fontSize:12}} onClick={()=>a.t.includes('Account')?router.push('/'):showToast('⚠️ This cannot be undone!')}>Delete</button></div>)}</div></div></div>}
                  </div>
                </div>
              </div>

            </div>{/* /content */}
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          {mainNav.map(item=>(
            <button key={item.id} className={`bn-item${page===item.id?' active':''}`} onClick={()=>navTo(item.id)}>
              <div className="bn-icon">{item.icon}</div>
              <div className="bn-lbl">{item.label}</div>
              {item.badge&&<div className="bn-badge">{item.badge}</div>}
            </button>
          ))}
          <button className={`bn-item${moreNav.some(m=>m.id===page)?' active':''}`} onClick={()=>setMoreOpen(!moreOpen)}>
            <div className="bn-icon">⋯</div>
            <div className="bn-lbl">More</div>
          </button>
        </nav>
      </div>

      <div id="toast"/>

      <script dangerouslySetInnerHTML={{__html:`
        function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2800);}
        let tsX=0;
        document.addEventListener('touchstart',e=>tsX=e.touches[0].clientX,{passive:true});
        document.addEventListener('touchmove',e=>{const sb=document.querySelector('.sidebar');if(sb&&sb.classList.contains('open')&&(e.touches[0].clientX-tsX)<-60){sb.classList.remove('open');document.querySelector('.overlay').classList.remove('show');}},{passive:true});
      `}}/>
    </>
  )
}

function showToast(msg: string) {
  if (typeof window === 'undefined') return
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.classList.add('show')
  clearTimeout((t as HTMLElement & {_t?:ReturnType<typeof setTimeout>})._t)
  ;(t as HTMLElement & {_t?:ReturnType<typeof setTimeout>})._t = setTimeout(() => t.classList.remove('show'), 2800)
}