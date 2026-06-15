import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  ArrowLeft, Calendar, Activity, Terminal, Copy, CheckCircle2,
  FileText, Package, List, Scan, RefreshCw, Loader2, AlertTriangle, Clock,
} from 'lucide-react'
import { useLatestScan } from '../hooks/useLatestScan'
import { useTriggerScan } from '../hooks/useTriggerScan'
import { useStructuredScan } from '../hooks/useStructuredScan'
import { StatusBadge } from '../components/shared/StatusBadge'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { InventorySummary } from '../components/scan/InventorySummary'
import { PackageList } from '../components/scan/PackageList'
import { EventTimeline } from '../components/scan/EventTimeline'

const TABS = [
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'events', label: 'Events', icon: List },
  { id: 'raw', label: 'Raw JSON', icon: Terminal },
] as const

type TabId = typeof TABS[number]['id']

function MetricCard({ icon: Icon, label, value, accent = 'text-exia-cyan' }: {
  icon: typeof Calendar
  label: string
  value: React.ReactNode
  accent?: string
}) {
  return (
    <div className="depth-card rounded-xl p-5">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-exia-elevated border border-exia-border/40 ${accent}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">{label}</p>
          <div className="mt-1 text-base font-semibold text-white">{value}</div>
        </div>
      </div>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 rounded-md border border-exia-border/50 bg-exia-card px-2.5 py-1 text-[11px] font-medium text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
    >
      {copied ? <CheckCircle2 size={12} className="text-exia-green" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function colorizeJson(raw: string): string {
  return raw
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
      if (/:$/.test(match)) {
        return `<span class="text-exia-cyan">${match.replace(/:$/, '')}</span>:`
      }
      return `<span class="text-exia-green">${match}</span>`
    })
    .replace(/\b(true|false)\b/g, '<span class="text-exia-amber">$1</span>')
    .replace(/\bnull\b/g, '<span class="text-exia-text-muted">null</span>')
    .replace(/\b(-?\d+\.?\d*)\b/g, '<span class="text-purple-400">$1</span>')
}

function EmptyScanState({ hostId, onLaunch }: { hostId: string; onLaunch: () => void }) {
  const container = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    gap: '24px',
  }

  return (
    <div className="depth-card rounded-xl" style={container}>
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-exia-border/40 bg-exia-elevated">
        <Scan size={36} className="text-exia-text-muted" />
      </div>
      <div className="text-center max-w-sm">
        <p className="text-lg font-semibold text-white mb-1">No scans yet</p>
        <p className="text-sm text-exia-text-secondary">
          Run an inventory scan to detect installed software, hardware specs, and available patches on this host.
        </p>
      </div>
      <button
        onClick={onLaunch}
        className="flex items-center gap-2 rounded-xl border border-exia-cyan/30 bg-exia-cyan/10 px-6 py-3 text-sm font-semibold text-exia-cyan transition-all hover:bg-exia-cyan/[0.15] hover:shadow-glow-cyan"
      >
        <Scan size={16} />
        Launch Inventory Scan
      </button>
    </div>
  )
}

function ScanningState({ state, error }: { state: string; error: string | null }) {
  const isLaunching = state === 'launching'
  const isScanning = state === 'scanning'
  const isFailed = state === 'failed'

  const container = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    gap: '20px',
  }

  return (
    <div className="depth-card rounded-xl" style={container}>
      {isFailed ? (
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-exia-red/20 bg-exia-red/10">
          <AlertTriangle size={36} className="text-exia-red" />
        </div>
      ) : (
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-exia-cyan/20 bg-exia-cyan/[0.06]">
          <Loader2 size={36} className="text-exia-cyan animate-spin" />
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-exia-cyan animate-ping" />
        </div>
      )}

      <div className="text-center max-w-sm">
        {isLaunching && (
          <>
            <p className="text-lg font-semibold text-white mb-1">Launching scan...</p>
            <p className="text-sm text-exia-text-secondary">Connecting to the host and starting the inventory collection.</p>
            <div className="mt-4 flex justify-center gap-1">
              <span className="h-2 w-2 rounded-full bg-exia-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-2 w-2 rounded-full bg-exia-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-2 w-2 rounded-full bg-exia-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
        {isScanning && (
          <>
            <p className="text-lg font-semibold text-white mb-1">Scan in progress...</p>
            <p className="text-sm text-exia-text-secondary">Gathering system information and checking for available patches.</p>
            <div className="mt-5 flex items-center gap-2 text-xs text-exia-cyan font-mono">
              <RefreshCw size={12} className="animate-spin" />
              Polling for results
            </div>
          </>
        )}
        {isFailed && (
          <>
            <p className="text-lg font-semibold text-exia-red mb-1">Scan failed</p>
            <p className="text-sm text-exia-text-secondary">
              {error || 'The scan could not complete. The host may be unreachable or the Ansible playbook failed.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export function ScanDetailPage() {
  const { hostId } = useParams<{ hostId: string }>()
  const { data: scan, loading, error } = useLatestScan(hostId)
  const { state: scanState, result: scanResult, error: scanError, launch, reset } = useTriggerScan(hostId)
  const parsed = useStructuredScan(scanResult || scan)
  const [activeTab, setActiveTab] = useState<TabId>('summary')
  const [showResults, setShowResults] = useState(false)

  const effectiveScan = scanResult || scan

  useEffect(() => {
    if (scanState === 'completed' || scanState === 'failed') {
      setShowResults(true)
    }
  }, [scanState])

  const handleRestart = () => {
    reset()
    setShowResults(false)
    launch()
  }

  const noScanYet = !loading && !error && !scan && scanState === 'idle'

  if (loading) return <LoadingSpinner />
  if (error && scanState === 'idle') {
    const isNoScan = error.toLowerCase().includes('no scans found') || error.toLowerCase().includes('no scan')
    if (isNoScan) {
      return (
        <>
          <TopBar title="Latest Scan" breadcrumb="Host" />
          <div className="space-y-7 p-8 animate-slide-up">
            <Link
              to={`/hosts/${hostId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
            >
              <ArrowLeft size={14} />
              Back to Host
            </Link>
            <EmptyScanState hostId={hostId!} onLaunch={launch} />
          </div>
        </>
      )
    }
    // Real error — show error
    return (
      <>
        <TopBar title="Latest Scan" breadcrumb="Host" />
        <div className="p-8">
          <ErrorAlert message={error} />
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleRestart}
              className="flex items-center gap-2 rounded-lg border border-exia-border/50 bg-exia-card px-4 py-2 text-sm text-exia-text-secondary hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </>
    )
  }

  if (scanState !== 'idle' && !showResults) {
    return (
      <>
        <TopBar title="Latest Scan" breadcrumb="Host" subtitle={scanState === 'failed' ? 'Failed' : 'In Progress'} />
        <div className="space-y-7 p-8 animate-slide-up">
          <Link
            to={`/hosts/${hostId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
          >
            <ArrowLeft size={14} />
            Back to Host
          </Link>
          <ScanningState state={scanState} error={scanError} />
        </div>
      </>
    )
  }

  if (noScanYet) {
    return (
      <>
        <TopBar title="Latest Scan" breadcrumb="Host" />
        <div className="space-y-7 p-8 animate-slide-up">
          <Link
            to={`/hosts/${hostId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
          >
            <ArrowLeft size={14} />
            Back to Host
          </Link>
          <EmptyScanState hostId={hostId!} onLaunch={launch} />
        </div>
      </>
    )
  }

  if (!effectiveScan) return null

  const colorized = parsed ? colorizeJson(parsed.rawJson) : ''
  const rawLines = parsed ? parsed.rawJson.split('\n') : []

  return (
    <>
      <TopBar title="Latest Scan" breadcrumb="Host" subtitle={effectiveScan.status} />

      <div className="space-y-7 p-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <Link
            to={`/hosts/${hostId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
          >
            <ArrowLeft size={14} />
            Back to Host
          </Link>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-lg border border-exia-border/50 bg-exia-card px-3 py-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
          >
            <RefreshCw size={12} />
            New Scan
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <MetricCard
            icon={Calendar}
            label="Scan Date"
            value={new Date(effectiveScan.scan_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          />
          <MetricCard
            icon={Activity}
            label="Detected Items"
            value={<span className="text-2xl font-bold tabular-nums text-exia-amber">{effectiveScan.detected_patches_count}</span>}
            accent="text-exia-amber"
          />
          <MetricCard
            icon={Terminal}
            label="Status"
            value={<StatusBadge status={effectiveScan.status} />}
            accent="text-exia-green"
          />
        </div>

        {effectiveScan.status === 'failed' ? (
          <div className="depth-card rounded-xl p-8 text-center">
            <AlertTriangle size={32} className="mx-auto mb-3 text-exia-red/60" />
            <p className="text-sm font-semibold text-exia-red mb-1">Scan failed</p>
            <p className="text-xs text-exia-text-secondary max-w-md mx-auto">
              The Ansible playbook could not complete. The host may be powered off, unreachable, or the credentials may be incorrect.
            </p>
            <button
              onClick={handleRestart}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-exia-border/50 bg-exia-card px-4 py-2 text-xs font-medium text-exia-text-secondary hover:border-exia-cyan/30 hover:text-exia-cyan transition-colors"
            >
              <RefreshCw size={12} />
              Retry Scan
            </button>
          </div>
        ) : (
          <>
            <div className="flex border-b border-exia-border/30">
              {TABS.map((tab) => {
                const TabIcon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                      isActive
                        ? 'border-exia-cyan text-exia-cyan'
                        : 'border-transparent text-exia-text-muted hover:text-exia-text-secondary hover:border-exia-border/40'
                    }`}
                  >
                    <TabIcon size={13} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {activeTab === 'summary' && (
              parsed?.hasInventory && parsed.executionLog.inventory_data ? (
                <InventorySummary data={parsed.executionLog.inventory_data} />
              ) : (
                <div className="depth-card rounded-xl p-8 text-center text-exia-text-muted text-xs">
                  <FileText size={24} className="mx-auto mb-2 opacity-50" />
                  No structured inventory data available in this scan.
                </div>
              )
            )}

            {activeTab === 'packages' && (
              parsed?.hasInventory && parsed.executionLog.inventory_data ? (
                <div className="depth-card rounded-xl p-5">
                  <PackageList inventoryData={parsed.executionLog.inventory_data} />
                </div>
              ) : (
                <div className="depth-card rounded-xl p-8 text-center text-exia-text-muted text-xs">
                  <Package size={24} className="mx-auto mb-2 opacity-50" />
                  No package data found in this scan.
                </div>
              )
            )}

            {activeTab === 'events' && (
              parsed?.hasEvents ? (
                <div className="depth-card rounded-xl p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-exia-text-muted">
                      Event Log ({parsed.executionLog.events?.length ?? 0} events)
                    </p>
                    {parsed.executionLog.ansible_status && (
                      <span className="text-[10px] text-exia-text-secondary font-mono">
                        Status: {parsed.executionLog.ansible_status}
                        {parsed.executionLog.rc != null && ` (rc: ${parsed.executionLog.rc})`}
                      </span>
                    )}
                  </div>
                  <EventTimeline events={parsed.executionLog.events ?? []} />
                </div>
              ) : (
                <div className="depth-card rounded-xl p-8 text-center text-exia-text-muted text-xs">
                  <List size={24} className="mx-auto mb-2 opacity-50" />
                  No event data in this scan.
                </div>
              )
            )}

            {activeTab === 'raw' && (
              <div className="overflow-hidden rounded-xl border border-exia-border/50 shadow-card" style={{ background: '#050a0e' }}>
                <div className="flex items-center justify-between border-b border-exia-border/30 px-4 py-2.5" style={{ background: '#080e14' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-exia-red/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-exia-amber/60" />
                      <span className="h-2.5 w-2.5 rounded-full bg-exia-green/60" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-exia-text-muted ml-1">
                      execution_log.json
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-exia-text-muted">{rawLines.length} lines</span>
                    <CopyButton text={parsed?.rawJson ?? ''} />
                  </div>
                </div>

                <div className="max-h-[520px] overflow-auto terminal-scroll">
                  <table className="w-full border-collapse font-mono text-xs leading-6">
                    <tbody>
                      {rawLines.map((line, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                          <td
                            className="select-none border-r border-exia-border/20 px-4 py-0 text-right text-exia-text-muted"
                            style={{ width: '3.5rem', color: '#334155', userSelect: 'none' }}
                          >
                            {i + 1}
                          </td>
                          <td
                            className="px-5 py-0 whitespace-pre"
                            dangerouslySetInnerHTML={{ __html: colorizeJson(line).replace(/ /g, '&nbsp;') }}
                          />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
