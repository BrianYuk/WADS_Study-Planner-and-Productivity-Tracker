import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyPlanner AI – Smart Productivity Tracker',
  description: 'AI-powered study planner and productivity tracker for students',
  keywords: ['study planner', 'productivity', 'AI', 'task management', 'student'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-sans">
        {children}
      </body>
    </html>
  )
}
