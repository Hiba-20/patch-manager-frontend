import { useState, useEffect } from 'react'
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, X, RotateCcw, Clock, RefreshCw, Server, AlertTriangle } from 'lucide-react'
import { useActiveDeployments, type DeployStatus } from '../../hooks/useActiveDeployments'

const STATUS_CONFIG: Record<DeployStatus, { icon: typeof Loader2; color: string; label: string }> = {
  pending:    { icon: Clock,     color: 'text-exia-text-muted', label: 'Pending' },
  deploying:  { icon: Loader2,   color: 'text-exia-cyan',      label: 'Deploying...' },
  success:    { icon: CheckCircle2, color: 'text-exia-green',  label: 'Success' },
  failed:     { icon: XCircle,   color: 'text-exia-red',       label: 'Failed' },
  rebooting:  { icon: RotateCcw, color: 'text-exia-amber',     label: 'Rebooting...' },
}

function elapsed(startedAt: Date, finishedAt?: Date): string {
  const diff = ((finishedAt ?? new Date()).getTime() - startedAt.getTime()) / 1000
  if (diff < 60) return `${Math.round(diff)}s`
  const m = Math.floor(diff / 60)
  const s = Math.round(diff % 60)
  return `${m}m ${s}s`
}

export function ActiveDeploymentsPanel() {
  const { groups, totalActive, clearCompleted } = useActiveDeployments()
  const [minimized, setMinimized] = useState(false)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (totalActive === 0 && groups.length === 0) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [totalActive, groups.length])

  if (groups.length === 0) return null

  const totalTasks = groups.reduce((s, g) => s + g.tasks.length, 0)
  const completedTasks = groups.reduce((s, g) => s + g.tasks.filter((t) => t.status === 'success' || t.status === 'failed').length, 0)
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const hasActive = totalActive > 0

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-exia-border/50 bg-exia-card px-4 py-2.5 shadow-card-lg hover:border-exia-cyan/30 transition-colors"
      >
        {hasActive ? (
          <Loader2 size={14} className="animate-spin text-exia-cyan" />
        ) : (
          <CheckCircle2 size={14} className="text-exia-green" />
        )}
        <span className="text-xs font-semibold text-white">{totalTasks} deployment{totalTasks !== 1 ? 's' : ''}</span>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-exia-cyan/10 px-1.5 text-[10px] font-bold text-exia-cyan">
          {totalActive || completedTasks}
        </span>
      </button>
    )
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[60vh] rounded-xl border border-exia-border/40 bg-exia-card shadow-card-lg flex flex-col overflow-hidden animate-slide-up"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/20 to-transparent" />

      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-exia-border/20">
        <div className="flex items-center gap-2">
          {hasActive ? (
            <Loader2 size={14} className="animate-spin text-exia-cyan" />
          ) : (
            <CheckCircle2 size={14} className="text-exia-green" />
          )}
          <span className="text-xs font-semibold text-white">Active Deployments</span>
          <span className="rounded-full bg-exia-cyan/10 px-1.5 py-0.5 text-[10px] font-bold text-exia-cyan">
            {totalTasks}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!hasActive && completedTasks > 0 && (
            <button
              onClick={clearCompleted}
              className="flex h-6 w-6 items-center justify-center rounded text-exia-text-muted hover:text-exia-text-secondary hover:bg-white/[0.05] transition-colors"
              title="Clear completed"
            >
              <X size={12} />
            </button>
          )}
          <button
            onClick={() => setMinimized(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-exia-text-muted hover:text-exia-text-secondary hover:bg-white/[0.05] transition-colors"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {totalTasks > 1 && (
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-exia-text-muted">
              {completedTasks} / {totalTasks} completed
            </span>
            <span className="text-[10px] font-mono text-exia-text-muted">{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-exia-bg overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-exia-cyan to-exia-green transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {groups.map((group) => (
          <div key={group.kbId} className="rounded-lg border border-exia-border/30 bg-exia-elevated p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={11} className="text-exia-amber flex-shrink-0" />
              <span className="font-mono text-[11px] font-semibold text-white">{group.kbId}</span>
              <span className="text-[10px] text-exia-text-secondary truncate flex-1">{group.title}</span>
            </div>
            <div className="space-y-1.5">
              {group.tasks.map((task) => {
                const cfg = STATUS_CONFIG[task.status]
                const Icon = cfg.icon
                return (
                  <div key={task.id} className="flex items-center gap-2">
                    <Icon
                      size={11}
                      className={`flex-shrink-0 ${cfg.color} ${task.status === 'deploying' ? 'animate-spin' : ''}`}
                    />
                    <span className="text-[11px] text-exia-text-secondary flex-1">{task.hostname}</span>
                    <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[9px] text-exia-text-muted font-mono">
                      {elapsed(task.startedAt, task.finishedAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!hasActive && completedTasks > 0 && (
        <div className="px-4 py-2 border-t border-exia-border/20">
          <p className="text-[10px] text-exia-green text-center">
            <CheckCircle2 size={10} className="inline mr-1" />
            All deployments completed
          </p>
        </div>
      )}
    </div>
  )
}
