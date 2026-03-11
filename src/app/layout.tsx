import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kira Flow – Smart Productivity Tracker',
  description: 'AI-powered study companion and productivity tracker for students',
  keywords: ['kira flow', 'productivity', 'AI', 'task management', 'student'],
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
