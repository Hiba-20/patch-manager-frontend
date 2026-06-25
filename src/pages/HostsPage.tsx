import { useMemo, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHosts } from '../hooks/useHosts'
import { deleteHost } from '../api/hosts'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared/StatusBadge'
import { TableSkeleton } from '../components/skeletons/TableSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { useToast } from '../components/shared/Toast'
import { filterHosts, getUniqueOsTypes, getUniqueStatuses, type HostFilters, DEFAULT_HOST_FILTERS } from '../utils/filterHosts'
import { getRiskMatrixReport } from '../api/reports'
import type { HostRiskRow } from '../types/report'
import { AddHostModal } from '../components/hosts/AddHostModal'
import { EditHostModal } from '../components/hosts/EditHostModal'
import { Server, Monitor, Terminal, ChevronRight, X, AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { HostResponse } from '../types/host'
import { timeAgo } from '../utils/relativeTime'

const OS_ICON: Record<string, typeof Server> = {
  windows: Monitor,
  linux: Terminal,
  macos: Monitor,
}

export function HostsPage() {
  const { data: hosts, loading, error, refetch } = useHosts()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<HostFilters>(DEFAULT_HOST_FILTERS)
  const [riskMap, setRiskMap] = useState<Record<string, HostRiskRow>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<HostResponse | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HostResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()

  const load = useCallback(() => {
    getRiskMatrixReport()
      .then((res) => {
        const map: Record<string, HostRiskRow> = {}
        for (const r of res.rows) {
          map[r.host_id] = r
        }
        setRiskMap(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const osTypes = useMemo(() => getUniqueOsTypes(hosts), [hosts])
  const statuses = useMemo(() => getUniqueStatuses(hosts), [hosts])
  const filteredHosts = useMemo(() => filterHosts(hosts, filters), [hosts, filters])

  const columns = useMemo<ColumnDef<HostResponse>[]>(() => [
    {
      header: 'Hostname',
      accessorKey: 'hostname',
      cell: ({ row }) => {
        const host = row.original
        const OsIcon = OS_ICON[host.os_type?.toLowerCase() ?? ''] ?? Server
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-exia-border/40 text-exia-text-secondary group-hover:border-exia-cyan/20 group-hover:text-exia-cyan transition-colors">
              <OsIcon size={14} />
            </div>
            <span className="font-semibold text-exia-text-primary group-hover:text-exia-cyan transition-colors">
              {host.hostname}
            </span>
          </div>
        )
      },
    },
    {
      header: 'IP Address',
      accessorKey: 'ip_address',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-exia-text-secondary">{getValue() as string}</span>
      ),
    },
    {
      header: 'OS',
      accessorKey: 'os_type',
      cell: ({ getValue }) => (
        <span className="rounded-md border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-xs font-medium capitalize text-exia-text-secondary">
          {getValue() as string}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
    },
    {
      header: 'Risk Score',
      accessorKey: 'id',
      cell: ({ row }) => {
        const risk = riskMap[row.original.id]
        if (!risk || risk.risk_level === 'UNKNOWN') return <span className="text-xs text-muted">—</span>
        
        let colorClass = 'text-green'
        let bgClass = 'bg-green-500/10'
        if (risk.risk_level === 'CRITICAL') { colorClass = 'text-danger'; bgClass = 'bg-red-500/10' }
        else if (risk.risk_level === 'HIGH') { colorClass = 'text-amber'; bgClass = 'bg-amber-500/10' }
        else if (risk.risk_level === 'MEDIUM') { colorClass = 'text-amber'; bgClass = 'bg-amber-500/10' }
        
        return (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${bgClass} ${colorClass}`}>
              {risk.risk_level}
            </span>
            <span className="text-[10px] text-secondary font-mono">Score: {risk.risk_score}</span>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      header: 'Registered',
      accessorKey: 'created_at',
      cell: ({ getValue }) => {
        const date = getValue() as string
        return (
          <span className="text-xs text-exia-text-muted" title={new Date(date).toLocaleString()}>
            {timeAgo(date)}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setEditTarget(row.original)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-exia-text-muted transition-colors hover:bg-exia-cyan/10 hover:text-exia-cyan"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => setDeleteTarget(row.original)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-exia-text-muted transition-colors hover:bg-exia-red/10 hover:text-exia-red"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
    {
      id: 'chevron',
      header: '',
      cell: () => (
        <ChevronRight size={16} className="ml-auto text-exia-text-muted opacity-0 group-hover:opacity-100 group-hover:text-exia-cyan transition-all" />
      ),
    },
  ], [riskMap])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteHost(deleteTarget.id)
      toast.success(`Host ${deleteTarget.hostname} deleted`)
      setDeleteTarget(null)
      refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete host')
    } finally {
      setDeleting(false)
    }
  }

  const activeFilterCount = [filters.search, filters.osType, filters.status].filter(Boolean).length

  if (loading) return <TableSkeleton rows={10} cols={5} />
  if (error) return <><TopBar title="Hosts" /><div className="p-8"><ErrorAlert message={error} /></div></>

  return (
    <>
      <TopBar title="Hosts" subtitle={`${hosts.length} machines`} />

      <div className="space-y-5 p-8 animate-slide-up">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search by hostname, IP, or OS…"
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card py-2 pl-3 pr-8 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters((f) => ({ ...f, search: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-exia-text-muted hover:text-exia-text-secondary transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={filters.osType}
              onChange={(e) => setFilters((f) => ({ ...f, osType: e.target.value }))}
              className="rounded-lg border border-exia-border/50 bg-exia-card px-3 py-2 text-xs text-exia-text-secondary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
            >
              <option value="">All OS</option>
              {osTypes.map((os) => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-exia-border/50 bg-exia-card px-3 py-2 text-xs text-exia-text-secondary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
            >
              <option value="">All Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => setFilters(DEFAULT_HOST_FILTERS)}
                className="flex items-center gap-1 rounded-lg border border-exia-border/40 bg-exia-elevated px-2.5 py-2 text-[11px] font-medium text-exia-text-secondary hover:text-exia-cyan hover:border-exia-cyan/30 transition-colors"
              >
                <X size={12} />
                Clear
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            >
              <Plus size={15} />
              Add Host
            </button>
          </div>

          <p className="text-xs text-exia-text-muted whitespace-nowrap">
            {filteredHosts.length} of {hosts.length} machine{hosts.length !== 1 ? 's' : ''}
          </p>
        </div>

        <DataTable
          data={filteredHosts}
          columns={columns}
          onRowClick={(host) => navigate(`/hosts/${host.id}`)}
          enableSearch={false}
          enableSorting
          pageSize={25}
          emptyState={
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-exia-border/40 bg-exia-elevated text-exia-text-muted">
                <Server size={24} />
              </div>
              <p className="text-sm font-medium text-exia-text-secondary">No hosts registered yet</p>
              <p className="text-xs text-exia-text-muted">Deploy the agent on your machines to start monitoring</p>
            </div>
          }
        />
      </div>

      <AddHostModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={() => { setShowAddModal(false); refetch() }}
      />

      <EditHostModal
        key={editTarget?.id ?? 'closed'}
        host={editTarget!}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onUpdated={() => refetch()}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Host"
        message={`Are you sure you want to delete "${deleteTarget?.hostname}"? This will remove all deployment history for this host.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
