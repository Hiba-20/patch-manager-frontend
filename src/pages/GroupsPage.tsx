import { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGroups, createGroup, deleteGroup, type GroupResponse } from '../api/groups'
import { DataTable } from '../components/shared/DataTable'
import { TableSkeleton } from '../components/skeletons/TableSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { useToast } from '../components/shared/Toast'
import { Users, Plus, Trash2, ChevronRight, X } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

export function GroupsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<GroupResponse | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getGroups()
      setGroups(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createGroup(newName.trim(), newDesc.trim() || undefined)
      toast.success('Group created')
      setShowCreateModal(false)
      setNewName('')
      setNewDesc('')
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create group')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteGroup(deleteTarget.id)
      toast.success('Group deleted')
      setDeleteTarget(null)
      load()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete group')
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo<ColumnDef<GroupResponse>[]>(() => [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-exia-border/40 text-exia-text-secondary">
            <Users size={14} />
          </div>
          <div>
            <span className="font-semibold text-white">{row.original.name}</span>
            {row.original.description && (
              <p className="text-[11px] text-exia-text-muted mt-0.5">{row.original.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Hosts',
      accessorKey: 'host_count',
      cell: ({ getValue }) => (
        <span className="rounded-md border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-xs font-medium text-exia-text-secondary">
          {(getValue() as number)} machines
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDeleteTarget(row.original)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-exia-text-muted transition-colors hover:bg-exia-red/10 hover:text-exia-red"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ),
    },
    {
      id: 'chevron',
      header: '',
      cell: () => (
        <ChevronRight size={16} className="ml-auto text-exia-text-muted opacity-0 group-hover:opacity-100 group-hover:text-exia-cyan transition-all" />
      ),
    },
  ], [])

  if (loading) return <TableSkeleton rows={5} cols={3} />
  if (error) return <><TopBar title="Groups" /><div className="p-8"><ErrorAlert message={error} /></div></>

  return (
    <>
      <TopBar title="Groups" subtitle={`${groups.length} groups`} />

      <div className="space-y-5 p-8 animate-slide-up">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            >
              <Plus size={15} />
              Create Group
            </button>
          </div>
        </div>

        <DataTable
          data={groups}
          columns={columns}
          onRowClick={(group) => navigate(`/groups/${group.id}`)}
          enableSearch={false}
          enableSorting
          pageSize={25}
          emptyState={
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-exia-border/40 bg-exia-elevated text-exia-text-muted">
                <Users size={24} />
              </div>
              <p className="text-sm font-medium text-exia-text-secondary">No groups yet</p>
              <p className="text-xs text-exia-text-muted">Create groups to organize your hosts</p>
            </div>
          }
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Create Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-exia-text-muted hover:text-exia-text-secondary transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Production Web Servers"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Windows Server 2022 or Ubuntu 22.04 machines"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Hosts in this group will not be removed, only the grouping.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
