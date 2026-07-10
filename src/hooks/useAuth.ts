'use client'

import { create } from 'zustand'
import type { UserProfile } from '@/types/database'

interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  permissions?: string[]
}

interface AuthState {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  updateProfile: () => Promise<void>
}

function getTokenExpiry(): number | null {
  const match = document.cookie.match(/(?:^|;\s*)dn-token=([^;]*)/)
  if (!match) return null
  try {
    const payload = JSON.parse(atob(match[1].split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

async function tryRefreshToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const expiry = getTokenExpiry()
      if (expiry) {
        const msUntilExpiry = expiry - Date.now()
        // Refresh if expiring in less than 1 day
        if (msUntilExpiry < 86400000 && msUntilExpiry > 0) {
          await tryRefreshToken()
        } else if (msUntilExpiry <= 0) {
          // Token already expired, redirect to login
          window.location.href = '/login?expired=1'
          return
        }
      }

      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user, loading: false, initialized: true })
        return
      }
    } catch (err) { console.error('[useAuth] Error:', err) }
    set({ loading: false, initialized: true })
  },

  signIn: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error || 'Error al iniciar sesión' }
      set({ user: data.user })
      return {}
    } catch (err: any) {
      return { error: err.message }
    }
  },

  signUp: async () => {
    return { error: 'Registro solo disponible desde administración' }
  },

  signOut: async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    set({ user: null, profile: null })
  },

  updateProfile: async () => {
    // Profile updates will be handled separately
  },
}))
