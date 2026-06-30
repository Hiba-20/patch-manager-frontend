/** Full-panel skeleton shimmer loader — replaces plain spinner */
export function LoadingSpinner() {
  return (
    <div className="animate-fade-in">
      {/* TopBar skeleton */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.05] px-8">
        <div className="h-4 w-32 rounded-lg shimmer-bg" />
        <div className="flex gap-3">
          <div className="h-8 w-36 rounded-lg shimmer-bg" />
          <div className="h-8 w-8 rounded-lg shimmer-bg" />
          <div className="h-8 w-8 rounded-lg shimmer-bg" />
        </div>
      </div>

      <div className="space-y-6 p-8">
        {/* Stats cards row */}
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-exia-card p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="h-11 w-11 rounded-xl shimmer-bg" />
                <div className="h-4 w-12 rounded-full shimmer-bg" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-20 rounded shimmer-bg" />
                <div className="h-8 w-14 rounded shimmer-bg" />
              </div>
            </div>
          ))}
        </div>

        {/* Chart cards */}
        <div className="grid grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-exia-card p-6 space-y-4">
              <div className="h-3 w-24 rounded shimmer-bg" />
              <div className="flex items-center justify-center">
                <div className="h-56 w-56 rounded-full shimmer-bg opacity-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
