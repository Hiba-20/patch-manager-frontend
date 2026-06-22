import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDeployments, type DeploymentResponse } from '../api/patches'
import { TopBar } from '../components/layout/TopBar'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { ArrowLeft, Server, Shield, Clock, PlayCircle, CheckCircle2, XCircle, Loader2, AlertTriangle, User } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-exia-amber/10 text-exia-amber border-exia-amber/25',
  APPROVED: 'bg-exia-cyan/10 text-exia-cyan border-exia-cyan/25',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  SUCCESS: 'bg-exia-green/10 text-exia-green border-exia-green/25',
  FAILED: 'bg-exia-red/10 text-exia-red border-exia-red/25',
  REJECTED: 'bg-exia-red/10 text-exia-red border-exia-red/25',
  CANCELLED: 'bg-exia-text-muted/10 text-exia-text-muted border-exia-text-muted/25',
}

export function DeploymentDetailPage() {
  const { deploymentId } = useParams<{ deploymentId: string }>()
  const navigate = useNavigate()
  const [dep, setDep] = useState<DeploymentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!deploymentId) return
    setLoading(true)
    setError(null)
    getDeployments()
      .then((all) => {
        const found = all.find((d) => d.id === deploymentId)
        if (!found) throw new Error('Deployment not found')
        setDep(found)
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load deployment'))
      .finally(() => setLoading(false))
  }, [deploymentId])

  if (loading) {
    return (
      <>
        <TopBar title="Loading..." breadcrumb="Deployments" />
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-exia-cyan" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <TopBar title="Error" breadcrumb="Deployments" />
        <div className="p-8"><ErrorAlert message={error} /></div>
      </>
    )
  }

  if (!dep) return null

  const statusColor = STATUS_COLORS[dep.status] ?? STATUS_COLORS.PENDING

  const timeline = [
    { label: 'Created', time: dep.scheduled_at, icon: Clock },
    { label: 'Started', time: dep.started_at, icon: PlayCircle },
    { label: 'Finished', time: dep.finished_at, icon: dep.status === 'SUCCESS' ? CheckCircle2 : dep.status === 'FAILED' ? XCircle : Clock },
  ]

  return (
    <>
      <TopBar title={dep.patch_name} subtitle={dep.status} breadcrumb="Deployments" />

      <div className="space-y-6 p-8 animate-slide-up">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/deployments')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/40 bg-exia-card text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{dep.patch_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor}`}>
                {dep.status === 'FAILED' && <AlertTriangle size={10} />}
                {dep.status === 'SUCCESS' && <CheckCircle2 size={10} />}
                {dep.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="depth-card rounded-xl p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/20 to-transparent rounded-t-xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary mb-4">Details</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-exia-text-muted">
                  <Shield size={12} />
                  Patch
                </div>
                <span className="text-sm font-medium text-white">{dep.patch_name}</span>
              </div>
              {dep.severity && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-exia-text-muted">
                    <AlertTriangle size={12} />
                    Severity
                  </div>
                  <span className="text-sm font-medium text-white">{dep.severity}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-exia-text-muted">
                  <Server size={12} />
                  Host
                </div>
                <button
                  onClick={() => navigate(`/hosts/${dep.host_id}`)}
                  className="text-sm font-medium text-exia-cyan hover:underline"
                >
                  {dep.hostname}
                </button>
              </div>
              {dep.approved_by && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-exia-text-muted">
                    <User size={12} />
                    Approved by
                  </div>
                  <span className="text-sm font-medium text-white">{dep.approved_by}</span>
                </div>
              )}
            </div>
          </div>

          <div className="depth-card rounded-xl p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-amber/20 to-transparent rounded-t-xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary mb-4">Timeline</p>
            <div className="space-y-0">
              {timeline.map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-3 pb-3 relative">
                    {item.time && (
                      <div className="flex flex-col items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                          i === 2 && dep.status === 'SUCCESS' ? 'border-exia-green/30 bg-exia-green/10 text-exia-green'
                          : i === 2 && dep.status === 'FAILED' ? 'border-exia-red/30 bg-exia-red/10 text-exia-red'
                          : 'border-exia-border/40 bg-exia-elevated text-exia-text-muted'
                        }`}>
                          <Icon size={12} />
                        </div>
                        {i < timeline.length - 1 && (
                          <div className="w-px flex-1 bg-exia-border/20 mt-1" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pb-3">
                      <p className="text-xs font-medium text-exia-text-secondary">{item.label}</p>
                      <p className="text-xs text-exia-text-muted mt-0.5">
                        {item.time ? new Date(item.time).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {dep.logs && (
          <div className="depth-card rounded-xl p-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-green/20 to-transparent rounded-t-xl" />
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary mb-4">Logs</p>
            <pre className="rounded-lg bg-black/40 p-4 text-[11px] text-exia-text-secondary font-mono whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto leading-relaxed">
              {dep.logs}
            </pre>
          </div>
        )}
      </div>
    </>
  )
}
