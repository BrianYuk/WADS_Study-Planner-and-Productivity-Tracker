'use client'
import { SessionProvider } from 'next-auth/react'
import SoundEffects from '@/components/SoundEffects'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SoundEffects />
      {children}
    </SessionProvider>
  )
}
