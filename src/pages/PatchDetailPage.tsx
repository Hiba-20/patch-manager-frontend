import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Shield, Bug, Calendar, Server, Package } from 'lucide-react'
import { getPatch, getDeployments, type PatchResponse, type DeploymentResponse } from '../api/patches'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared/StatusBadge'
import { PatchDetailSkeleton } from '../components/skeletons/PatchDetailSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import type { ColumnDef } from '@tanstack/react-table'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-exia-border/20 last:border-0">
      <span className="text-xs text-exia-text-secondary">{label}</span>
      <div className="text-sm font-medium text-white text-right">{value}</div>
    </div>
  )
}

export function PatchDetailPage() {
  const { patchId } = useParams<{ patchId: string }>()
  const [patch, setPatch] = useState<PatchResponse | null>(null)
  const [deployments, setDeployments] = useState<DeploymentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!patchId) return
    setLoading(true)
    Promise.all([getPatch(patchId), getDeployments()])
      .then(([p, d]) => {
        setPatch(p)
        setDeployments(d.filter((dep) => dep.patch_id === patchId))
      })
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load patch'))
      .finally(() => setLoading(false))
  }, [patchId])

  const depColumns = useMemo<ColumnDef<DeploymentResponse>[]>(
    () => [
      { header: 'Host', accessorKey: 'hostname', cell: ({ getValue }) => <span className="font-medium text-white">{getValue() as string}</span> },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
      },
      {
        header: 'Scheduled',
        accessorKey: 'scheduled_at',
        cell: ({ getValue }) => {
          const d = getValue() as string | null
          return d ? (
            <span className="text-xs text-exia-text-muted">{new Date(d).toLocaleDateString()}</span>
          ) : (
            <span className="text-exia-text-muted">\u2014</span>
          )
        },
      },
      {
        header: 'Started',
        accessorKey: 'started_at',
        cell: ({ getValue }) => {
          const d = getValue() as string | null
          return d ? (
            <span className="text-xs text-exia-text-muted">{new Date(d).toLocaleDateString()}</span>
          ) : (
            <span className="text-exia-text-muted">\u2014</span>
          )
        },
      },
    ],
    [],
  )

  if (loading) return <PatchDetailSkeleton />
  if (error) return <><TopBar title="Patch Detail" /><div className="p-8"><ErrorAlert message={error} /></div></>
  if (!patch) return <><TopBar title="Patch Detail" /><div className="p-8"><ErrorAlert message="Patch not found" /></div></>

  return (
    <>
      <TopBar title={patch.name} breadcrumb="Patches" />

      <div className="space-y-8 p-8 animate-slide-up">
        <Link
          to="/patches"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:text-exia-cyan"
        >
          <ArrowLeft size={14} />
          Back to Patches
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="depth-card depth-card-hover rounded-xl p-5 lg:col-span-2">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-cyan/40 via-exia-cyan/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">Patch Information</p>
            <InfoRow label="Name" value={<span className="text-white">{patch.name}</span>} />
            <InfoRow label="Version" value={<span className="font-mono text-exia-cyan">{patch.version}</span>} />
            <InfoRow label="Vendor" value={<span>{patch.vendor || '\u2014'}</span>} />
            <InfoRow label="OS Type" value={<span className="capitalize">{patch.os_type.replace('_', ' ').toLowerCase()}</span>} />
            <InfoRow label="Severity" value={<span className={`font-semibold uppercase text-xs ${
              patch.severity === 'Critical' ? 'text-exia-red' : patch.severity === 'High' ? 'text-exia-amber' : 'text-exia-text-secondary'
            }`}>{patch.severity || '\u2014'}</span>} />
            <InfoRow label="Created" value={<span className="text-xs">{new Date(patch.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>} />
          </div>

          <div className="depth-card depth-card-hover rounded-xl p-5">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-red/30 via-exia-red/10 to-transparent rounded-t-xl" />
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">CVE References</p>
            {patch.cve_references && patch.cve_references.length > 0 ? (
              <div className="space-y-2">
                {patch.cve_references.map((cve) => (
                  <div
                    key={cve}
                    className="flex items-center gap-2 rounded-lg border border-exia-border/40 bg-exia-elevated px-3 py-2"
                  >
                    <Bug size={12} className="text-exia-red flex-shrink-0" />
                    <span className="font-mono text-xs text-exia-text-secondary">{cve}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-exia-text-muted text-xs">
                <Shield size={20} className="mb-2 opacity-50" />
                No CVEs recorded
              </div>
            )}
          </div>
        </div>

        <section>
          <div className="mb-5 flex items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">Deployments</h2>
            <span className="rounded-full border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[10px] font-semibold text-exia-text-muted">{deployments.length}</span>
            <div className="flex-1 h-px bg-exia-border/20" />
          </div>
          <DataTable
            data={deployments}
            columns={depColumns}
            enableSorting
            pageSize={10}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
                <Package size={20} className="opacity-50" />
                <p className="text-sm">No deployments for this patch yet.</p>
              </div>
            }
          />
        </section>
      </div>
    </>
  )
}
