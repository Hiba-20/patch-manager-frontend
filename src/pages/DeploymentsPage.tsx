import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeployments, approveDeployment, rejectDeployment, cancelDeployment, retryDeployment, type DeploymentResponse } from '../api/patches'
import { TopBar } from '../components/layout/TopBar'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { useToast } from '../components/shared/Toast'
import { CheckCircle2, XCircle, Clock, Loader2, RotateCcw, X, AlertTriangle, Server, Shield } from 'lucide-react'

type Tab = 'pending' | 'scheduled' | 'history'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-exia-amber/10 text-exia-amber border-exia-amber/25',
  APPROVED: 'bg-exia-cyan/10 text-exia-cyan border-exia-cyan/25',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  SUCCESS: 'bg-exia-green/10 text-exia-green border-exia-green/25',
  FAILED: 'bg-exia-red/10 text-exia-red border-exia-red/25',
  REJECTED: 'bg-exia-red/10 text-exia-red border-exia-red/25',
  CANCELLED: 'bg-exia-text-muted/10 text-exia-text-muted border-exia-text-muted/25',
}

export function DeploymentsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [deployments, setDeployments] = useState<DeploymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDeployments()
      setDeployments(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load deployments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredDeployments = useCallback((tab: Tab): DeploymentResponse[] => {
    switch (tab) {
      case 'pending':
        return deployments.filter((d) => d.status === 'PENDING')
      case 'scheduled':
        return deployments.filter((d) => d.status === 'APPROVED')
      case 'history':
        return deployments.filter((d) => !['PENDING', 'APPROVED'].includes(d.status))
    }
  }, [deployments])

  const handleApprove = async (dep: DeploymentResponse) => {
    setActionLoading(dep.id)
    try {
      await approveDeployment(dep.id)
      toast.success(`Deployment of ${dep.patch_name} approved`)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to approve')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (dep: DeploymentResponse) => {
    setActionLoading(dep.id)
    try {
      await rejectDeployment(dep.id)
      toast.success(`Deployment of ${dep.patch_name} rejected`)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to reject')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancel = async (dep: DeploymentResponse) => {
    setActionLoading(dep.id)
    try {
      await cancelDeployment(dep.id)
      toast.success(`Deployment of ${dep.patch_name} cancelled`)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRetry = async (dep: DeploymentResponse) => {
    setActionLoading(dep.id)
    try {
      await retryDeployment(dep.id)
      toast.success(`${dep.patch_name} queued for retry`)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to retry')
    } finally {
      setActionLoading(null)
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Clock; count: number }[] = [
    { key: 'pending', label: 'Pending', icon: Clock, count: deployments.filter((d) => d.status === 'PENDING').length },
    { key: 'scheduled', label: 'Scheduled', icon: CheckCircle2, count: deployments.filter((d) => d.status === 'APPROVED').length },
    { key: 'history', label: 'History', icon: RotateCcw, count: deployments.filter((d) => !['PENDING', 'APPROVED'].includes(d.status)).length },
  ]

  const currentItems = filteredDeployments(activeTab)

  return (
    <>
      <TopBar title="Deployments" subtitle={`${deployments.length} total`} />

      <div className="space-y-6 p-8 animate-slide-up">
        <div className="flex gap-1 rounded-lg border border-exia-border/40 bg-exia-card p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-exia-cyan/[0.07] text-exia-cyan shadow-sm'
                    : 'text-exia-text-secondary hover:text-exia-text-primary'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  isActive
                    ? 'bg-exia-cyan/20 text-exia-cyan'
                    : 'bg-exia-elevated text-exia-text-muted'
                }`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-exia-text-muted">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading deployments...
          </div>
        ) : error ? (
          <ErrorAlert message={error} />
        ) : currentItems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-exia-border/40 bg-exia-elevated text-exia-text-muted">
              <Shield size={24} />
            </div>
            <p className="text-sm font-medium text-exia-text-secondary">
              {activeTab === 'pending' && 'No pending deployments awaiting approval'}
              {activeTab === 'scheduled' && 'No scheduled deployments'}
              {activeTab === 'history' && 'No deployment history'}
            </p>
            <p className="text-xs text-exia-text-muted">
              {activeTab === 'pending' && 'Deployments requiring approval will appear here'}
              {activeTab === 'scheduled' && 'Approved deployments waiting to run will appear here'}
              {activeTab === 'history' && 'Completed, failed, and cancelled deployments will appear here'}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-exia-border/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-exia-border/30 bg-exia-elevated/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Patch</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Host</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Scheduled</th>
                  {activeTab !== 'history' && (
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Actions</th>
                  )}
                  {activeTab === 'history' && (
                    <>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Started</th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Finished</th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentItems.map((dep) => {
                  const statusColor = STATUS_COLORS[dep.status] ?? STATUS_COLORS.PENDING
                  const isActionLoading = actionLoading === dep.id

                  return (
                    <tr
                      key={dep.id}
                      onClick={() => navigate(`/deployments/${dep.id}`)}
                      className="group border-b border-exia-border/20 transition-colors hover:bg-exia-elevated/30 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white">{dep.patch_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/hosts/${dep.host_id}`)}
                          className="flex items-center gap-1.5 text-xs text-exia-cyan hover:underline"
                        >
                          <Server size={11} />
                          {dep.hostname}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor}`}>
                          {dep.status === 'FAILED' && <AlertTriangle size={10} />}
                          {dep.status === 'SUCCESS' && <CheckCircle2 size={10} />}
                          {dep.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-exia-text-muted">
                        {dep.scheduled_at ? new Date(dep.scheduled_at).toLocaleString() : '—'}
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleApprove(dep)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-exia-green transition-colors hover:bg-exia-green/10 disabled:opacity-50"
                            >
                              {isActionLoading ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(dep)}
                              disabled={isActionLoading}
                              className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-exia-red transition-colors hover:bg-exia-red/10 disabled:opacity-50"
                            >
                              <XCircle size={11} />
                              Reject
                            </button>
                          </div>
                        </td>
                      )}
                      {activeTab === 'scheduled' && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleCancel(dep)}
                            disabled={isActionLoading}
                            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-exia-text-muted transition-colors hover:bg-exia-red/10 hover:text-exia-red disabled:opacity-50"
                          >
                            {isActionLoading ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                            Cancel
                          </button>
                        </td>
                      )}
                      {activeTab === 'history' && (
                        <>
                          <td className="px-4 py-3 text-xs text-exia-text-muted">
                            {dep.started_at ? new Date(dep.started_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-exia-text-muted">
                            {dep.finished_at ? new Date(dep.finished_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {dep.status === 'FAILED' && (
                              <button
                                onClick={() => handleRetry(dep)}
                                disabled={isActionLoading}
                                className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-exia-cyan transition-colors hover:bg-exia-cyan/10 disabled:opacity-50"
                              >
                                {isActionLoading ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                                Retry
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
