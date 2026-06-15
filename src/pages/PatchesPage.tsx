import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, Bug, Plus, X } from 'lucide-react'
import { DataTable } from '../components/shared/DataTable'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { getPatches, type PatchResponse } from '../api/patches'
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
  const [patches, setPatches] = useState<PatchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getPatches()
      .then(setPatches)
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load patches'))
      .finally(() => setLoading(false))
  }, [])

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
    ],
    [],
  )

  if (loading) return <LoadingSpinner />
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
    </>
  )
}
