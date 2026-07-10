'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Utensils, Users, FileText, Receipt, Truck,
  Package, Wallet, CreditCard, DollarSign, UserCheck, MessageSquare,
  BarChart3, Settings, File, BookOpen, X, CakeSlice,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/menu', label: 'Menú', icon: Utensils },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/facturacion', label: 'Facturación', icon: FileText },
  { href: '/recibos', label: 'Recibos', icon: Receipt },
  { href: '/entregas', label: 'Entregas', icon: Truck },
  { href: '/inventario', label: 'Inventario', icon: Package },
  { href: '/gastos', label: 'Gastos', icon: Wallet },
  { href: '/creditos', label: 'Créditos', icon: CreditCard },
  { href: '/cuentas-por-cobrar', label: 'CxC', icon: DollarSign },
  { href: '/crm', label: 'CRM', icon: UserCheck },
  { href: '/comunicaciones', label: 'Comunicaciones', icon: MessageSquare },
  { href: '/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/documentos', label: 'Documentos', icon: File },
  { href: '/aprendizaje', label: 'Aprendizaje', icon: BookOpen },
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

interface NavMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function NavMenu({ isOpen, onClose }: NavMenuProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const visibleItems = user?.role === 'admin'
    ? navItems
    : navItems.filter(item => user?.permissions?.includes(item.href))

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 max-w-[85vw] bg-gray-900 transform transition-transform duration-200 ease-in-out overflow-y-auto',
        'lg:translate-x-0 lg:static lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-yellow-500 flex items-center justify-center">
              <CakeSlice className="h-5 w-5 text-red-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Doña Nina</h2>
              <p className="text-[10px] text-gray-400">Sistema de Gestión</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
