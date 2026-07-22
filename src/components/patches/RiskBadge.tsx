import { AlertTriangle, Shield, Cpu } from 'lucide-react'

interface RiskBadgeProps {
  riskLevel: 'Low' | 'Medium' | 'High'
  method: 'heuristic' | 'ml'
  reasons?: string[]
}

const LEVEL_CONFIG = {
  Low: { bg: 'bg-exia-green/10', text: 'text-exia-green', border: 'border-exia-green/25', icon: Shield },
  Medium: { bg: 'bg-exia-amber/10', text: 'text-exia-amber', border: 'border-exia-amber/25', icon: AlertTriangle },
  High: { bg: 'bg-exia-red/10', text: 'text-exia-red', border: 'border-exia-red/25', icon: AlertTriangle },
}

export function RiskBadge({ riskLevel, method, reasons }: RiskBadgeProps) {
  const cfg = LEVEL_CONFIG[riskLevel]
  const Icon = cfg.icon
  const isHeuristic = method === 'heuristic'

  return (
    <div className="group relative inline-flex">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors ${
          isHeuristic
            ? 'border-dashed border-exia-border/50 bg-exia-elevated/50 text-exia-text-muted'
            : `${cfg.bg} ${cfg.text} ${cfg.border}`
        }`}
      >
        <Icon size={10} />
        {riskLevel}
        <span className="opacity-60 font-normal">{isHeuristic ? '· Estimation' : '· IA'}</span>
      </span>
      {reasons && reasons.length > 0 && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="rounded-lg border border-exia-border/40 bg-exia-card p-3 shadow-xl">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-exia-text-muted">Risques identifiés</p>
            <ul className="space-y-1">
              {reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-exia-text-secondary">
                  <span className="mt-0.5 block h-1 w-1 rounded-full bg-exia-cyan flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-exia-border/40 bg-exia-card" />
        </div>
      )}
    </div>
  )
}

export function RiskBadgeSkeleton() {
  return (
    <span className="inline-flex h-5 w-20 animate-pulse rounded-full bg-exia-elevated border border-exia-border/20" />
  )
}
