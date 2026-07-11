export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm border border-[#E8E0D8] space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/3" />
      <div className="h-8 bg-gray-200 rounded w-1/2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  )
}
