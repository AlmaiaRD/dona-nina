'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { NavMenu } from '@/components/layout/NavMenu'
import { FloatingActionButton } from '@/components/layout/FloatingActionButton'
import { Footer } from '@/components/layout/Footer'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [user, loading, router, pathname])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center">
        <div className="text-center">
          <div className="h-10 w-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[#9C8A82] text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#FCFAF7]">
      <NavMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
        <Footer />
      </div>
      <FloatingActionButton />
    </div>
  )
}
