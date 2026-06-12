interface StatusBadgeProps {
  status: string
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; dot?: string; pulse?: boolean }> = {
  active:    { bg: 'bg-exia-green/10', text: 'text-exia-green',   border: 'border-exia-green/25',  dot: 'bg-exia-green',   pulse: true },
  online:    { bg: 'bg-exia-green/10', text: 'text-exia-green',   border: 'border-exia-green/25',  dot: 'bg-exia-green',   pulse: true },
  inactive:  { bg: 'bg-exia-red/10',   text: 'text-exia-red',     border: 'border-exia-red/25',    dot: 'bg-exia-red' },
  offline:   { bg: 'bg-exia-red/10',   text: 'text-exia-red',     border: 'border-exia-red/25',    dot: 'bg-exia-red' },
  completed: { bg: 'bg-exia-green/10', text: 'text-exia-green',   border: 'border-exia-green/25',  dot: 'bg-exia-green' },
  success:   { bg: 'bg-exia-green/10', text: 'text-exia-green',   border: 'border-exia-green/25',  dot: 'bg-exia-green' },
  running:   { bg: 'bg-exia-cyan/10',  text: 'text-exia-cyan',    border: 'border-exia-cyan/25',   dot: 'bg-exia-cyan',    pulse: true },
  pending:   { bg: 'bg-exia-amber/10', text: 'text-exia-amber',   border: 'border-exia-amber/25',  dot: 'bg-exia-amber' },
  failed:    { bg: 'bg-exia-red/10',   text: 'text-exia-red',     border: 'border-exia-red/25',    dot: 'bg-exia-red' },
  rollback:  { bg: 'bg-exia-red/10',   text: 'text-exia-red',     border: 'border-exia-red/25',    dot: 'bg-exia-red' },
}

const DEFAULT_CONFIG = {
  bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/25', dot: 'bg-slate-500'
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const key = status.toLowerCase()
  const cfg = STATUS_CONFIG[key] ?? DEFAULT_CONFIG

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`relative flex h-1.5 w-1.5 rounded-full ${cfg.dot}`}>
        {cfg.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-50 animate-ping`} />
        )}
      </span>
      {status}
    </span>
  )
}
