import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, Bug, Plus, Trash2, X } from 'lucide-react'
import { DataTable } from '../components/shared/DataTable'
import { TableSkeleton } from '../components/skeletons/TableSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { useToast } from '../components/shared/Toast'
import { getPatches, createPatch, deletePatch, type PatchResponse } from '../api/patches'
import type { ColumnDef } from '@tanstack/react-table'

const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-exia-red/10',   text: 'text-exia-red',   border: 'border-exia-red/25' },
  High:     { bg: 'bg-exia-amber/10', text: 'text-exia-amber', border: 'border-exia-amber/25' },
  Medium:   { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/25' },
  Low:      { bg: 'bg-exia-green/10', text: 'text-exia-green', border: 'border-exia-green/25' },
}

function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return <span className="text-exia-text-muted">\u2014</span>
  const cfg = SEVERITY_CONFIG[severity] ?? { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/25' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {severity === 'Critical' && <AlertTriangle size={10} />}
      {severity}
    </span>
  )
}

export function PatchesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [patches, setPatches] = useState<PatchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createData, setCreateData] = useState({ name: '', version: '1.0', vendor: '', severity: 'Medium', os_type: 'windows', cve_input: '' })
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PatchResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPatches = useCallback(() => {
    setLoading(true)
    setError(null)
    getPatches()
      .then(setPatches)
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load patches'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadPatches() }, [loadPatches])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const cves = createData.cve_input ? createData.cve_input.split(',').map((s) => s.trim()).filter(Boolean) : undefined
      await createPatch({
        name: createData.name,
        version: createData.version,
        vendor: createData.vendor || undefined,
        severity: createData.severity,
        os_type: createData.os_type,
        cve_references: cves,
      })
      toast.success('Patch created')
      setShowCreateModal(false)
      setCreateData({ name: '', version: '1.0', vendor: '', severity: 'Medium', os_type: 'windows', cve_input: '' })
      loadPatches()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? 'Failed to create patch'
      toast.error(msg)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePatch(deleteTarget.id)
      toast.success(`Patch ${deleteTarget.name} deleted`)
      setDeleteTarget(null)
      loadPatches()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete patch')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = useMemo(() => {
    if (!search) return patches
    const q = search.toLowerCase()
    return patches.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.vendor?.toLowerCase().includes(q) ||
        p.severity?.toLowerCase().includes(q) ||
        p.cve_references?.some((cve) => cve.toLowerCase().includes(q)),
    )
  }, [patches, search])

  const columns = useMemo<ColumnDef<PatchResponse>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-exia-border/40 text-exia-text-secondary">
              <Shield size={14} />
            </div>
            <div>
              <span className="font-semibold text-white">{row.original.name}</span>
              <span className="ml-2 font-mono text-[11px] text-exia-cyan">v{row.original.version}</span>
            </div>
          </div>
        ),
      },
      {
        header: 'Vendor',
        accessorKey: 'vendor',
        cell: ({ getValue }) => (
          <span className="text-sm text-exia-text-secondary">{getValue() as string ?? '\u2014'}</span>
        ),
      },
      {
        header: 'Severity',
        accessorKey: 'severity',
        cell: ({ getValue }) => <SeverityBadge severity={getValue() as string | null} />,
      },
      {
        header: 'CVEs',
        accessorKey: 'cve_references',
        cell: ({ getValue }) => {
          const cves = getValue() as string[]
          if (!cves || cves.length === 0) return <span className="text-exia-text-muted">\u2014</span>
          return (
            <div className="flex flex-wrap gap-1">
              {cves.slice(0, 2).map((cve) => (
                <span
                  key={cve}
                  className="inline-flex items-center gap-1 rounded-md border border-exia-border/40 bg-exia-elevated px-1.5 py-0.5 text-[10px] font-medium text-exia-text-secondary"
                >
                  <Bug size={10} />
                  {cve}
                </span>
              ))}
              {cves.length > 2 && (
                <span className="rounded-md border border-exia-border/40 bg-exia-elevated px-1.5 py-0.5 text-[10px] font-medium text-exia-text-secondary">
                  +{cves.length - 2}
                </span>
              )}
            </div>
          )
        },
      },
      {
        header: 'Created',
        accessorKey: 'created_at',
        cell: ({ getValue }) => (
          <span className="text-xs text-exia-text-muted">
            {new Date(getValue() as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-exia-text-muted transition-colors hover:bg-exia-red/10 hover:text-exia-red"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ),
      },
    ],
    [],
  )

  if (loading) return <TableSkeleton rows={12} cols={5} />
  if (error) return <><TopBar title="Patches" /><div className="p-8"><ErrorAlert message={error} /></div></>

  return (
    <>
      <TopBar title="Patch Catalog" subtitle={`${patches.length} patches`} />

      <div className="space-y-5 p-8 animate-slide-up">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, vendor, severity, CVE\u2026"
              className="w-full rounded-lg border border-exia-border/50 bg-exia-card py-2 pl-3 pr-8 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-exia-text-muted hover:text-exia-text-secondary transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          >
            <Plus size={15} />
            Create Patch
          </button>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          onRowClick={(patch) => navigate(`/patches/${patch.id}`)}
          enableSorting
          pageSize={25}
          emptyState={
            <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
              <Shield size={20} className="opacity-50" />
              <p className="text-sm">No patches found.</p>
            </div>
          }
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Create Patch</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-exia-text-muted hover:text-exia-text-secondary transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={createData.name}
                  onChange={(e) => setCreateData((d) => ({ ...d, name: e.target.value }))}
                  placeholder="e.g. KB5034123 or libssl3"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">Version</label>
                <input
                  type="text"
                  value={createData.version}
                  onChange={(e) => setCreateData((d) => ({ ...d, version: e.target.value }))}
                  placeholder="1.0"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">Vendor</label>
                <input
                  type="text"
                  value={createData.vendor}
                  onChange={(e) => setCreateData((d) => ({ ...d, vendor: e.target.value }))}
                  placeholder="e.g. Microsoft, Canonical, Red Hat"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">Severity</label>
                <select
                  value={createData.severity}
                  onChange={(e) => setCreateData((d) => ({ ...d, severity: e.target.value }))}
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">OS Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCreateData((d) => ({ ...d, os_type: 'windows' }))}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      createData.os_type === 'windows'
                        ? 'border-exia-cyan/40 bg-exia-cyan/[0.08] text-exia-cyan'
                        : 'border-exia-border/50 bg-exia-navy text-exia-text-secondary'
                    }`}
                  >
                    Windows
                  </button>
                  <button
                    onClick={() => setCreateData((d) => ({ ...d, os_type: 'linux_debian' }))}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      createData.os_type === 'linux_debian'
                        ? 'border-exia-cyan/40 bg-exia-cyan/[0.08] text-exia-cyan'
                        : 'border-exia-border/50 bg-exia-navy text-exia-text-secondary'
                    }`}
                  >
                    Linux
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">CVE References (comma-separated)</label>
                <input
                  type="text"
                  value={createData.cve_input}
                  onChange={(e) => setCreateData((d) => ({ ...d, cve_input: e.target.value }))}
                  placeholder="e.g. CVE-2024-1234, CVE-2024-5678"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!createData.name || creating}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Patch"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also remove all deployments referencing this patch.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
