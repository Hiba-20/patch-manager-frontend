import { useMemo, useState } from 'react'
import { Loader2, Server, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { DeploymentMatrixRow, DeploymentMatrixHost } from '../../types/report'

const MATRIX_COLORS: Record<string, string> = {
  SUCCESS: 'bg-green-500',
  FAILED: 'bg-red-500',
  PENDING: 'bg-amber-400',
  APPROVED: 'bg-blue-500',
  IN_PROGRESS: 'bg-cyan-400',
  REJECTED: 'bg-gray-500',
  CANCELLED: 'bg-gray-500',
  NOT_APPLICABLE: '',
}

const MATRIX_LABELS: Record<string, string> = {
  SUCCESS: 'Installed',
  FAILED: 'Failed',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  IN_PROGRESS: 'Deploying',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  NOT_APPLICABLE: 'N/A',
}

interface Props {
  patches: DeploymentMatrixRow[]
  hosts: DeploymentMatrixHost[]
  loading: boolean
}

export function DeploymentMatrixReport({ patches, hosts, loading }: Props) {
  const [showAllHosts, setShowAllHosts] = useState(false)

  const visibleHosts = useMemo(() => {
    if (showAllHosts) return hosts
    return hosts.slice(0, 15)
  }, [hosts, showAllHosts])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-exia-text-muted">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading deployment matrix...
      </div>
    )
  }

  if (patches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <Server size={24} className="text-exia-text-muted opacity-50" />
        <p className="text-sm text-exia-text-secondary">No patch deployments found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-exia-text-secondary">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-500" /> Installed</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-500" /> Failed</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-amber-400" /> Pending</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-500" /> Approved</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-cyan-400" /> Deploying</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-gray-500" /> N/A</span>
        </div>
        {hosts.length > 15 && (
          <button
            onClick={() => setShowAllHosts(v => !v)}
            className="text-xs text-exia-cyan hover:underline"
          >
            {showAllHosts ? 'Show fewer hosts' : `Show all ${hosts.length} hosts`}
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-exia-border/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-exia-border/30 bg-exia-elevated/50">
              <th className="sticky left-0 z-10 bg-exia-elevated/95 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted min-w-[160px]">
                Patch
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted min-w-[80px]">
                Severity
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted min-w-[80px]">
                Class.
              </th>
              {visibleHosts.map(h => (
                <th
                  key={h.id}
                  className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted min-w-[24px] max-w-[28px]"
                  title={`${h.hostname} (${h.os_type})`}
                >
                  <div className="truncate">{h.hostname.split('-')[0]}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patches.map(p => (
              <tr key={p.patch_id} className="border-b border-exia-border/20 hover:bg-exia-cyan/[0.02] transition-colors">
                <td className="sticky left-0 z-10 bg-card px-3 py-2 text-exia-text-primary font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[180px]" title={p.patch_name}>{p.patch_name}</span>
                    {p.classification && (
                      <span className="shrink-0 rounded border border-exia-border/40 px-1.5 py-0.5 text-[9px] text-exia-text-muted">{p.classification}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {p.severity ? (
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      p.severity === 'Critical' ? 'bg-exia-red/10 text-exia-red border-exia-red/25' :
                      p.severity === 'High' ? 'bg-exia-amber/10 text-exia-amber border-exia-amber/25' :
                      p.severity === 'Medium' ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25' :
                      p.severity === 'Low' ? 'bg-exia-green/10 text-exia-green border-exia-green/25' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/25'
                    }`}>
                      {p.severity === 'Critical' && <AlertTriangle size={9} />}
                      {p.severity}
                    </span>
                  ) : (
                    <span className="text-exia-text-muted">&mdash;</span>
                  )}
                </td>
                <td className="px-3 py-2 text-exia-text-muted whitespace-nowrap">
                  {p.classification || <span className="text-exia-text-muted">&mdash;</span>}
                </td>
                {visibleHosts.map(h => {
                  const cell = p.hosts[h.id]
                  const color = cell ? MATRIX_COLORS[cell.status] ?? '' : MATRIX_COLORS.NOT_APPLICABLE
                  const label = cell ? MATRIX_LABELS[cell.status] ?? cell.status : MATRIX_LABELS.NOT_APPLICABLE
                  const isNA = !cell || cell.status === 'NOT_APPLICABLE'
                  return (
                    <td
                      key={h.id}
                      className="px-2 py-2 text-center"
                      title={isNA ? 'Not applicable' : `${p.patch_name} on ${h.hostname}: ${label}`}
                    >
                      <div className="flex justify-center">
                        {isNA ? (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-exia-border/30" />
                        ) : (
                          <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
