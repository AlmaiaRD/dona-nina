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
    <div className={cn('rounded-xl bg-white p-6 shadow-sm border border-[#E8E0D8]', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#9C8A82]">{title}</span>
        <div className="rounded-lg bg-[#7C1D2E]/10 p-2">
          <Icon className="h-5 w-5 text-[#7C1D2E]" />
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold text-[#3D2B1F]">{value}</span>
        {trend && (
          <span className={cn(
            'ml-2 text-sm font-medium',
            trend.positive ? 'text-green-600' : 'text-[#7C1D2E]'
          )}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[#9C8A82]">{subtitle}</p>
      )}
    </div>
  )
}
