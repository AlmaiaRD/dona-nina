'use client'

import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  icon: LucideIcon
  subtitle?: string
  className?: string
  trend?: { value: number; positive: boolean }
}

export function KpiCard({ title, value, icon: Icon, subtitle, className, trend }: KpiCardProps) {
  return (
    <div className={cn('rounded-xl bg-white p-6 shadow-sm border border-gray-100', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className="rounded-lg bg-red-50 p-2">
          <Icon className="h-5 w-5 text-red-600" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        {trend && (
          <span className={cn(
            'ml-2 text-sm font-medium',
            trend.positive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      )}
    </div>
  )
}
