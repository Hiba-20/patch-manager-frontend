import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Scan, Server, Globe, Cpu, Calendar, Shield, Package, AlertTriangle, ChevronRight } from 'lucide-react'
import { useHost } from '../hooks/useHost'
import { useHostSoftware } from '../hooks/useHostSoftware'
import { StatusBadge } from '../components/shared/StatusBadge'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'

/* ── Severity badge config ────────────────────────────────────── */
const SEVERITY_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-exia-red/10',   text: 'text-exia-red',   border: 'border-exia-red/25' },
  High:     { bg: 'bg-exia-amber/10', text: 'text-exia-amber', border: 'border-exia-amber/25' },
  Medium:   { bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/25' },
  Low:      { bg: 'bg-exia-green/10', text: 'text-exia-green', border: 'border-exia-green/25' },
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg = SEVERITY_CONFIG[severity] ?? { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/25' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {severity === 'Critical' && <AlertTriangle size={10} />}
      {severity}
    </span>
  )
}

/* ── Info Row ─────────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-exia-elevated border border-white/[0.05] text-exia-text-muted flex-shrink-0">
        <Icon size={13} />
      </div>
      <span className="flex-1 text-xs text-exia-text-secondary">{label}</span>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  )
}

/* ── Section Header ───────────────────────────────────────────── */
function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">{title}</h2>
      <span className="rounded-full border border-white/[0.06] bg-exia-elevated px-2 py-0.5 text-[10px] font-semibold text-exia-text-muted">
        {count}
      </span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────── */
export function HostDetailPage() {
  const { hostId } = useParams<{ hostId: string }>()
  const { data: host, loading: hostLoading, error: hostError } = useHost(hostId)
  const { data: sw, loading: swLoading, error: swError } = useHostSoftware(hostId)

  if (hostLoading || swLoading) return <LoadingSpinner />
  if (hostError) return <><TopBar title="Host Details" breadcrumb="Hosts" /><div className="p-8"><ErrorAlert message={hostError} /></div></>
  if (!host)     return <><TopBar title="Host Details" breadcrumb="Hosts" /><div className="p-8"><ErrorAlert message="Host not found" /></div></>

  return (
    <>
      <TopBar title={host.hostname} breadcrumb="Hosts" subtitle={host.status} />

      <div className="space-y-8 p-8 animate-slide-up">

        {/* ── Back link ──────────────────────────────────────── */}
        <Link
          to="/hosts"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
        >
          <ArrowLeft size={14} />
          Back to Hosts
        </Link>

        {/* ── Info + Actions row ─────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Host Info card */}
          <div className="relative rounded-xl border border-white/[0.05] bg-exia-card p-5 shadow-card lg:col-span-2">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-cyan/40 via-exia-cyan/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">Host Information</p>
            <InfoRow icon={Server}   label="Hostname"   value={host.hostname} />
            <InfoRow icon={Globe}    label="IP Address"  value={<span className="font-mono text-exia-cyan">{host.ip_address}</span>} />
            <InfoRow icon={Cpu}      label="OS Type"     value={<span className="capitalize">{host.os_type}</span>} />
            <InfoRow icon={Shield}   label="Status"      value={<StatusBadge status={host.status} />} />
            <InfoRow icon={Calendar} label="Registered"  value={new Date(host.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
          </div>

          {/* Quick Actions card */}
          <div className="relative rounded-xl border border-white/[0.05] bg-exia-card p-5 shadow-card">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-amber/30 via-exia-amber/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">Quick Actions</p>
            <div className="space-y-2">
              <Link
                to={`/hosts/${hostId}/scan`}
                className="group flex w-full items-center justify-between rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.05] px-4 py-3 text-sm font-medium text-exia-cyan transition-all hover:border-exia-cyan/40 hover:bg-exia-cyan/10"
              >
                <div className="flex items-center gap-2.5">
                  <Scan size={15} />
                  View Latest Scan
                </div>
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* ── Software Table ─────────────────────────────────── */}
        <section>
          <SectionHeader title="Installed Software" count={sw?.software.length ?? 0} />
          {swError ? (
            <ErrorAlert message={swError} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/[0.05] shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-exia-elevated">
                    {['Name', 'Version', 'Vendor', 'Package Manager', 'Install Date'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] bg-exia-card">
                  {(sw?.software ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-exia-text-muted">No software data available.</td></tr>
                  ) : (
                    sw?.software.map((s) => (
                      <tr key={s.id} className="table-row-hover transition-all duration-150">
                        <td className="px-5 py-3.5 font-medium text-white">{s.name}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-exia-cyan">{s.version ?? '—'}</td>
                        <td className="px-5 py-3.5 text-exia-text-secondary">{s.vendor ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          {s.package_manager ? (
                            <span className="rounded-md border border-white/[0.06] bg-exia-elevated px-2 py-0.5 text-[11px] font-medium text-exia-text-secondary">
                              {s.package_manager}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-exia-text-muted">{s.install_date ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Patches Table ──────────────────────────────────── */}
        <section>
          <SectionHeader title="Patch Deployments" count={sw?.patches.length ?? 0} />
          {swError ? (
            <ErrorAlert message={swError} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/[0.05] shadow-card">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-exia-elevated">
                    {['Patch', 'Version', 'Severity', 'Status', 'Scheduled'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] bg-exia-card">
                  {(sw?.patches ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-exia-text-muted">No patch deployments.</td></tr>
                  ) : (
                    sw?.patches.map((p) => (
                      <tr key={p.patch_id} className="table-row-hover transition-all duration-150">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Package size={13} className="text-exia-text-muted" />
                            <span className="font-medium text-white">{p.patch_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-exia-cyan">{p.patch_version}</td>
                        <td className="px-5 py-3.5">
                          {p.severity ? <SeverityBadge severity={p.severity} /> : <span className="text-exia-text-muted">—</span>}
                        </td>
                        <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                        <td className="px-5 py-3.5 text-xs text-exia-text-muted">
                          {p.scheduled_at ? new Date(p.scheduled_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </>
  )
}
