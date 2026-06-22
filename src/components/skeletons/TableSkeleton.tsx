export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex h-14 items-center justify-between border-b border-exia-border/40 px-8">
        <div className="h-4 w-36 rounded bg-exia-elevated" />
        <div className="flex gap-2">
          <div className="h-8 w-48 rounded-lg bg-exia-elevated" />
        </div>
      </div>
      <div className="p-8 space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-4 w-24 rounded bg-exia-elevated" />
          <div className="h-4 w-20 rounded bg-exia-elevated" />
          <div className="h-4 w-16 rounded bg-exia-elevated" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-exia-border/10">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 rounded bg-exia-elevated"
                style={{ width: `${40 + ((i * 7 + j * 13) % 60)}%`, maxWidth: 300 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
