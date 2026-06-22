import { useEffect, useState, useMemo, useCallback } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight, CloudLightning, Loader2, CheckCircle2, Server, Rocket } from 'lucide-react'
import { getDashboardMissingUpdates, deployPatch } from '../../api/updates'
import type { DashboardMissingUpdate } from '../../types/update'
import { useActiveDeployments } from '../../hooks/useActiveDeployments'
import { useToast } from '../shared/Toast'

interface AggregatedUpdate {
  kb_id: string
  title: string
  severity: string
  categories: string[]
  affected_hosts: { host_id: string; hostname: string; severity: string }[]
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical:  'text-exia-red border-exia-red/25 bg-exia-red/10',
  Important: 'text-exia-amber border-exia-amber/25 bg-exia-amber/10',
  Moderate:  'text-yellow-400 border-yellow-400/25 bg-yellow-400/10',
  Low:       'text-exia-green border-exia-green/25 bg-exia-green/10',
}

const SEVERITY_ORDER: Record<string, number> = { Critical: 0, Important: 1, Moderate: 2, Low: 3 }

export function AggregatedUpdatesTable() {
  const [updates, setUpdates] = useState<AggregatedUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deployTarget, setDeployTarget] = useState<AggregatedUpdate | null>(null)
  const [deployingKb, setDeployingKb] = useState<string | null>(null)
  const [deployResults, setDeployResults] = useState<Record<string, 'success' | 'failed'>>({})
  const [scheduleTime, setScheduleTime] = useState('')
  const toast = useToast()
  const { addTask, updateTask } = useActiveDeployments()

  const fetchUpdates = useCallback(() => {
    setLoading(true)
    setError(null)
    getDashboardMissingUpdates()
      .then((res) => {
        const map = new Map<string, AggregatedUpdate>()
        for (const u of res.updates) {
          if (!map.has(u.kb_id)) {
            map.set(u.kb_id, { kb_id: u.kb_id, title: u.title, severity: u.severity, categories: [], affected_hosts: [] })
          }
          map.get(u.kb_id)!.affected_hosts.push({ host_id: u.host_id, hostname: u.hostname, severity: u.severity })
        }
        const grouped = Array.from(map.values())
        grouped.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99))
        setUpdates(grouped)
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchUpdates() }, [fetchUpdates])

  const toggleExpand = (kbId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(kbId)) next.delete(kbId); else next.add(kbId)
      return next
    })
  }

  const handleDeployAll = async () => {
    if (!deployTarget) return
    const { kb_id, title, severity, affected_hosts } = deployTarget
    setDeployTarget(null)
    setDeployingKb(kb_id)

    const scheduledAt = scheduleTime ? new Date(scheduleTime).toISOString() : undefined

    for (const host of affected_hosts) {
      const taskId = addTask(host.host_id, host.hostname, kb_id, title, severity)
      updateTask(taskId, { status: scheduledAt ? 'scheduled' : 'deploying' })
      try {
        const res = await deployPatch(host.host_id, kb_id, title, severity, scheduledAt)
        updateTask(taskId, {
          status: scheduledAt ? 'scheduled' : (res.status === 'SUCCESS' ? 'success' : 'failed'),
          finishedAt: scheduledAt ? undefined : new Date(),
          message: res.details,
        })
      } catch {
        updateTask(taskId, { status: 'failed', finishedAt: new Date() })
      }
    }

    setScheduleTime('')
    setDeployingKb(null)
    setDeployResults((prev) => ({ ...prev, [kb_id]: 'success' }))
    setTimeout(() => setDeployResults((prev) => { const n = { ...prev }; delete n[kb_id]; return n }), 5000)
    toast.success(scheduledAt ? `${kb_id} scheduled for ${affected_hosts.length} host(s)` : `${kb_id} deployed to ${affected_hosts.length} host(s)`)
    fetchUpdates()
  }

  if (loading) {
    return (
      <div className="depth-card rounded-xl p-6">
        <div className="flex items-center justify-center py-8 text-exia-text-muted">
          <Loader2 size={16} className="animate-spin mr-2" />
          Checking for updates...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="depth-card rounded-xl p-6">
        <div className="rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-4 py-3">
          <p className="text-xs text-exia-red font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="depth-card rounded-xl p-6">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-amber/20 to-transparent rounded-t-xl" />
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudLightning size={15} className="text-exia-amber" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
            Missing Updates by KB
          </p>
          <span className="rounded-full border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[10px] font-semibold text-exia-text-muted">
            {updates.length}
          </span>
        </div>
        <button
          onClick={fetchUpdates}
          className="text-[10px] text-exia-text-muted hover:text-exia-cyan transition-colors underline"
        >
          Refresh
        </button>
      </div>

      {updates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
          <CheckCircle2 size={22} className="text-exia-green" />
          <p className="text-sm font-medium text-exia-text-secondary">No missing updates detected</p>
          <p className="text-[10px] text-exia-text-muted">Hosts may be unreachable or fully up to date</p>
        </div>
      ) : (
        <div className="space-y-2">
          {updates.map((u) => {
            const colorClass = SEVERITY_COLORS[u.severity] ?? SEVERITY_COLORS.Important
            const isExpanded = expanded.has(u.kb_id)
            const isDeploying = deployingKb === u.kb_id
            const done = deployResults[u.kb_id]

            return (
              <div
                key={u.kb_id}
                className="rounded-lg border border-exia-border/40 bg-exia-elevated transition-colors hover:border-exia-border/60"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => toggleExpand(u.kb_id)}
                    className="flex h-5 w-5 items-center justify-center rounded text-exia-text-muted hover:text-exia-text-secondary transition-colors flex-shrink-0"
                  >
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </button>

                  <AlertTriangle size={13} className="text-exia-amber flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-white">{u.kb_id}</span>
                      <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${colorClass}`}>
                        {u.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-exia-text-secondary truncate max-w-md mt-0.5">{u.title}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-exia-text-muted flex-shrink-0">
                    <Server size={10} />
                    <span>{u.affected_hosts.length} host{u.affected_hosts.length !== 1 ? 's' : ''}</span>
                  </div>

                  <button
                    onClick={() => setDeployTarget(u)}
                    disabled={isDeploying}
                    className="flex items-center gap-1.5 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-3 py-1.5 text-[11px] font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10 hover:border-exia-cyan/30 disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    {isDeploying ? (
                      <><Loader2 size={11} className="animate-spin" /> Deploying</>
                    ) : done ? (
                      <><CheckCircle2 size={11} /> Done</>
                    ) : (
                      <><Rocket size={11} /> Deploy to All</>
                    )}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-exia-border/20 px-4 py-2 space-y-1 bg-black/[0.15] rounded-b-lg">
                    {u.affected_hosts.map((h) => {
                      const hColor = SEVERITY_COLORS[h.severity] ?? SEVERITY_COLORS.Important
                      return (
                        <div key={h.host_id} className="flex items-center gap-2 pl-7 py-1">
                          <Server size={10} className="text-exia-text-muted flex-shrink-0" />
                          <span className="text-xs text-exia-text-secondary">{h.hostname}</span>
                          <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${hColor}`}>
                            {h.severity}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {deployTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setDeployTarget(null); setScheduleTime('') }}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-white mb-2">Deploy {deployTarget.kb_id}</h2>
            <p className="text-sm text-exia-text-secondary mb-4">
              Install on {deployTarget.affected_hosts.length} host(s):
            </p>
            <div className="mb-4 max-h-32 overflow-y-auto space-y-1">
              {deployTarget.affected_hosts.map((h) => (
                <div key={h.host_id} className="flex items-center gap-2 text-xs text-exia-text-muted">
                  <Server size={10} />
                  <span>{h.hostname}</span>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-exia-text-secondary mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
              />
              <p className="text-[10px] text-exia-text-muted mt-1">Leave empty to deploy immediately</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setDeployTarget(null); setScheduleTime('') }}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleDeployAll}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90"
              >
                {scheduleTime ? `Schedule for ${new Date(scheduleTime).toLocaleDateString()}` : `Deploy to ${deployTarget.affected_hosts.length} host(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
