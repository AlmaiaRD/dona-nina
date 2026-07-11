'use client'

import { cn, getStatusColor, getStatusText } from '@/lib/utils'

interface BadgeProps {
  status: string
  className?: string
}

function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        getStatusColor(status),
        className
      )}
    >
      {getStatusText(status)}
    </span>
  )
}

export default Badge
export { Badge }
