import { Bell, ChevronRight } from 'lucide-react'

interface TopBarProps {
  title: string
  subtitle?: string
  breadcrumb?: string
}

export function TopBar({ title, subtitle, breadcrumb }: TopBarProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-white/[0.05] bg-exia-navy/60 px-8 backdrop-blur-sm">
      {/* Cyan glow line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/20 to-transparent" />

      {/* Left: breadcrumb + title */}
      <div className="flex flex-col justify-center">
        {breadcrumb && (
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-exia-text-muted">
            <span>{breadcrumb}</span>
            <ChevronRight size={10} />
            <span className="text-exia-text-secondary">{title}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold tracking-tight text-white">{title}</h1>
          {subtitle && (
            <span className="rounded-md bg-exia-cyan/10 px-2 py-0.5 text-[10px] font-medium text-exia-cyan border border-exia-cyan/20">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Right: time pill + notification bell + avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-exia-text-secondary font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-exia-green animate-pulse-slow" />
          <span>{dateStr} · {timeStr}</span>
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan">
          <Bell size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-exia-amber" />
        </button>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-exia-cyan/20 to-exia-cyan/5 border border-exia-cyan/20 text-[11px] font-bold text-exia-cyan">
          ET
        </div>
      </div>
    </header>
  )
}
