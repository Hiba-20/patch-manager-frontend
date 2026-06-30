import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHosts } from '../hooks/useHosts'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared/StatusBadge'
import { TableSkeleton } from '../components/skeletons/TableSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { filterHosts, getUniqueOsTypes, getUniqueStatuses, type HostFilters, DEFAULT_HOST_FILTERS } from '../utils/filterHosts'
import { Server, Monitor, Terminal, ChevronRight, X } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { HostResponse } from '../types/host'

const OS_ICON: Record<string, typeof Server> = {
  windows: Monitor,
  linux: Terminal,
  macos: Monitor,
}

export function HostsPage() {
  const { data: hosts, loading, error } = useHosts()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<HostFilters>(DEFAULT_HOST_FILTERS)

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
            <span className="font-semibold text-white group-hover:text-exia-cyan transition-colors">
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
      header: 'Registered',
      accessorKey: 'created_at',
      cell: ({ getValue }) => {
        const date = getValue() as string
        return (
          <span className="text-xs text-exia-text-muted">
            {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        )
      },
    },
    {
      id: 'chevron',
      header: '',
      cell: () => (
        <ChevronRight size={16} className="ml-auto text-exia-text-muted opacity-0 group-hover:opacity-100 group-hover:text-exia-cyan transition-all" />
      ),
    },
  ], [])

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
    </>
  )
}
