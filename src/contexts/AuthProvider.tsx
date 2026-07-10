'use client'

import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const initialize = useAuth((s) => s.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return <>{children}</>
}
