'use client'

import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function PageContainer({ children, title, subtitle, action, className }: PageContainerProps) {
  return (
    <div className={cn('p-4 md:p-6 space-y-6', className)}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h1 className="text-xl font-bold text-[#3D2B1F]">{title}</h1>}
            {subtitle && <p className="text-sm text-[#9C8A82] mt-1">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
