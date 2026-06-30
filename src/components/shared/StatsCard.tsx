import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: ReactNode
  accent?: 'cyan' | 'green' | 'amber' | 'red'
  trend?: number   // optional trend % (positive = up)
  sublabel?: string
}

const ACCENT_CONFIG = {
  cyan:  {
    iconBg:   'bg-exia-cyan/10 border border-exia-cyan/20',
    iconText: 'text-exia-cyan',
    topLine:  'from-exia-cyan/60 via-exia-cyan/20 to-transparent',
    glow:     'shadow-glow-cyan',
    value:    'text-exia-cyan',
  },
  green: {
    iconBg:   'bg-exia-green/10 border border-exia-green/20',
    iconText: 'text-exia-green',
    topLine:  'from-exia-green/60 via-exia-green/20 to-transparent',
    glow:     'shadow-glow-green',
    value:    'text-exia-green',
  },
  amber: {
    iconBg:   'bg-exia-amber/10 border border-exia-amber/20',
    iconText: 'text-exia-amber',
    topLine:  'from-exia-amber/60 via-exia-amber/20 to-transparent',
    glow:     'shadow-glow-amber',
    value:    'text-exia-amber',
  },
  red:   {
    iconBg:   'bg-exia-red/10 border border-exia-red/20',
    iconText: 'text-exia-red',
    topLine:  'from-exia-red/60 via-exia-red/20 to-transparent',
    glow:     'shadow-glow-red',
    value:    'text-exia-red',
  },
}

export function StatsCard({ title, value, icon, accent = 'cyan', trend, sublabel }: StatsCardProps) {
  const cfg = ACCENT_CONFIG[accent]

  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/[0.05] bg-exia-card p-5 shadow-card transition-all duration-300 hover:border-white/[0.09] hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in">
      {/* Top accent gradient line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${cfg.topLine}`} />

      {/* Background subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-white/[0.015] to-transparent rounded-xl" />

      <div className="relative flex items-start justify-between">
        {/* Icon */}
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconText} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            trend >= 0 ? 'bg-exia-green/10 text-exia-green' : 'bg-exia-red/10 text-exia-red'
          }`}>
            <TrendingUp size={10} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-exia-text-secondary">{title}</p>
        <p className={`mt-1.5 text-3xl font-bold tabular-nums tracking-tight ${cfg.value}`}>{value}</p>
        {sublabel && (
          <p className="mt-1 text-[11px] text-exia-text-muted">{sublabel}</p>
        )}
      </div>
    </div>
  )
}
