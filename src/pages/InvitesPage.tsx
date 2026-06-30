import { useState, useEffect, useCallback } from 'react'
import { UserPlus, Trash2, Shield, Copy, Check } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared/StatusBadge'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { GenerateInviteModal } from '../components/invites/GenerateInviteModal'
import { getInvites, revokeInvite, type InviteResponse } from '../api/invites'
import type { ColumnDef } from '@tanstack/react-table'

export function InvitesPage() {
  const [invites, setInvites] = useState<InviteResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getInvites()
      setInvites(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to load invites'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleRevoke = async (id: string) => {
    setRevoking(id)
    try {
      await revokeInvite(id)
      load()
    } catch {
      // handled
    } finally {
      setRevoking(null)
    }
  }

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const columns: ColumnDef<InviteResponse>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => {
        const isCopied = copiedId === row.original.id
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-exia-text-secondary truncate max-w-[160px]">
              {row.original.code}
            </span>
            <button
              onClick={() => handleCopyCode(row.original.code, row.original.id)}
              className="flex h-6 w-6 items-center justify-center rounded text-exia-text-muted hover:text-exia-cyan hover:bg-exia-cyan/[0.08] transition-colors flex-shrink-0"
            >
              {isCopied ? <Check size={12} className="text-exia-green" /> : <Copy size={12} />}
            </button>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_by_email',
      header: 'Created by',
    },
    {
      accessorKey: 'use_count',
      header: 'Uses',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.use_count}/{row.original.max_uses}
        </span>
      ),
    },
    {
      accessorKey: 'is_valid',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.is_valid) {
          return <StatusBadge status="Active" />
        }
        if (row.original.use_count >= row.original.max_uses) {
          return <StatusBadge status="Used" />
        }
        return <StatusBadge status="Expired" />
      },
    },
    {
      accessorKey: 'used_by_email',
      header: 'Used by',
      cell: ({ row }) => (
        <span className="text-sm text-exia-text-secondary">
          {row.original.used_by_email || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'expires_at',
      header: 'Expires',
      cell: ({ row }) => {
        const d = new Date(row.original.expires_at)
        return (
          <span className="text-sm text-exia-text-secondary">
            {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        if (!row.original.is_valid) return null
        return (
          <button
            onClick={() => handleRevoke(row.original.id)}
            disabled={revoking === row.original.id}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-exia-text-muted hover:text-exia-red hover:bg-exia-red/[0.08] transition-colors disabled:opacity-40"
          >
            {revoking === row.original.id ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        )
      },
    },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Invites" subtitle="Admin invitations" />

      <div className="flex-1 p-6 space-y-6">
        <div className="depth-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Invite Links</h2>
              <p className="mt-1 text-xs text-exia-text-secondary">
                Generate and manage invitation links for new administrators
              </p>
            </div>
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 rounded-lg bg-exia-cyan px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            >
              <UserPlus size={15} />
              Generate Invite
            </button>
          </div>

          {error && <ErrorAlert message={error} />}

          <DataTable
            data={invites}
            columns={columns}
            loading={loading}
            enableSearch
            searchPlaceholder="Search invites..."
            pageSize={10}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-8">
                <Shield size={28} className="text-exia-text-muted opacity-40" />
                <p className="text-sm font-medium text-exia-text-secondary">No invites yet</p>
                <p className="text-xs text-exia-text-muted">
                  Generate an invite link to add a new administrator
                </p>
              </div>
            }
          />
        </div>
      </div>

      <GenerateInviteModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onCreated={load}
      />
    </div>
  )
}
