'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import CakeIcon from '@/components/ui/CakeIcon'
import toast from 'react-hot-toast'

const ERROR_MESSAGES: Record<string, string> = {
  'credenciales': 'Credenciales inválidas',
  'requeridas': 'Todos los campos son requeridos',
  'servidor': 'Error del servidor',
  'expired': 'Tu sesión ha expirado. Inicia sesión nuevamente.',
}

function LoginError() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode.toLowerCase()] || errorCode) : null

  useEffect(() => {
    if (errorMessage) toast.error(errorMessage)
  }, [errorMessage])

  if (!errorMessage) return null

  return (
    <div className="mb-4 p-3 bg-[#7C1D2E]/10 border border-[#7C1D2E]/20 rounded-lg text-[#7C1D2E] text-sm text-center">
      {errorMessage}
    </div>
  )
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { signIn } = useAuth()

  function validate() {
    const e: Record<string, string> = {}
    if (!email.trim()) e.email = 'Correo requerido'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Correo inválido'
    if (!password) e.password = 'Contraseña requerida'
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting || !validate()) return
    setSubmitting(true)
    try {
      const { error } = await signIn(email, password)
      if (error) { toast.error(error); return }
      window.location.href = '/dashboard'
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Suspense fallback={null}>
        <LoginError />
      </Suspense>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Correo electrónico</label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => { const n = { ...p }; delete n.email; return n }) }}
            type="email"
            className="w-full px-4 py-2.5 border border-[#E8E0D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent"
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            inputMode="email"
            required
          />
          {errors.email && <p className="text-[#E07A3A] text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#3D2B1F] mb-1">Contraseña</label>
          <div className="relative">
            <input
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => { const n = { ...p }; delete n.password; return n }) }}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-2.5 border border-[#E8E0D8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C1D2E]/30 focus:border-transparent pr-10"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8A82] hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[#E07A3A] text-xs mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[#7C1D2E] text-white rounded-lg font-medium hover:bg-[#5C1420] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Cargando...</>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#9C8A82]">
        Solo administradores pueden crear cuentas
      </p>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FCFAF7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-[#E8E0D8]">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 rounded-full bg-[#7C1D2E]/60 items-center justify-center mb-4">
              <CakeIcon size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#3D2B1F]">Donde Doña Nina</h1>
            <p className="text-[#9C8A82] text-sm mt-1">Sistema de Gestión</p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
