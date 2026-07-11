'use client'

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

function Modal({ isOpen, onClose, title, subtitle, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-[90vw] sm:max-w-sm',
    md: 'max-w-[90vw] sm:max-w-lg',
    lg: 'max-w-[90vw] sm:max-w-2xl',
    xl: 'max-w-[90vw] sm:max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={cn(
        'relative w-full bg-white rounded-xl shadow-xl p-6 mx-4 max-h-[90vh] overflow-y-auto',
        sizes[size],
        className
      )}>
        {title && (
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E8E0D8]">
            <div>
              <h2 className="text-lg font-semibold text-[#3D2B1F]">{title}</h2>
              {subtitle && <p className="text-xs text-[#9C8A82] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-[#9C8A82] hover:bg-[#FDF8F3] hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
export { Modal }
