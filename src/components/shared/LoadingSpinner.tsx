export function LoadingSpinner() {
  return (
    <div className="animate-fade-in">
      <div className="flex h-14 items-center justify-between border-b border-exia-border/40 px-8">
        <div className="h-4 w-32 rounded-lg shimmer-bg" />
        <div className="flex gap-3">
          <div className="h-8 w-36 rounded-lg shimmer-bg" />
          <div className="h-8 w-8 rounded-lg shimmer-bg" />
          <div className="h-8 w-8 rounded-lg shimmer-bg" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5 p-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-exia-border/40 bg-exia-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl shimmer-bg" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 shimmer-bg rounded" />
                <div className="h-3 w-12 shimmer-bg rounded" />
              </div>
            </div>
            <div className="h-8 w-24 shimmer-bg rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6 px-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-exia-border/40 bg-exia-card p-5 space-y-4">
            <div className="h-4 w-32 shimmer-bg rounded" />
            <div className="h-[240px] shimmer-bg rounded-lg" />
            <div className="flex gap-6">
              <div className="h-3 w-20 shimmer-bg rounded" />
              <div className="h-3 w-20 shimmer-bg rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
