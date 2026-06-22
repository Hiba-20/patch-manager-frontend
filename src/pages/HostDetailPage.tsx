import { useParams, Link, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, Scan, Server, Globe, Cpu, Calendar, Shield, Package,
  AlertTriangle, ChevronRight, HardDrive, Database, Loader2, CheckCircle2, XCircle,
} from 'lucide-react'
import { useHost } from '../hooks/useHost'
import { useHostSoftware } from '../hooks/useHostSoftware'
import { triggerScan } from '../api/scans'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared/StatusBadge'
import { HostDetailSkeleton } from '../components/skeletons/HostDetailSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { useToast } from '../components/shared/Toast'
import { TopBar } from '../components/layout/TopBar'
import { MissingUpdatesSection } from '../components/host/MissingUpdatesSection'
import type { ColumnDef } from '@tanstack/react-table'
import type { SoftwareItem, PatchOnHost } from '../types/host'

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

function InfoRow({ icon: Icon, label, value }: { icon: typeof Server; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-exia-border/20 last:border-0">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-exia-elevated border border-exia-border/40 text-exia-text-muted flex-shrink-0">
        <Icon size={13} />
      </div>
      <span className="flex-1 text-xs text-exia-text-secondary">{label}</span>
      <div className="text-sm font-medium text-white">{value}</div>
    </div>
  )
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">{title}</h2>
      <span className="rounded-full border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[10px] font-semibold text-exia-text-muted">
        {count}
      </span>
      <div className="flex-1 h-px bg-exia-border/20" />
    </div>
  )
}

export function HostDetailPage() {
  const { hostId } = useParams<{ hostId: string }>()
  const navigate = useNavigate()
  const { data: host, loading: hostLoading, error: hostError } = useHost(hostId)
  const { data: sw, loading: swLoading, error: swError } = useHostSoftware(hostId)
  const [scanning, setScanning] = useState(false)
  const [showScanConfirm, setShowScanConfirm] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const toast = useToast()

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'updates', label: 'Updates' },
    { id: 'software', label: 'Software' },
    { id: 'patches', label: 'Patches' },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveSection(e.target.id)
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [host, sw])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleLaunchScan = async () => {
    if (!hostId || scanning) return
    setScanning(true)
    setShowScanConfirm(false)
    try {
      await triggerScan(hostId)
      toast.success('Scan launched successfully')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const softwareColumns = useMemo<ColumnDef<SoftwareItem>[]>(() => [
    { header: 'Name', accessorKey: 'name', cell: ({ getValue }) => <span className="font-medium text-white">{getValue() as string}</span> },
    { header: 'Version', accessorKey: 'version', cell: ({ getValue }) => <span className="font-mono text-xs text-exia-cyan">{getValue() as string ?? '\u2014'}</span> },
    { header: 'Vendor', accessorKey: 'vendor', cell: ({ getValue }) => <span className="text-exia-text-secondary">{getValue() as string ?? '\u2014'}</span> },
    {
      header: 'Package Manager',
      accessorKey: 'package_manager',
      cell: ({ getValue }) => {
        const pm = getValue() as string | null
        return pm ? (
          <span className="rounded-md border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[11px] font-medium text-exia-text-secondary">
            {pm}
          </span>
        ) : <span className="text-exia-text-muted">\u2014</span>
      },
    },
    { header: 'Install Date', accessorKey: 'install_date', cell: ({ getValue }) => <span className="text-xs text-exia-text-muted">{getValue() as string ?? '\u2014'}</span> },
  ], [])

  const patchColumns = useMemo<ColumnDef<PatchOnHost>[]>(() => [
    {
      header: 'Patch',
      accessorKey: 'patch_name',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Package size={13} className="text-exia-text-muted" />
          <span className="font-medium text-white">{getValue() as string}</span>
        </div>
      ),
    },
    { header: 'Version', accessorKey: 'patch_version', cell: ({ getValue }) => <span className="font-mono text-xs text-exia-cyan">{getValue() as string}</span> },
    {
      header: 'Severity',
      accessorKey: 'severity',
      cell: ({ getValue }) => {
        const s = getValue() as string | null
        return s ? <SeverityBadge severity={s} /> : <span className="text-exia-text-muted">\u2014</span>
      },
    },
    {
      header: 'CVEs',
      accessorKey: 'cve_references',
      cell: ({ row }) => {
        const cves = row.original.cve_references
        if (!cves || cves.length === 0) return <span className="text-exia-text-muted">\u2014</span>
        return (
          <div className="flex flex-wrap gap-1">
            {cves.slice(0, 2).map((cve) => (
              <span key={cve} className="rounded-md border border-exia-border/40 bg-exia-elevated px-1.5 py-0.5 text-[10px] font-medium text-exia-text-secondary cursor-help" title={cve}>
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
    { header: 'Status', accessorKey: 'status', cell: ({ getValue }) => <StatusBadge status={getValue() as string} /> },
    {
      header: 'Scheduled',
      accessorKey: 'scheduled_at',
      cell: ({ getValue }) => {
        const date = getValue() as string | null
        return date ? (
          <span className="text-xs text-exia-text-muted">
            {new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        ) : <span className="text-exia-text-muted">\u2014</span>
      },
    },
  ], [])

  if (hostLoading || swLoading) return <HostDetailSkeleton />
  if (hostError) return <><TopBar title="Host Details" breadcrumb="Hosts" /><div className="p-8"><ErrorAlert message={hostError} /></div></>
  if (!host) return <><TopBar title="Host Details" breadcrumb="Hosts" /><div className="p-8"><ErrorAlert message="Host not found" /></div></>

  return (
    <>
      <TopBar title={host.hostname} breadcrumb="Hosts" subtitle={host.status} />

      <nav className="sticky top-0 z-30 flex items-center gap-1 border-b border-exia-border/30 bg-exia-navy/90 px-8 backdrop-blur-md">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            className={`relative px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
              activeSection === s.id
                ? 'text-exia-cyan'
                : 'text-exia-text-muted hover:text-exia-text-secondary'
            }`}
          >
            {s.label}
            {activeSection === s.id && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-exia-cyan shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="space-y-8 p-8 animate-slide-up">
        <Link
          to="/hosts"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
        >
          <ArrowLeft size={14} />
          Back to Hosts
        </Link>

        <div id="overview" className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="depth-card depth-card-hover rounded-xl p-5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-cyan/40 via-exia-cyan/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">Host Information</p>
            <InfoRow icon={Server}   label="Hostname"   value={host.hostname} />
            <InfoRow icon={Globe}    label="IP Address"  value={<span className="font-mono text-exia-cyan">{host.ip_address}</span>} />
            <InfoRow icon={Cpu}      label="OS Type"     value={<span className="capitalize">{host.os_type}</span>} />
            <InfoRow icon={Shield}   label="Status"      value={<StatusBadge status={host.status} />} />
            <InfoRow icon={Calendar} label="Registered"  value={new Date(host.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} />
          </div>

          <div className="depth-card depth-card-hover rounded-xl p-5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-green/40 via-exia-green/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">System Resources</p>
            {sw?.hardware ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-exia-text-secondary flex items-center gap-1.5"><Cpu size={12} />CPU ({sw.hardware.cpu_cores} Cores)</span>
                    <span className="font-medium text-white">{sw.hardware.cpu_model || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-exia-text-secondary flex items-center gap-1.5"><Database size={12} />Memory</span>
                    <span className="font-medium text-white">{sw.hardware.ram_used_percent}% used</span>
                  </div>
                  <div className="h-1.5 w-full bg-exia-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-exia-cyan rounded-full transition-all duration-500" style={{ width: `${sw.hardware.ram_used_percent || 0}%` }} />
                  </div>
                  <div className="text-[10px] text-right mt-1 text-exia-text-muted">{sw.hardware.ram_total_gb} GB Total</div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-exia-text-secondary flex items-center gap-1.5"><HardDrive size={12} />Disk</span>
                    <span className="font-medium text-white">{sw.hardware.disk_used_percent}% used</span>
                  </div>
                  <div className="h-1.5 w-full bg-exia-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-exia-green rounded-full transition-all duration-500" style={{ width: `${sw.hardware.disk_used_percent || 0}%` }} />
                  </div>
                  <div className="text-[10px] text-right mt-1 text-exia-text-muted">{sw.hardware.disk_total_gb} GB Total</div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-exia-text-muted text-xs">
                <HardDrive size={24} className="mb-2 opacity-50" />
                No hardware data yet.
              </div>
            )}
          </div>

          <div className="depth-card depth-card-hover rounded-xl p-5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-amber/30 via-exia-amber/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">Quick Actions</p>
            <div className="space-y-3">
              <Link
                to={`/hosts/${hostId}/scan`}
                className="group flex w-full items-center justify-between rounded-lg border border-exia-border/50 bg-exia-card px-4 py-3 text-sm font-medium text-exia-text-secondary transition-all hover:border-exia-cyan/30 hover:text-exia-cyan"
              >
                <div className="flex items-center gap-2.5">
                  <Scan size={15} />
                  View Latest Scan
                </div>
                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <button
                onClick={() => setShowScanConfirm(true)}
                disabled={scanning}
                className="group flex w-full items-center justify-between rounded-lg border border-exia-cyan/20 bg-exia-cyan/[0.05] px-4 py-3 text-sm font-medium text-exia-cyan transition-all hover:border-exia-cyan/40 hover:bg-exia-cyan/10 disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  {scanning ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Scan size={15} />
                  )}
                  {scanning ? 'Scanning...' : 'Launch Inventory Scan'}
                </div>
                {!scanning && <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />}
              </button>

              <ConfirmDialog
                open={showScanConfirm}
                title="Launch Scan"
                message="Start a new inventory scan for this host?"
                confirmLabel="Launch Scan"
                onConfirm={handleLaunchScan}
                onCancel={() => setShowScanConfirm(false)}
              />
            </div>
          </div>
        </div>

        <div id="updates">
          {hostId && (
            <MissingUpdatesSection hostId={hostId} osType={host.os_type} hostname={host.hostname} />
          )}
        </div>

        <section id="software">
          <SectionHeader title="Installed Software" count={sw?.software.length ?? 0} />
          {swError ? (
            <ErrorAlert message={swError} />
          ) : (
            <DataTable
              data={sw?.software ?? []}
              columns={softwareColumns}
              enableSearch
              searchPlaceholder="Search software…"
              enableSorting
              pageSize={10}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
                  <Package size={20} className="opacity-50" />
                  <p className="text-sm">No software data available. Run a scan to collect inventory.</p>
                </div>
              }
            />
          )}
        </section>

        <section id="patches">
          <SectionHeader title="Patch Deployments" count={sw?.patches.length ?? 0} />
          {swError ? (
            <ErrorAlert message={swError} />
          ) : (
            <DataTable
              data={sw?.patches ?? []}
              columns={patchColumns}
              enableSearch
              searchPlaceholder="Search patches…"
              enableSorting
              pageSize={10}
              emptyState={
                <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
                  <Shield size={20} className="opacity-50" />
                  <p className="text-sm">No patch deployments.</p>
                </div>
              }
            />
          )}
        </section>
      </div>
    </>
  )
}
