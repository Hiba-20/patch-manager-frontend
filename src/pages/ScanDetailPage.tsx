import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Cpu, Activity, Terminal, Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useLatestScan } from '../hooks/useLatestScan'
import { StatusBadge } from '../components/shared/StatusBadge'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'

/* ── Metric card ─────────────────────────────────────────────── */
interface MetricCardProps {
  icon: typeof Calendar
  label: string
  value: React.ReactNode
  accent?: string
}
function MetricCard({ icon: Icon, label, value, accent = 'text-exia-cyan' }: MetricCardProps) {
  return (
    <div className="relative rounded-xl border border-white/[0.05] bg-exia-card p-5 shadow-card">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-exia-elevated border border-white/[0.05] ${accent}`}>
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

/* ── Copy button ─────────────────────────────────────────────── */
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
      className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
    >
      {copied ? <CheckCircle2 size={12} className="text-exia-green" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

/* ── JSON syntax colorizer (CSS-only, regex-free for safety) ──── */
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

/* ── Main Component ───────────────────────────────────────────── */
export function ScanDetailPage() {
  const { hostId } = useParams<{ hostId: string }>()
  const { data: scan, loading, error } = useLatestScan(hostId)

  if (loading) return <LoadingSpinner />
  if (error)   return <><TopBar title="Latest Scan" breadcrumb="Host" /><div className="p-8"><ErrorAlert message={error} /></div></>
  if (!scan)   return <><TopBar title="Latest Scan" breadcrumb="Host" /><div className="p-8"><ErrorAlert message="No scan data found" /></div></>

  const rawJson = JSON.stringify(scan.execution_log, null, 2)
  const colorized = colorizeJson(rawJson)
  const lines = rawJson.split('\n')

  return (
    <>
      <TopBar title="Latest Scan" breadcrumb="Host" subtitle={scan.status} />

      <div className="space-y-7 p-8 animate-slide-up">

        {/* ── Back link ────────────────────────────────────── */}
        <Link
          to={`/hosts/${hostId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
        >
          <ArrowLeft size={14} />
          Back to Host
        </Link>

        {/* ── Metrics row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <MetricCard
            icon={Calendar}
            label="Scan Date"
            value={new Date(scan.scan_date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            accent="text-exia-cyan"
          />
          <MetricCard
            icon={Cpu}
            label="Detected Patches"
            value={<span className="text-2xl font-bold tabular-nums text-exia-amber">{scan.detected_patches_count}</span>}
            accent="text-exia-amber"
          />
          <MetricCard
            icon={Activity}
            label="Status"
            value={<StatusBadge status={scan.status} />}
            accent="text-exia-green"
          />
        </div>

        {/* ── Execution Log ─────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-3">
            <Terminal size={14} className="text-exia-cyan" />
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-exia-text-secondary">
              Execution Log
            </h2>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>

          {/* Terminal window chrome */}
          <div className="overflow-hidden rounded-xl border border-white/[0.07] shadow-card" style={{ background: '#050a0e' }}>

            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5" style={{ background: '#080e14' }}>
              <div className="flex items-center gap-3">
                {/* Traffic lights */}
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
                <span className="text-[10px] font-mono text-exia-text-muted">{lines.length} lines</span>
                <CopyButton text={rawJson} />
              </div>
            </div>

            {/* Log content */}
            <div className="max-h-[520px] overflow-auto terminal-scroll">
              <table className="w-full border-collapse font-mono text-xs leading-6">
                <tbody>
                  {lines.map((line, i) => {
                    const lineColorized = colorizeJson(line)
                    return (
                      <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                        {/* Line number gutter */}
                        <td
                          className="select-none border-r border-white/[0.04] px-4 py-0 text-right text-exia-text-muted"
                          style={{ width: '3.5rem', color: '#334155', userSelect: 'none' }}
                        >
                          {i + 1}
                        </td>
                        {/* Code */}
                        <td
                          className="px-5 py-0 whitespace-pre"
                          dangerouslySetInnerHTML={{ __html: lineColorized.replace(/ /g, '&nbsp;') }}
                        />
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </section>

      </div>
    </>
  )
}
