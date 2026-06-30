import { useNavigate } from 'react-router-dom'
import { useHosts } from '../hooks/useHosts'
import { StatusBadge } from '../components/shared/StatusBadge'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { Server, ChevronRight, Search, Monitor, Terminal } from 'lucide-react'

const OS_ICON: Record<string, typeof Server> = {
  windows: Monitor,
  linux:   Terminal,
  macos:   Monitor,
}

export function HostsPage() {
  const { data: hosts, loading, error } = useHosts()
  const navigate = useNavigate()

  if (loading) return <LoadingSpinner />
  if (error)   return <><TopBar title="Hosts" /><div className="p-8"><ErrorAlert message={error} /></div></>

  return (
    <>
      <TopBar title="Hosts" subtitle={`${hosts.length} machines`} />

      <div className="space-y-5 p-8 animate-slide-up">

        {/* ── Toolbar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-exia-text-muted" />
            <input
              type="text"
              placeholder="Search hosts…"
              className="w-full rounded-lg border border-white/[0.06] bg-exia-card py-2 pl-9 pr-4 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              readOnly
            />
          </div>
          <p className="text-xs text-exia-text-muted">
            {hosts.length} registered machine{hosts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Table ───────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-white/[0.05] shadow-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.05] bg-exia-elevated">
                <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">Hostname</th>
                <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">IP Address</th>
                <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">OS</th>
                <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">Status</th>
                <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">Registered</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] bg-exia-card">
              {hosts.map((host) => {
                const OsIcon = OS_ICON[host.os_type?.toLowerCase() ?? ''] ?? Server
                return (
                  <tr
                    key={host.id}
                    onClick={() => navigate(`/hosts/${host.id}`)}
                    className="table-row-hover group cursor-pointer transition-all duration-150"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-white/[0.05] text-exia-text-secondary group-hover:border-exia-cyan/20 group-hover:text-exia-cyan transition-colors">
                          <OsIcon size={14} />
                        </div>
                        <span className="font-semibold text-white group-hover:text-exia-cyan transition-colors">
                          {host.hostname}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-exia-text-secondary">{host.ip_address}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-white/[0.06] bg-exia-elevated px-2 py-0.5 text-xs font-medium capitalize text-exia-text-secondary">
                        {host.os_type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={host.status} />
                    </td>
                    <td className="px-5 py-4 text-xs text-exia-text-muted">
                      {new Date(host.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ChevronRight size={16} className="ml-auto text-exia-text-muted opacity-0 group-hover:opacity-100 group-hover:text-exia-cyan transition-all" />
                    </td>
                  </tr>
                )
              })}

              {hosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-exia-elevated text-exia-text-muted">
                        <Server size={24} />
                      </div>
                      <p className="text-sm font-medium text-exia-text-secondary">No hosts registered yet</p>
                      <p className="text-xs text-exia-text-muted">Deploy the agent on your machines to start monitoring</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}
