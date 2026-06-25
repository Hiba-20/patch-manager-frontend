import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-exia-border/30 bg-exia-card">
            <Search size={36} className="text-exia-text-muted" />
          </div>
          <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-exia-red/20 bg-exia-red/[0.08] text-xs font-bold text-exia-red">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-exia-text-primary">Page not found</h1>

        <p className="text-sm text-exia-text-muted leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Check the URL or navigate back to a known page.
        </p>

        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-5 py-2.5 text-sm font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10"
        >
          <Home size={15} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
