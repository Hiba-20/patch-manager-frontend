export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex h-14 items-center justify-between border-b border-exia-border/40 px-8">
        <div className="h-4 w-36 rounded bg-exia-elevated" />
        <div className="flex gap-3">
          <div className="h-8 w-32 rounded-lg bg-exia-elevated" />
          <div className="h-8 w-8 rounded-lg bg-exia-elevated" />
          <div className="h-8 w-8 rounded-lg bg-exia-elevated" />
        </div>
      </div>
      <div className="space-y-7 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-exia-border/40 bg-exia-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-exia-elevated" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 rounded bg-exia-elevated" />
                  <div className="h-3 w-12 rounded bg-exia-elevated" />
                </div>
              </div>
              <div className="h-8 w-24 rounded bg-exia-elevated" />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-24 rounded bg-exia-elevated" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-exia-border/40 bg-exia-card p-6 space-y-4">
              <div className="h-4 w-32 rounded bg-exia-elevated" />
              <div className="h-[220px] rounded-lg bg-exia-elevated" />
              <div className="flex gap-6">
                <div className="h-3 w-20 rounded bg-exia-elevated" />
                <div className="h-3 w-20 rounded bg-exia-elevated" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-exia-border/40 bg-exia-card p-6 space-y-4">
              <div className="h-4 w-36 rounded bg-exia-elevated" />
              <div className="h-[220px] rounded-lg bg-exia-elevated" />
              <div className="h-3 w-48 mx-auto rounded bg-exia-elevated" />
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-exia-border/40 bg-exia-card p-6">
          <div className="h-4 w-40 rounded bg-exia-elevated mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-exia-elevated" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
