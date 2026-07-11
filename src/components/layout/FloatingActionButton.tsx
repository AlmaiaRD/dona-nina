'use client'

import { useState } from 'react'
import { Plus, FileText, Users, Utensils, Truck, ReceiptText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const actions = [
  { href: '/facturacion?nueva=true', label: 'Nueva Factura', icon: FileText, color: 'bg-[#7C1D2E] hover:bg-[#5C1420]' },
  { href: '/recibos?nuevo=true', label: 'Nuevo Recibo', icon: ReceiptText, color: 'bg-yellow-600 hover:bg-yellow-700' },
  { href: '/clientes?action=new', label: 'Nuevo Cliente', icon: Users, color: 'bg-[#7C1D2E] hover:bg-[#5C1420]' },
  { href: '/menu?action=new', label: 'Nuevo Producto', icon: Utensils, color: 'bg-yellow-600 hover:bg-yellow-700' },
  { href: '/entregas?action=new', label: 'Control de Entregas', icon: Truck, color: 'bg-yellow-600 hover:bg-yellow-700' },
]

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {isOpen && (
        <div className="flex flex-col-reverse items-end gap-2 mb-2">
          {actions.map((action) => {
            const Icon = action.icon
            return (
          <button
            key={action.href}
            onClick={() => {
              setIsOpen(false)
              router.push(action.href)
            }}
            aria-label={action.label}
            className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-full text-white shadow-lg transition-all duration-200 text-sm font-medium',
                  action.color
                )}
              >
                <span className="whitespace-nowrap">{action.label}</span>
                <Icon className="h-4 w-4 shrink-0" />
              </button>
            )
          })}
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={isOpen}
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full text-white shadow-xl transition-transform duration-200',
          isOpen ? 'bg-red-700 rotate-45' : 'bg-[#7C1D2E] hover:bg-[#5C1420]'
        )}
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  )
}
