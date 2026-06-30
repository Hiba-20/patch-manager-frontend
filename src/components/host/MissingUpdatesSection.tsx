import { useEffect, useState, useMemo, useCallback } from 'react'
import { AlertTriangle, CloudLightning, Loader2, CheckCircle2, XCircle, RefreshCw, Rocket, Terminal, ShieldAlert } from 'lucide-react'
import { getMissingUpdates, getDeepScanUpdates, deployPatch } from '../../api/updates'
import type { MissingUpdate } from '../../types/update'
import { DataTable } from '../shared/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { useToast } from '../../components/shared/Toast'
import { useActiveDeployments } from '../../hooks/useActiveDeployments'

type DeployState = 'idle' | 'deploying' | 'success' | 'failed'

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Critical:  { bg: 'bg-exia-red/10',   text: 'text-exia-red',   border: 'border-exia-red/25' },
  Important: { bg: 'bg-exia-amber/10', text: 'text-exia-amber', border: 'border-exia-amber/25' },
  Moderate:  { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/25' },
  Low:       { bg: 'bg-exia-green/10', text: 'text-exia-green', border: 'border-exia-green/25' },
}

function formatCacheAge(cachedAt: string | null): string | null {
  if (!cachedAt) return null
  const diff = Date.now() - new Date(cachedAt).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hrs = Math.floor(min / 60)
  return `${hrs}h ${min % 60}m ago`
}

export function MissingUpdatesSection({ hostId, osType, hostname }: { hostId: string; osType?: string; hostname?: string }) {
  const [updates, setUpdates] = useState<MissingUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [deepScanning, setDeepScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cachedAt, setCachedAt] = useState<string | null>(null)
  const [deployTarget, setDeployTarget] = useState<MissingUpdate | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [bulkDeploying, setBulkDeploying] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [showDeployAllConfirm, setShowDeployAllConfirm] = useState(false)
  const [kbStates, setKbStates] = useState<Record<string, DeployState>>({})
  const [scheduleTime, setScheduleTime] = useState('')
  const [bulkScheduleTime, setBulkScheduleTime] = useState('')
  const [allScheduleTime, setAllScheduleTime] = useState('')
  const toast = useToast()
  const { addTask, updateTask } = useActiveDeployments()

  const isLinux = osType && osType !== 'windows'
  const selectedUpdates = selectedIndices.map((i) => updates[i]).filter(Boolean)

  const fetchUpdates = useCallback(() => {
    setLoading(true)
    setError(null)
    getMissingUpdates(hostId)
      .then((res) => {
        setUpdates(res.updates)
        setCachedAt(res.cached_at)
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load missing updates'))
      .finally(() => setLoading(false))
  }, [hostId])

  const handleDeepScan = useCallback(() => {
    setDeepScanning(true)
    setError(null)
    getDeepScanUpdates(hostId)
      .then((res) => {
        setUpdates(res.updates)
        setCachedAt(res.cached_at)
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Deep scan failed'))
      .finally(() => setDeepScanning(false))
  }, [hostId])

  useEffect(() => { fetchUpdates() }, [fetchUpdates])

  const deploy = async (kbId: string, title: string, severity: string, scheduledAt?: string) => {
    const taskId = addTask(hostId, hostname ?? hostId, kbId, title, severity)
    const isScheduled = !!scheduledAt
    updateTask(taskId, { status: isScheduled ? 'scheduled' : 'deploying' })
    setKbStates(prev => ({ ...prev, [kbId]: isScheduled ? 'deploying' : 'deploying' }))
    try {
      const res = await deployPatch(hostId, kbId, title, severity, scheduledAt)
      const state = isScheduled ? 'success' : (res.status === 'SUCCESS' ? 'success' : 'failed')
      setKbStates(prev => ({ ...prev, [kbId]: state }))
      updateTask(taskId, { status: state, finishedAt: isScheduled ? undefined : new Date() })
      if (state === 'success') {
        toast.success(isScheduled ? `${kbId} scheduled` : `${kbId} deployed successfully`)
      } else {
        toast.error(`${kbId} deployment failed`)
      }
    } catch {
      setKbStates(prev => ({ ...prev, [kbId]: 'failed' }))
      updateTask(taskId, { status: 'failed', finishedAt: new Date() })
      toast.error(`${kbId} deployment failed`)
    }
  }

  const handleDeploy = (kb: MissingUpdate) => {
    setDeployTarget(kb)
  }

  const handleConfirmDeploy = () => {
    if (!deployTarget) return
    const scheduledAt = scheduleTime ? new Date(scheduleTime).toISOString() : undefined
    deploy(deployTarget.kb_id, deployTarget.title, deployTarget.severity, scheduledAt)
    setDeployTarget(null)
    setScheduleTime('')
    handleDeepScan()
  }

  const handleBulkDeploy = async () => {
    setShowBulkConfirm(false)
    setBulkDeploying(true)
    const scheduledAt = bulkScheduleTime ? new Date(bulkScheduleTime).toISOString() : undefined
    for (const u of selectedUpdates) {
      await deploy(u.kb_id, u.title, u.severity, scheduledAt)
    }
    setBulkScheduleTime('')
    setBulkDeploying(false)
    setSelectedIndices([])
    handleDeepScan()
  }

  const handleDeployAll = async () => {
    setShowDeployAllConfirm(false)
    setBulkDeploying(true)
    const scheduledAt = allScheduleTime ? new Date(allScheduleTime).toISOString() : undefined
    for (const u of updates) {
      await deploy(u.kb_id, u.title, u.severity, scheduledAt)
    }
    setAllScheduleTime('')
    setBulkDeploying(false)
    handleDeepScan()
  }

  const columns = useMemo<ColumnDef<MissingUpdate>[]>(
    () => [
      {
        header: isLinux ? 'Package' : 'KB',
        accessorKey: 'kb_id',
        cell: ({ getValue }) => (
          <span className="font-semibold text-exia-text-primary font-mono text-xs">
            {getValue() as string}
          </span>
        ),
      },
      {
        header: 'Title',
        accessorKey: 'title',
        cell: ({ getValue }) => (
          <span className="text-xs text-exia-text-secondary max-w-[300px] truncate block">
            {getValue() as string}
          </span>
        ),
      },
      {
        header: 'Severity',
        accessorKey: 'severity',
        cell: ({ getValue }) => {
          const s = getValue() as string
          const cfg = SEVERITY_CONFIG[s] ?? SEVERITY_CONFIG.Important
          return (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              {s === 'Critical' && <AlertTriangle size={10} />}
              {s}
            </span>
          )
        },
      },
      {
        header: 'Categories',
        accessorKey: 'categories',
        cell: ({ getValue }) => {
          const cats = getValue() as string[]
          if (!cats || cats.length === 0) return <span className="text-exia-text-muted text-xs">\u2014</span>
          return (
            <span className="text-[10px] text-exia-text-secondary max-w-[200px] truncate block">
              {cats.join(', ')}
            </span>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const kb = row.original
          const kbs = kbStates[kb.kb_id]
          const isDeploying = kbs === 'deploying'
          const done = kbs === 'success' || kbs === 'failed'

          return (
            <button
              onClick={() => handleDeploy(kb)}
              disabled={isDeploying}
              className="flex items-center gap-1.5 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-3 py-1.5 text-[11px] font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10 hover:border-exia-cyan/30 disabled:opacity-50 whitespace-nowrap"
            >
              {isDeploying ? (
                <><Loader2 size={11} className="animate-spin" /> Deploying</>
              ) : done && kbs === 'success' ? (
                <><CheckCircle2 size={11} /> Done</>
              ) : done && kbs === 'failed' ? (
                <><XCircle size={11} /> Failed</>
              ) : (
                'Deploy'
              )}
            </button>
          )
        },
      },
    ],
    [kbStates],
  )

  return (
    <section>
      <div className="mb-5 flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2">
          {isLinux ? <Terminal size={14} className="text-exia-amber" /> : <CloudLightning size={14} className="text-exia-amber" />}
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">Missing {isLinux ? 'Linux' : 'Windows'} Updates</h2>
        </div>
        <span className="rounded-full border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[10px] font-semibold text-exia-text-muted">
          {updates.length}
        </span>
        {cachedAt && (
          <span className="text-[10px] text-exia-text-muted/60" title={`Cached at ${cachedAt}`}>
            {formatCacheAge(cachedAt)}
          </span>
        )}
        <div className="flex-1 h-px bg-exia-border/20" />
        <button
          onClick={handleDeepScan}
          disabled={deepScanning || loading}
          className="flex items-center gap-1 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-2.5 py-1 text-[10px] font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10 hover:border-exia-cyan/30 disabled:opacity-50"
        >
          <RefreshCw size={10} className={deepScanning ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : deepScanning ? 'Scanning...' : 'Deep Scan'}
        </button>
      </div>

      {!loading && !error && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {(() => {
            let cr = 0, hi = 0, md = 0, lo = 0
            updates.forEach(u => {
              if (u.severity === 'Critical') cr++
              else if (u.severity === 'Important' || u.severity === 'High') hi++
              else if (u.severity === 'Moderate' || u.severity === 'Medium') md++
              else lo++
            })
            const penalty = cr * 25 + hi * 10 + md * 3 + lo * 1
            const score = Math.max(0, 100 - penalty)
            
            let color = 'text-exia-green'
            if (score < 50) color = 'text-exia-red'
            else if (score < 80) color = 'text-exia-amber'

            return (
              <div className="depth-card rounded-xl p-4 flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-1 border border-exia-border/30">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-exia-text-muted mb-1 font-semibold">Compliance Score</p>
                  <p className={`text-3xl font-bold ${color}`}>{score}%</p>
                </div>
                <div className="relative h-12 w-12 flex items-center justify-center rounded-full border-4" style={{ borderColor: 'currentColor', color: color.replace('text-', 'var(--') + ')' }}>
                  {score === 100 ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-exia-text-muted">
          <Loader2 size={18} className="animate-spin mr-2" />
          Scanning for missing updates...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-4 py-3 text-xs text-exia-red font-medium">{error}</div>
      ) : (
        <>
        <DataTable
          data={updates}
          columns={columns}
          enableSearch
          searchPlaceholder={isLinux ? 'Search packages...' : 'Search KBs...'}
          enableSorting
          enableSelection
          onSelectionChange={setSelectedIndices}
          pageSize={10}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
              <CheckCircle2 size={20} className="text-exia-green" />
              <p className="text-sm font-medium text-exia-green">All updates are installed</p>
            </div>
          }
        />

        {selectedIndices.length > 0 && !loading && !error && (
          <div className="flex items-center gap-3 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.04] px-4 py-2.5 animate-fade-in">
            <span className="text-xs text-exia-text-secondary">
              <span className="font-semibold text-exia-cyan">{selectedIndices.length}</span> update(s) selected
            </span>
            <div className="flex-1 h-px bg-exia-border/20" />
            <button
              onClick={() => setShowBulkConfirm(true)}
              disabled={bulkDeploying}
              className="flex items-center gap-1.5 rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.06] px-3 py-1.5 text-[11px] font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/10 hover:border-exia-cyan/30 disabled:opacity-50"
            >
              {bulkDeploying ? <Loader2 size={11} className="animate-spin" /> : <Rocket size={11} />}
              Deploy Selected
            </button>
            <button
              onClick={() => setShowDeployAllConfirm(true)}
              disabled={bulkDeploying}
              className="flex items-center gap-1.5 rounded-lg border border-exia-border/40 bg-exia-elevated px-3 py-1.5 text-[11px] font-semibold text-exia-text-secondary transition-all hover:border-exia-cyan/30 hover:text-exia-cyan disabled:opacity-50"
            >
              Deploy All ({updates.length})
            </button>
          </div>
        )}
        </>
      )}

      {deployTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setDeployTarget(null); setScheduleTime('') }}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-exia-text-primary mb-2">Deploy {deployTarget.kb_id}</h2>
            <p className="text-sm text-exia-text-secondary mb-4">{deployTarget.title}</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-exia-text-secondary mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
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
                onClick={handleConfirmDeploy}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90"
              >
                {scheduleTime ? `Schedule for ${new Date(scheduleTime).toLocaleDateString()}` : 'Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowBulkConfirm(false); setBulkScheduleTime('') }}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-exia-text-primary mb-2">Bulk Deploy</h2>
            <p className="text-sm text-exia-text-secondary mb-4">Install {selectedIndices.length} selected update(s) on this host?</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-exia-text-secondary mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={bulkScheduleTime}
                onChange={(e) => setBulkScheduleTime(e.target.value)}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
              />
              <p className="text-[10px] text-exia-text-muted mt-1">Leave empty to deploy immediately</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowBulkConfirm(false); setBulkScheduleTime('') }}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeploy}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90"
              >
                {bulkScheduleTime ? `Schedule ${selectedIndices.length} updates` : `Deploy ${selectedIndices.length} updates`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeployAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowDeployAllConfirm(false); setAllScheduleTime('') }}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-exia-text-primary mb-2">Deploy All</h2>
            <p className="text-sm text-exia-text-secondary mb-4">Install all {updates.length} missing update(s) on this host?</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-exia-text-secondary mb-1">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={allScheduleTime}
                onChange={(e) => setAllScheduleTime(e.target.value)}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
              />
              <p className="text-[10px] text-exia-text-muted mt-1">Leave empty to deploy immediately</p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDeployAllConfirm(false); setAllScheduleTime('') }}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleDeployAll}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90"
              >
                {allScheduleTime ? `Schedule all ${updates.length} updates` : `Deploy all ${updates.length} updates`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
