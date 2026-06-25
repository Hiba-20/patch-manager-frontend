import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDeployments, getDeploymentApprovalLog, type DeploymentResponse, type ApprovalLogEntry } from '../api/patches'
import { TopBar } from '../components/layout/TopBar'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { ArrowLeft, Server, Shield, Clock, PlayCircle, CheckCircle2, XCircle, Loader2, AlertTriangle, User, MessageSquare } from 'lucide-react'
import { timeAgo } from '../utils/relativeTime'

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
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLogEntry[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    if (!deploymentId) return
    setLoading(true)
    setError(null)
    getDeployments()
      .then((all) => {
        const found = all.find((d) => d.id === deploymentId)
        if (!found) throw new Error('Deployment not found')
        setDep(found)
        setLogsLoading(true)
        getDeploymentApprovalLog(deploymentId)
          .then(setApprovalLogs)
          .catch(() => {})
          .finally(() => setLogsLoading(false))
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
            <h2 className="text-lg font-bold text-exia-text-primary">{dep.patch_name}</h2>
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
                <span className="text-sm font-medium text-exia-text-primary">{dep.patch_name}</span>
              </div>
              {dep.severity && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-exia-text-muted">
                    <AlertTriangle size={12} />
                    Severity
                  </div>
                  <span className="text-sm font-medium text-exia-text-primary">{dep.severity}</span>
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
                  <span className="text-sm font-medium text-exia-text-primary">{dep.approved_by}</span>
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
                        {item.time ? `${timeAgo(item.time)} (${new Date(item.time).toLocaleString()})` : '\u2014'}
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary mb-4">Ansible Logs</p>
            <div className="rounded-lg bg-black/80 p-4 max-h-96 overflow-y-auto font-mono text-[11px] leading-relaxed terminal-scroll">
              {dep.logs.split('\n').map((line, i) => {
                let color = 'text-gray-400'
                if (/error|failed|fatal|critical/i.test(line)) color = 'text-red-400'
                else if (/warn|warning/i.test(line)) color = 'text-amber-400'
                else if (/ok|success|completed/i.test(line)) color = 'text-green-400'
                else if (/changed/i.test(line)) color = 'text-exia-cyan'
                else if (/skipped/i.test(line)) color = 'text-gray-500'
                else if (/^\[/i.test(line)) color = 'text-exia-cyan font-semibold'
                return (
                  <div key={i} className={`${color} whitespace-pre-wrap`}>
                    <span className="select-none text-gray-600 mr-3 w-6 inline-block text-right">{i + 1}</span>
                    {line || <span className="text-gray-600">&nbsp;</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="depth-card rounded-xl p-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-amber/20 to-transparent rounded-t-xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary mb-4">Approval History</p>
          {logsLoading ? (
            <div className="flex items-center justify-center py-6 text-exia-text-muted">
              <Loader2 size={16} className="animate-spin mr-2" />
              Loading...
            </div>
          ) : approvalLogs.length === 0 ? (
            <p className="text-xs text-exia-text-muted py-4">No approval records found.</p>
          ) : (
            <div className="space-y-3">
              {approvalLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-exia-elevated/50 border border-exia-border/20">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    log.action === 'APPROVED' ? 'bg-exia-green/10 text-exia-green' : 'bg-exia-red/10 text-exia-red'
                  }`}>
                    {log.action === 'APPROVED' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-exia-text-primary">{log.admin_name}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        log.action === 'APPROVED' ? 'bg-exia-green/10 text-exia-green' : 'bg-exia-red/10 text-exia-red'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-exia-text-muted">{timeAgo(log.created_at)}</span>
                    </div>
                    {log.comment && (
                      <div className="flex items-start gap-1.5 mt-1.5 text-xs text-exia-text-secondary">
                        <MessageSquare size={11} className="mt-0.5 shrink-0 text-exia-text-muted" />
                        <span>{log.comment}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
