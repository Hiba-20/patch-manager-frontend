import { useEffect, useState, useMemo, useCallback } from 'react'
import { AlertTriangle, CloudLightning, Loader2, CheckCircle2, XCircle, RefreshCw, Rocket, Terminal } from 'lucide-react'
import { getMissingUpdates, getDeepScanUpdates, deployPatch } from '../../api/updates'
import type { MissingUpdate } from '../../types/update'
import { DataTable } from '../shared/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { useToast } from '../../components/shared/Toast'
import { ConfirmDialog } from '../../components/shared/ConfirmDialog'
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
  const toast = useToast()
  const { addTask, updateTask } = useActiveDeployments()

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

  const deploy = async (kbId: string, title: string, severity: string) => {
    const taskId = addTask(hostId, hostname ?? hostId, kbId, title, severity)
    updateTask(taskId, { status: 'deploying' })
    setKbStates(prev => ({ ...prev, [kbId]: 'deploying' }))
    try {
      const res = await deployPatch(hostId, kbId, title, severity)
      const state = res.status === 'SUCCESS' ? 'success' : 'failed'
      setKbStates(prev => ({ ...prev, [kbId]: state }))
      updateTask(taskId, { status: state, finishedAt: new Date() })
      if (state === 'success') {
        toast.success(`${kbId} deployed successfully`)
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
    deploy(deployTarget.kb_id, deployTarget.title, deployTarget.severity)
    setDeployTarget(null)
    handleDeepScan()
  }

  const handleBulkDeploy = async () => {
    setShowBulkConfirm(false)
    setBulkDeploying(true)
    for (const u of selectedUpdates) {
      await deploy(u.kb_id, u.title, u.severity)
    }
    setBulkDeploying(false)
    setSelectedIndices([])
    handleDeepScan()
  }

  const handleDeployAll = async () => {
    setShowDeployAllConfirm(false)
    setBulkDeploying(true)
    for (const u of updates) {
      await deploy(u.kb_id, u.title, u.severity)
    }
    setBulkDeploying(false)
    handleDeepScan()
  }

  const columns = useMemo<ColumnDef<MissingUpdate>[]>(
    () => [
      {
        header: 'KB',
        accessorKey: 'kb_id',
        cell: ({ getValue }) => (
          <span className="font-semibold text-white font-mono text-xs">
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

  if (osType && osType !== 'windows') {
    return (
      <section>
        <div className="mb-5 flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-exia-text-muted" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">Patch Scanning</h2>
          </div>
          <div className="flex-1 h-px bg-exia-border/20" />
        </div>
        <div className="rounded-xl border border-exia-border/30 bg-exia-card p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-exia-border/30 bg-exia-elevated">
              <Terminal size={24} className="text-exia-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Linux patch scanning coming soon</p>
              <p className="mt-1 text-xs text-exia-text-muted max-w-md">
                Patch scanning and deployment for Linux hosts is not yet available.
                This feature will be added in a future release.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="mb-5 flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-2">
          <CloudLightning size={14} className="text-exia-amber" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">Missing Windows Updates</h2>
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
          searchPlaceholder="Search KBs..."
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

      <ConfirmDialog
        open={!!deployTarget}
        title={`Deploy ${deployTarget?.kb_id ?? ''}`}
        message={`Install ${deployTarget?.title ?? ''} on ${hostname ?? hostId}?`}
        confirmLabel="Deploy"
        onConfirm={handleConfirmDeploy}
        onCancel={() => setDeployTarget(null)}
      />

      <ConfirmDialog
        open={showBulkConfirm}
        title="Bulk Deploy"
        message={`Install ${selectedIndices.length} selected update(s) on this host?`}
        confirmLabel={`Deploy ${selectedIndices.length}`}
        onConfirm={handleBulkDeploy}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <ConfirmDialog
        open={showDeployAllConfirm}
        title="Deploy All"
        message={`Install all ${updates.length} missing update(s) on this host?`}
        confirmLabel={`Deploy All ${updates.length}`}
        onConfirm={handleDeployAll}
        onCancel={() => setShowDeployAllConfirm(false)}
      />
    </section>
  )
}
