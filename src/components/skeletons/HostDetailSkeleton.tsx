export function HostDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex h-14 items-center justify-between border-b border-exia-border/40 px-8">
        <div className="flex items-center gap-3">
          <div className="h-4 w-12 rounded bg-exia-elevated" />
          <div className="h-4 w-1 rounded bg-exia-elevated" />
          <div className="h-4 w-32 rounded bg-exia-elevated" />
        </div>
        <div className="flex gap-3">
          <div className="h-8 w-32 rounded-lg bg-exia-elevated" />
          <div className="h-8 w-8 rounded-lg bg-exia-elevated" />
        </div>
      </div>
      <div className="space-y-8 p-8">
        <div className="h-4 w-24 rounded bg-exia-elevated" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-exia-border/40 bg-exia-card p-5 space-y-4">
              <div className="h-3 w-28 rounded bg-exia-elevated" />
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3 py-2">
                  <div className="h-7 w-7 rounded-md bg-exia-elevated" />
                  <div className="h-3 w-16 rounded bg-exia-elevated" />
                  <div className="flex-1" />
                  <div className="h-3 w-28 rounded bg-exia-elevated" />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-40 rounded bg-exia-elevated" />
            <div className="h-5 w-6 rounded-full bg-exia-elevated" />
            <div className="flex-1 h-px bg-exia-border/20" />
          </div>
          <div className="rounded-xl border border-exia-border/40 bg-exia-card p-5 space-y-3">
            <div className="flex items-center gap-4 py-2">
              <div className="h-3 w-16 rounded bg-exia-elevated" />
              <div className="h-3 w-32 rounded bg-exia-elevated" />
              <div className="h-3 w-20 rounded bg-exia-elevated" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-t border-exia-border/10">
                <div className="h-3 w-40 rounded bg-exia-elevated" />
                <div className="h-3 w-24 rounded bg-exia-elevated" />
                <div className="h-3 w-20 rounded bg-exia-elevated" />
                <div className="h-3 w-16 rounded bg-exia-elevated" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-3 w-32 rounded bg-exia-elevated" />
            <div className="h-5 w-6 rounded-full bg-exia-elevated" />
            <div className="flex-1 h-px bg-exia-border/20" />
          </div>
          <div className="rounded-xl border border-exia-border/40 bg-exia-card p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-exia-border/10 last:border-0">
                <div className="h-3 w-36 rounded bg-exia-elevated" />
                <div className="h-3 w-16 rounded bg-exia-elevated" />
                <div className="h-5 w-14 rounded-full bg-exia-elevated" />
                <div className="h-3 w-20 rounded bg-exia-elevated" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
