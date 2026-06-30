import { useState, useMemo } from 'react'
import {
  FileText,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Server,
  Activity,
  MessageSquare,
} from 'lucide-react'
import { timeAgo } from '../../utils/relativeTime'
import type {
  ComplianceDocumentResponse,
  DeploymentDocumentResponse,
  DocHost,
  DocDeployment,
  DocPatchSummary,
  DocByPatch,
  DocByHost,
  DocFailureAnalysis,
} from '../../types/report'

type ReportViewerProps = {
  type: 'compliance' | 'deployment'
  reportData: ComplianceDocumentResponse | DeploymentDocumentResponse
}

const STATUS_BADGE: Record<string, string> = {
  SUCCESS: 'bg-green-500/10 text-green-400 border-green-500/25',
  FAILED: 'bg-red-500/10 text-red-400 border-red-500/25',
  PENDING: 'bg-amber-400/10 text-amber-400 border-amber-400/25',
  APPROVED: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/25',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  REJECTED: 'bg-red-500/10 text-red-400 border-red-500/25',
  CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/25',
}

const COMPLIANCE_STATUS_BADGE: Record<string, string> = {
  Compliant: 'bg-green-500/10 text-green-400 border-green-500/25',
  'Partially Compliant': 'bg-amber-400/10 text-amber-400 border-amber-400/25',
  'Non-Compliant': 'bg-red-500/10 text-red-400 border-red-500/25',
  'Never Scanned': 'bg-gray-500/10 text-gray-400 border-gray-500/25',
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = String(val)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCSV(filename: string, headers: string[], rows: Record<string, unknown>[]) {
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => csvEscape(r[h])).join(',')),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function SuccessRateBadge({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-green-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-semibold ${color}`}>{rate}%</span>
}

export function ReportViewer({ type, reportData }: ReportViewerProps) {
  const { meta, summary, findings } = reportData

  const [expandedHosts, setExpandedHosts] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<string>('started_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleHost = (id: string) => {
    setExpandedHosts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (key: string) => {
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'))
    setSortKey(key)
  }

  const isCompliance = type === 'compliance'
  const cData = isCompliance ? (reportData as ComplianceDocumentResponse) : null
  const dData = isCompliance ? null : (reportData as DeploymentDocumentResponse)

  const sortedDeployments = useMemo(() => {
    if (!dData) return []
    const arr = [...dData.deployments]
    arr.sort((a, b) => {
      const aVal = (a as any)[sortKey]
      const bVal = (b as any)[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    })
    return arr
  }, [dData, sortKey, sortDir])

  const printReport = () => window.print()

  const exportReportCSV = () => {
    if (isCompliance && cData) {
      const headers = ['hostname', 'os', 'compliance_score', 'status', 'last_scan', 'total_missing', 'critical_missing']
      const rows = cData.hosts.map(h => ({
        hostname: h.hostname,
        os: h.os,
        compliance_score: h.compliance_score,
        status: h.status,
        last_scan: h.last_scan || '',
        total_missing: h.missing_patches.length,
        critical_missing: h.missing_patches.filter(p => p.severity === 'Critical').length,
      }))
      downloadCSV(`compliance_report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
    } else if (dData) {
      const headers = ['deployment_id', 'kb_id', 'hostname', 'status', 'started_at', 'duration_minutes', 'error_message']
      const rows = dData.deployments.map(d => ({
        deployment_id: d.deployment_id,
        kb_id: d.kb_id,
        hostname: d.hostname,
        status: d.status,
        started_at: d.started_at || '',
        duration_minutes: d.duration_minutes ?? '',
        error_message: d.error_message || '',
      }))
      downloadCSV(`deployment_report_${new Date().toISOString().split('T')[0]}.csv`, headers, rows)
    }
  }

  return (
    <div className="report-container">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .report-container, .report-container * { visibility: visible; }
          .report-container { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .depth-card { break-inside: avoid; page-break-inside: avoid; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      {/* ── REPORT HEADER ── */}
      <div className="flex items-start justify-between mb-6 no-print">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{meta.title}</h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Generated: {new Date(meta.generated_at).toLocaleString()} by {meta.generated_by}
            {meta.date_range?.from && `  |  Period: ${meta.date_range.from} to ${meta.date_range.to}`}
            <span className="ml-3 font-mono" style={{ color: 'var(--text-muted)' }}>ID: {meta.report_id.slice(0, 8)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportReportCSV} className="btn-ghost flex items-center gap-1.5 text-xs">
            <Download size={13} /> Export CSV
          </button>
          <button onClick={printReport} className="btn-ghost flex items-center gap-1.5 text-xs">
            <Printer size={13} /> Print
          </button>
        </div>
      </div>

      {/* ── EXECUTIVE SUMMARY ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {isCompliance ? (
          <>
            <SummaryCard icon={Server} label="Total Hosts" value={summary.total_hosts} color="var(--accent-blue)" />
            <SummaryCard icon={CheckCircle2} label="Compliant" value={summary.compliant_hosts} color="var(--accent-green)" />
            <SummaryCard icon={AlertTriangle} label="Partially Compliant" value={summary.partial_hosts} color="var(--accent-amber)" />
            <SummaryCard icon={XCircle} label="Non-Compliant" value={summary.non_compliant_hosts} color="var(--accent-red)" />
            <SummaryCard icon={Activity} label="Rate" value={`${summary.compliance_rate}%`} color="var(--accent-cyan)" />
          </>
        ) : (
          <>
            <SummaryCard icon={Server} label="Total Deployments" value={summary.total_deployments} color="var(--accent-blue)" />
            <SummaryCard icon={CheckCircle2} label="Successful" value={summary.successful} color="var(--accent-green)" />
            <SummaryCard icon={XCircle} label="Failed" value={summary.failed} color="var(--accent-red)" />
            <SummaryCard icon={Clock} label="Avg Duration" value={`${summary.avg_deployment_duration_minutes}m`} color="var(--accent-amber)" />
            <SummaryCard icon={Activity} label="Success Rate" value={`${summary.success_rate}%`} color="var(--accent-cyan)" />
          </>
        )}
      </div>

      {/* ── KEY FINDINGS ── */}
      {findings.length > 0 && (
        <div
          className="rounded-xl border p-4 mb-8"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-amber) 10%, var(--card))',
            borderLeft: '3px solid var(--accent-amber)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} />
            Key Findings
          </h3>
          <ul className="space-y-1">
            {findings.map((f, i) => (
              <li key={i} className="text-xs flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--accent-amber)' }}>⚠</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── HOST BREAKDOWN (Compliance) ── */}
      {isCompliance && cData && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
            Host Compliance Details
          </h3>
          <div className="space-y-2">
            {cData.hosts.map(h => (
              <HostCard key={h.host_id} host={h} expanded={expandedHosts.has(h.host_id)} onToggle={() => toggleHost(h.host_id)} />
            ))}
          </div>
        </div>
      )}

      {/* ── DEPLOYMENT TABLE (Deployment) ── */}
      {!isCompliance && dData && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
            All Deployments
          </h3>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--card-raised)' }}>
                  {[
                    { key: 'kb_id', label: 'KB ID' },
                    { key: 'title', label: 'Title' },
                    { key: 'severity', label: 'Severity' },
                    { key: 'hostname', label: 'Host' },
                    { key: 'status', label: 'Status' },
                    { key: 'started_at', label: 'Started' },
                    { key: 'duration_minutes', label: 'Duration' },
                    { key: 'error_message', label: 'Error' },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:opacity-80"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {col.label}
                      {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedDeployments.map(d => (
                  <tr key={d.deployment_id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{d.kb_id}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>{d.title}</td>
                    <td className="px-3 py-2">{d.severity ? <SeverityBadge severity={d.severity} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{d.hostname}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[d.status] || ''}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{d.started_at ? timeAgo(d.started_at) : '—'}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{d.duration_minutes != null ? `${d.duration_minutes}m` : '—'}</td>
                    <td className="px-3 py-2 max-w-[160px]" title={d.error_message || ''}>
                      <span className="truncate block" style={{ color: d.error_message ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                        {d.error_message ? d.error_message.length > 40 ? d.error_message.slice(0, 40) + '…' : d.error_message : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PATCH ANALYSIS ── */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
          {isCompliance ? 'Missing Patches Summary' : 'Analysis by Patch'}
        </h3>
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ backgroundColor: 'var(--card-raised)' }}>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>KB ID</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Severity</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Hosts Affected</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Success</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Failed</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rate</th>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {(isCompliance ? cData?.patch_summary ?? [] : dData?.by_patch ?? []).map((p: DocPatchSummary | DocByPatch) => (
                <tr key={p.kb_id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{p.kb_id}</td>
                  <td className="px-3 py-2">{'severity' in p && p.severity ? <SeverityBadge severity={p.severity} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
                    {'affected_hosts' in p ? (p as DocPatchSummary).affected_hosts.length : 'hosts_attempted' in p ? (p as DocByPatch).hosts_attempted.length : 0}
                  </td>
                  <td className="px-3 py-2 text-right" style={{ color: 'var(--accent-green)' }}>{'deployed_count' in p ? (p as DocPatchSummary).deployed_count : (p as DocByPatch).success}</td>
                  <td className="px-3 py-2 text-right" style={{ color: 'var(--accent-red)' }}>{'failed_count' in p ? (p as DocPatchSummary).failed_count : (p as DocByPatch).failed}</td>
                  <td className="px-3 py-2 text-right"><SuccessRateBadge rate={p.success_rate} /></td>
                  <td className="px-3 py-2 max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>
                    <span className="truncate block">{p.recommendation}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── HOST ANALYSIS (Deployment) ── */}
      {!isCompliance && dData && dData.by_host.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
            Analysis by Host
          </h3>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--card-raised)' }}>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Hostname</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Total</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Success</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Failed</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Rate</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {dData.by_host.map(h => (
                  <tr key={h.hostname} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{h.hostname}</td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--text-primary)' }}>{h.total_deployments}</td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--accent-green)' }}>{h.successful}</td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--accent-red)' }}>{h.failed}</td>
                    <td className="px-3 py-2 text-right"><SuccessRateBadge rate={h.success_rate} /></td>
                    <td className="px-3 py-2 max-w-[200px]" style={{ color: 'var(--text-secondary)' }}>{h.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FAILURE ANALYSIS (Compliance) ── */}
      {isCompliance && cData && cData.failure_analysis.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 pb-2" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}>
            Failed Deployments
          </h3>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border-subtle)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--card-raised)' }}>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>KB ID</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Host</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Failed At</th>
                  <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Attempt #</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {cData.failure_analysis.map(f => (
                  <tr key={f.deployment_id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{f.kb_id}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>{f.hostname}</td>
                    <td className="px-3 py-2" style={{ color: 'var(--text-muted)' }}>{f.failed_at ? timeAgo(f.failed_at) : '—'}</td>
                    <td className="px-3 py-2 text-right" style={{ color: 'var(--text-muted)' }}>{f.attempt_number}</td>
                    <td className="px-3 py-2 max-w-[240px]" style={{ color: 'var(--accent-red)' }}>
                      <span className="truncate block" title={f.error_message || ''}>{f.error_message || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="depth-card rounded-xl p-3 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-400 border-red-500/25',
    High: 'bg-amber-400/10 text-amber-400 border-amber-400/25',
    Medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/25',
    Low: 'bg-green-500/10 text-green-400 border-green-500/25',
  }
  const cls = cfg[severity] || 'bg-gray-500/10 text-gray-400 border-gray-500/25'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
      {severity === 'Critical' && <AlertTriangle size={9} />}
      {severity}
    </span>
  )
}

function HostCard({ host, expanded, onToggle }: { host: DocHost; expanded: boolean; onToggle: () => void }) {
  const badgeCls = COMPLIANCE_STATUS_BADGE[host.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/25'
  return (
    <div className="depth-card rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left transition-colors hover:opacity-80"
        style={{ backgroundColor: 'var(--card-raised)' }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {expanded ? <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
          <div className="min-w-0">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{host.hostname}</span>
            <span className="ml-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>{host.os}</span>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeCls}`}>
            {host.status}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Score: <strong style={{ color: host.compliance_score >= 80 ? 'var(--accent-green)' : host.compliance_score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>{host.compliance_score}%</strong></span>
          <span>Last scan: {host.last_scan ? timeAgo(host.last_scan) : 'Never'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Missing Patches */}
          {host.missing_patches.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Missing Patches</p>
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border-subtle)' }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--card-raised)' }}>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>KB ID</th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Title</th>
                      <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Severity</th>
                      <th className="px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Days Missing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {host.missing_patches.map(p => (
                      <tr key={p.kb_id} className="border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                        <td className="px-2 py-1.5 font-medium" style={{ color: 'var(--text-primary)' }}>{p.kb_id}</td>
                        <td className="px-2 py-1.5 max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }} title={p.title}>{p.title}</td>
                        <td className="px-2 py-1.5"><SeverityBadge severity={p.severity} /></td>
                        <td className="px-2 py-1.5 text-right" style={{ color: 'var(--text-muted)' }}>{p.days_missing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span>Failed deployments: <strong style={{ color: 'var(--accent-red)' }}>{host.failed_deployments_count}</strong></span>
          </div>

          {/* Recommendations */}
          {host.recommendations.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {host.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <CheckCircle2 size={11} style={{ color: 'var(--accent-green)' }} className="mt-0.5 shrink-0" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
