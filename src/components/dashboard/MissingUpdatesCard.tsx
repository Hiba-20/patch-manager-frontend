import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, CloudLightning, Loader2, CheckCircle2, XCircle, Server } from 'lucide-react'
import { getDashboardMissingUpdates, deployPatch } from '../../api/updates'
import type { DashboardMissingUpdate, DeployPatchResponse } from '../../types/update'
import { useToast } from '../shared/Toast'

const SEVERITY_COLORS: Record<string, string> = {
  Critical:  'text-exia-red border-exia-red/25 bg-exia-red/10',
  Important: 'text-exia-amber border-exia-amber/25 bg-exia-amber/10',
  Moderate:  'text-yellow-400 border-yellow-400/25 bg-yellow-400/10',
  Low:       'text-exia-green border-exia-green/25 bg-exia-green/10',
}

export function MissingUpdatesCard() {
  const [updates, setUpdates] = useState<DashboardMissingUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [deployingKb, setDeployingKb] = useState<string | null>(null)
  const [deployStatus, setDeployStatus] = useState<{ kb_id: string; status: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const fetchUpdates = useCallback(() => {
    getDashboardMissingUpdates()
      .then((res) => setUpdates(res.updates))
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchUpdates() }, [fetchUpdates])

  const handleDeploy = async (update: DashboardMissingUpdate) => {
    setDeployingKb(update.kb_id)
    setDeployStatus(null)
    try {
      const res = await deployPatch(update.host_id, update.kb_id, update.title, update.severity)
      setDeployStatus({ kb_id: update.kb_id, status: res.status })
      setUpdates((prev) => prev.filter((u) => u.kb_id !== update.kb_id || u.host_id !== update.host_id))
      if (res.status === 'SUCCESS') {
        toast.success(`${update.kb_id} deployed to ${update.hostname}`)
      } else {
        toast.error(`${update.kb_id} deployment failed on ${update.hostname}`)
      }
    } catch {
      setDeployStatus({ kb_id: update.kb_id, status: 'FAILED' })
      toast.error(`${update.kb_id} deployment failed on ${update.hostname}`)
    } finally {
      setDeployingKb(null)
    }
  }

  return (
    <div className="depth-card rounded-xl p-5">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-red/20 to-transparent rounded-t-xl" />
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudLightning size={15} className="text-exia-amber" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">Missing Windows Updates</p>
        </div>
        <button
          onClick={fetchUpdates}
          className="text-[10px] text-exia-text-muted hover:text-exia-cyan transition-colors underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-exia-text-muted">
          <Loader2 size={16} className="animate-spin mr-2" />
          Checking for updates...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-4 py-3">
          <p className="text-xs text-exia-red font-medium">{error}</p>
        </div>
      ) : updates.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
          <CheckCircle2 size={22} className="text-exia-green" />
          <p className="text-sm font-medium text-exia-green">All Windows hosts up to date</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {updates.map((u) => {
            const colorClass = SEVERITY_COLORS[u.severity] ?? SEVERITY_COLORS.Important
            const isDeploying = deployingKb === u.kb_id
            const done = deployStatus?.kb_id === u.kb_id

            return (
              <div
                key={`${u.host_id}-${u.kb_id}`}
                className="flex items-center gap-3 rounded-lg border border-exia-border/40 bg-exia-elevated px-3 py-2.5"
              >
                <AlertTriangle size={13} className="text-exia-amber flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{u.kb_id}</p>
                  <p className="text-[10px] text-exia-text-secondary truncate">{u.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${colorClass}`}>
                      {u.severity}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-exia-text-muted">
                      <Server size={9} />
                      {u.hostname}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeploy(u)}
                  disabled={isDeploying}
                  className="flex items-center gap-1 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-3 py-1.5 text-[11px] font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10 hover:border-exia-cyan/30 disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeploying ? (
                    <><Loader2 size={11} className="animate-spin" /> Deploying</>
                  ) : done && deployStatus?.status === 'SUCCESS' ? (
                    <><CheckCircle2 size={11} /> Done</>
                  ) : done ? (
                    <><XCircle size={11} /> Failed</>
                  ) : (
                    'Deploy'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
