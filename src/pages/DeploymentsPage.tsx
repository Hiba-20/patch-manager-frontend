import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDeployments, approveDeployment, rejectDeployment, cancelDeployment, retryDeployment, bulkApproveDeployments, bulkRejectDeployments, type DeploymentResponse } from '../api/patches'
import { TopBar } from '../components/layout/TopBar'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { useToast } from '../components/shared/Toast'
import { BulkActionConfirmModal } from '../components/deployments/BulkActionConfirmModal'
import { CheckCircle2, XCircle, Clock, Loader2, RotateCcw, X, AlertTriangle, Server, Shield } from 'lucide-react'
import { timeAgo } from '../utils/relativeTime'

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkModal, setBulkModal] = useState<{ action: 'approve' | 'reject' } | null>(null)

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

  const handleBulkConfirm = async (comment: string) => {
    if (!bulkModal) return
    setBulkLoading(true)
    setBulkModal(null)
    try {
      const action = bulkModal.action === 'approve' ? bulkApproveDeployments : bulkRejectDeployments
      const res = await action(Array.from(selectedIds), comment)
      toast.success(res.message)
      setSelectedIds(new Set())
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Bulk operation failed')
    } finally {
      setBulkLoading(false)
    }
  }

  // Clear selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [activeTab])

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
        <div className="flex flex-wrap items-center justify-between gap-4">
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
          {activeTab === 'pending' && selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-exia-text-secondary mr-2">{selectedIds.size} selected</span>
              <button 
                onClick={() => setBulkModal({ action: 'approve' })} 
                disabled={bulkLoading}
                className="btn-primary py-1.5 text-xs"
              >
                <CheckCircle2 size={14} className={bulkLoading ? 'animate-pulse' : ''} /> Approve Selected
              </button>
              <button 
                onClick={() => setBulkModal({ action: 'reject' })}
                disabled={bulkLoading}
                className="btn-ghost py-1.5 text-xs border-exia-red/30 text-exia-red hover:bg-exia-red/10"
              >
                <XCircle size={14} className={bulkLoading ? 'animate-pulse' : ''} /> Reject Selected
              </button>
            </div>
          )}
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
                  {activeTab === 'pending' && (
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={currentItems.length > 0 && selectedIds.size === currentItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(new Set(currentItems.map(i => i.id)))
                          } else {
                            setSelectedIds(new Set())
                          }
                        }}
                        className="rounded border-exia-border/50 bg-exia-card text-exia-cyan focus:ring-exia-cyan/20"
                      />
                    </th>
                  )}
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
                      className={`border-b border-exia-border/20 transition-colors last:border-0 hover:bg-exia-cyan/[0.02] cursor-pointer ${selectedIds.has(dep.id) ? 'bg-exia-cyan/[0.04]' : ''}`}
                    >
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(dep.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              const next = new Set(selectedIds)
                              if (e.target.checked) next.add(dep.id)
                              else next.delete(dep.id)
                              setSelectedIds(next)
                            }}
                            className="rounded border-exia-border/50 bg-exia-card text-exia-cyan focus:ring-exia-cyan/20"
                          />
                        </td>
                      )}
                      <td
                        className="px-4 py-3 cursor-pointer hover:underline"
                        onClick={e => { e.stopPropagation(); navigate(`/patches/${dep.patch_id}`); }}
                      >
                        <span className="text-sm font-medium text-exia-text-primary">{dep.patch_name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/hosts/${dep.host_id}`); }}
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
                      <td className="px-4 py-3 text-xs text-exia-text-muted" title={dep.scheduled_at ? new Date(dep.scheduled_at).toLocaleString() : ''}>
                        {dep.scheduled_at ? timeAgo(dep.scheduled_at) : '—'}
                      </td>
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
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
                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
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
                          <td className="px-4 py-3 text-xs text-exia-text-muted" title={dep.started_at ? new Date(dep.started_at).toLocaleString() : ''}>
                            {dep.started_at ? timeAgo(dep.started_at) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-exia-text-muted" title={dep.finished_at ? new Date(dep.finished_at).toLocaleString() : ''}>
                            {dep.finished_at ? timeAgo(dep.finished_at) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
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
      <BulkActionConfirmModal
        open={!!bulkModal}
        action={bulkModal?.action ?? 'approve'}
        count={selectedIds.size}
        onConfirm={handleBulkConfirm}
        onCancel={() => setBulkModal(null)}
      />
    </>
  )
}
