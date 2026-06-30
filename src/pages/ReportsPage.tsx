import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Server,
  RefreshCw,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { useToast } from '../components/shared/Toast'
import { DataTable } from '../components/shared/DataTable'
import { ReportViewer } from '../components/reports/ReportViewer'
import { timeAgo } from '../utils/relativeTime'
import type { ColumnDef } from '@tanstack/react-table'
import {
  getComplianceReport,
  getDeploymentHistoryReport,
  getRiskMatrixReport,
  getTopMissingPatchesReport,
  getDeploymentMatrixReport,
  getComplianceDocumentReport,
  getDeploymentDocumentReport,
} from '../api/reports'
import { DeploymentMatrixReport } from '../components/reports/DeploymentMatrixReport'
import type {
  HostComplianceRow,
  DeploymentHistoryRow,
  TopMissingPatchRow,
  HostRiskRow,
  ComplianceDocumentResponse,
  DeploymentDocumentResponse,
} from '../types/report'

type ReportType = 'compliance' | 'deployments' | 'risk' | 'patches' | 'matrix'

const COMPLIANCE_BADGE: Record<string, string> = {
  Compliant: 'bg-green-500/10 text-green-400 border-green-500/25',
  'Partially Compliant': 'bg-amber-400/10 text-amber-400 border-amber-400/25',
  'Non-Compliant': 'bg-red-500/10 text-red-400 border-red-500/25',
  'Never Scanned': 'bg-gray-500/10 text-gray-400 border-gray-500/25',
}

export function ReportsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [activeReport, setActiveReport] = useState<ReportType>('compliance')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [docReport, setDocReport] = useState<ComplianceDocumentResponse | DeploymentDocumentResponse | null>(null)
  const [docLoading, setDocLoading] = useState(false)

  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  const fetchReport = async () => {
    setLoading(true)
    setDocReport(null)
    try {
      let res
      switch (activeReport) {
        case 'compliance':
          res = await getComplianceReport(dateFrom || undefined, dateTo || undefined)
          break
        case 'deployments':
          res = await getDeploymentHistoryReport(dateFrom || undefined, dateTo || undefined)
          break
        case 'risk':
          res = await getRiskMatrixReport()
          break
        case 'patches':
          res = await getTopMissingPatchesReport(100)
          break
        case 'matrix':
          res = await getDeploymentMatrixReport()
          break
      }
      setData(res)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to fetch report')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [activeReport])

  const generateDocument = async () => {
    setDocLoading(true)
    setDocReport(null)
    try {
      let res
      if (activeReport === 'compliance') {
        res = await getComplianceDocumentReport(dateFrom || undefined, dateTo || undefined)
      } else {
        res = await getDeploymentDocumentReport(dateFrom || undefined, dateTo || undefined)
      }
      setDocReport(res)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to generate report document')
    } finally {
      setDocLoading(false)
    }
  }

  const exportCSV = () => {
    if (!data || !data.rows || data.rows.length === 0) {
      toast.error('No data to export')
      return
    }

    const rows = data.rows
    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => headers.map(h => {
        const val = row[h]
        if (Array.isArray(val)) return `"${val.join('; ')}"`
        if (val === null || val === undefined) return ''
        if (typeof val === 'string' && val.includes(',')) return `"${val}"`
        return val
      }).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printReport = () => {
    window.print()
  }

  const renderStats = () => {
    if (!data) return null
    if (activeReport === 'compliance') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Hosts" value={data.total_hosts} icon={Server} color="var(--accent-blue)" />
          <StatCard title="Compliant" value={data.compliant_hosts} icon={CheckCircleIcon} color="var(--accent-green)" />
          <StatCard title="Compliance Rate" value={`${data.fleet_compliance_rate}%`} icon={Activity} color="var(--accent-cyan)" />
        </div>
      )
    }
    if (activeReport === 'deployments') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Deployments" value={data.total_deployments} icon={Server} color="var(--accent-blue)" />
          <StatCard title="Successful" value={data.successful} icon={CheckCircleIcon} color="var(--accent-green)" />
          <StatCard title="Success Rate" value={`${data.success_rate}%`} icon={Activity} color="var(--accent-cyan)" />
        </div>
      )
    }
    if (activeReport === 'risk') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard title="Critical Hosts" value={data.critical_hosts} icon={AlertTriangle} color="var(--accent-red)" />
          <StatCard title="High Risk" value={data.high_risk_hosts} icon={ShieldAlert} color="var(--accent-amber)" />
          <StatCard title="Medium Risk" value={data.medium_risk_hosts} icon={Activity} color="#eab308" />
          <StatCard title="Low Risk / Clean" value={data.low_risk_hosts} icon={CheckCircleIcon} color="var(--accent-green)" />
        </div>
      )
    }
    if (activeReport === 'patches') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <StatCard title="Total Unique Patches Missing" value={data.total_unique_patches} icon={AlertTriangle} color="var(--accent-amber)" />
        </div>
      )
    }
  }

  const columns = useMemo(() => {
    if (activeReport === 'compliance') {
      return [
        { header: 'Hostname', accessorKey: 'hostname' },
        { header: 'OS', accessorKey: 'os_type' },
        {
          header: 'Status',
          accessorKey: 'compliance_status',
          cell: (info: any) => {
            const v = info.getValue() as string
            const cls = COMPLIANCE_BADGE[v] || COMPLIANCE_BADGE['Never Scanned']
            return (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
                {v}
              </span>
            )
          },
        },
        { header: 'Score', accessorKey: 'compliance_score', cell: (info: any) => `${info.getValue()}%` },
        { header: 'Missing', accessorKey: 'total_missing' },
        { header: 'Critical', accessorKey: 'critical_count' },
        { header: 'Last Scan', accessorKey: 'last_scan_at', cell: (info: any) => {
          const val = info.getValue()
          return val ? timeAgo(val) : 'Never'
        }},
      ] as ColumnDef<any>[]
    }
    if (activeReport === 'deployments') {
      return [
        { header: 'Patch Name', accessorKey: 'patch_name' },
        { header: 'Host', accessorKey: 'hostname' },
        { header: 'Status', accessorKey: 'status' },
        { header: 'Started At', accessorKey: 'started_at', cell: (info: any) => {
          const val = info.getValue()
          return val ? timeAgo(val) : '-'
        }},
        { header: 'Duration (s)', accessorKey: 'duration_seconds' },
      ] as ColumnDef<any>[]
    }
    if (activeReport === 'risk') {
      return [
        { header: 'Hostname', accessorKey: 'hostname' },
        { header: 'Risk Level', accessorKey: 'risk_level' },
        { header: 'Risk Score', accessorKey: 'risk_score' },
        { header: 'Critical', accessorKey: 'critical_count' },
        { header: 'High', accessorKey: 'high_count' },
      ] as ColumnDef<any>[]
    }
    if (activeReport === 'patches') {
      return [
        { header: 'KB / Name', accessorKey: 'kb_id' },
        { header: 'Title', accessorKey: 'title' },
        { header: 'Severity', accessorKey: 'severity' },
        { header: 'Affected Hosts', accessorKey: 'affected_hosts' },
      ] as ColumnDef<any>[]
    }
    return [] as ColumnDef<any>[]
  }, [activeReport])

  const showDocView = docReport !== null && (activeReport === 'compliance' || activeReport === 'deployments')

  return (
    <div className="flex h-full flex-col bg-app">
      <TopBar title="Reports" subtitle="WSUS Compliance & Analytics" />

      <main className="flex-1 overflow-auto p-6 terminal-scroll">
        <div className="mx-auto max-w-7xl space-y-6">

          <div className="flex flex-col md:flex-row gap-4 items-end justify-between no-print">
            <div className="flex items-center gap-4 border-b border-theme pb-2 flex-1">
              {[
                { id: 'compliance', label: 'Compliance' },
                { id: 'deployments', label: 'Deployment History' },
                { id: 'risk', label: 'Risk Matrix' },
                { id: 'patches', label: 'Top Missing Patches' },
                { id: 'matrix', label: 'Deployment Matrix' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveReport(t.id as ReportType)}
                  className={`pb-2 text-sm font-medium transition-colors border-b-2 -mb-[9px] ${activeReport === t.id ? 'border-accent-cyan text-primary' : 'border-transparent text-secondary hover:text-primary'}`}
                  style={{ borderColor: activeReport === t.id ? 'var(--accent-cyan)' : 'transparent', color: activeReport === t.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {!showDocView && (
                <button onClick={exportCSV} className="btn-ghost" disabled={loading || !data?.rows?.length}>
                  <Download size={14} /> Export CSV
                </button>
              )}
              {!showDocView && (
                <button onClick={printReport} className="btn-ghost" disabled={loading}>
                  <Printer size={14} /> Print PDF
                </button>
              )}
            </div>
          </div>

          {(activeReport === 'compliance' || activeReport === 'deployments') && (
            <div className="flex gap-4 items-center bg-card p-4 rounded-xl border border-theme no-print">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="input-base py-1 px-2 text-sm w-auto"
                />
                <span className="text-muted">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="input-base py-1 px-2 text-sm w-auto"
                />
              </div>
              <button onClick={fetchReport} className="btn-primary py-1.5 px-3">
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Filter
              </button>
              <button
                onClick={generateDocument}
                disabled={docLoading}
                className="btn-primary py-1.5 px-3"
                style={{ backgroundColor: 'var(--accent-green)' }}
              >
                {docLoading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                {docLoading ? ' Generating...' : ' Generate Report'}
              </button>
            </div>
          )}

          {showDocView && (
            <div className="no-print">
              <button
                onClick={() => setDocReport(null)}
                className="flex items-center gap-1.5 text-xs font-medium mb-4"
                style={{ color: 'var(--accent-cyan)' }}
              >
                <ArrowLeft size={13} /> Back to summary
              </button>
            </div>
          )}

          {showDocView && docReport ? (
            <ReportViewer
              type={activeReport === 'compliance' ? 'compliance' : 'deployment'}
              reportData={docReport}
            />
          ) : (
            <>
              {renderStats()}

              <div className="depth-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-theme flex justify-between items-center">
                  <h2 className="font-semibold text-primary flex items-center gap-2">
                    <FileText size={16} className="text-accent" />
                    Report Data
                  </h2>
                </div>

                <div className="p-0">
                  {activeReport === 'matrix' ? (
                    <DeploymentMatrixReport
                      patches={(data as any)?.patches ?? []}
                      hosts={(data as any)?.hosts ?? []}
                      loading={loading}
                    />
                  ) : (
                    <DataTable
                      columns={columns}
                      data={data?.rows || []}
                      loading={loading}
                      onRowClick={activeReport === 'compliance' ? (row: any) => navigate(`/hosts/${row.host_id}`) : undefined}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) {
  return (
    <div className="depth-card rounded-xl p-4 flex items-center gap-4">
      <div className="p-3 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-medium text-secondary">{title}</p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
      </div>
    </div>
  )
}

function CheckCircleIcon({ size, className, style }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
