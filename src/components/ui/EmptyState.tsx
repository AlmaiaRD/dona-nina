import { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-[#9C8A82] mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-[#3D2B1F] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#9C8A82] mb-4 max-w-sm">{description}</p>}
      {action && (
        <button onClick={action.onClick}
          className="px-4 py-2 bg-[#7C1D2E] text-white text-sm font-medium rounded-lg hover:bg-[#5C1420] transition-colors">
          {action.label}
        </button>
      )}
    </div>
  )
}
