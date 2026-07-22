import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getGroupDetail,
  removeHostFromGroup,
  addHostToGroup,
  updateGroup,
  deployToGroup,
  type GroupDetailResponse,
} from '../api/groups'
import { getHosts } from '../api/hosts'
import { getPatches, type PatchResponse } from '../api/patches'
import { TopBar } from '../components/layout/TopBar'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { useToast } from '../components/shared/Toast'
import {
  Users, Server, X, ArrowLeft, Plus, Check, Loader2,
  Pencil, Rocket, Calendar, ChevronDown,
} from 'lucide-react'
import type { HostResponse } from '../types/host'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [allHosts, setAllHosts] = useState<HostResponse[]>([])
  const [allPatches, setAllPatches] = useState<PatchResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const [showDeployModal, setShowDeployModal] = useState(false)
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null)
  const [patchSearch, setPatchSearch] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [deploying, setDeploying] = useState(false)

  const load = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    try {
      const [g, hosts, patches] = await Promise.all([
        getGroupDetail(groupId),
        getHosts(),
        getPatches(),
      ])
      setGroup(g)
      setAllHosts(hosts)
      setAllPatches(patches)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => { load() }, [load])

  const memberHosts = allHosts.filter((h) => group?.host_ids.includes(h.id))
  const availableHosts = allHosts.filter((h) => !group?.host_ids.includes(h.id))
  const filteredPatches = allPatches.filter(
    (p) => !patchSearch || p.name.toLowerCase().includes(patchSearch.toLowerCase()),
  )

  const handleRemove = async (hostId: string) => {
    if (!group) return
    setRemoving(hostId)
    try {
      await removeHostFromGroup(group.id, hostId)
      setGroup((prev) => prev ? { ...prev, host_ids: prev.host_ids.filter((id) => id !== hostId) } : prev)
      toast.success('Host removed from group')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove host')
    } finally {
      setRemoving(null)
    }
  }

  const handleAdd = async (hostId: string) => {
    if (!group) return
    try {
      await addHostToGroup(group.id, hostId)
      setGroup((prev) => prev ? { ...prev, host_ids: [...prev.host_ids, hostId] } : prev)
      toast.success('Host added to group')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to add host')
    }
  }

  const handleEditOpen = () => {
    if (!group) return
    setEditName(group.name)
    setEditDescription(group.description || '')
    setShowEditModal(true)
  }

  const handleEditSave = async () => {
    if (!group || !editName.trim()) return
    setSaving(true)
    try {
      const updated = await updateGroup(group.id, { name: editName.trim(), description: editDescription.trim() || undefined })
      setGroup((prev) => prev ? { ...prev, name: updated.name, description: updated.description } : prev)
      toast.success('Group updated')
      setShowEditModal(false)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        || (e instanceof Error ? e.message : 'Failed to update group')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeploy = async () => {
    if (!group || !selectedPatchId) return
    setDeploying(true)
    try {
      const scheduled_at = scheduledDate && scheduledTime
        ? `${scheduledDate}T${scheduledTime}:00`
        : undefined
      const res = await deployToGroup(group.id, { patch_id: selectedPatchId, scheduled_at })
      toast.success(res.message)
      setShowDeployModal(false)
      setSelectedPatchId(null)
      setPatchSearch('')
      setScheduledDate('')
      setScheduledTime('')
    } catch (e: unknown) {
      toast.error(
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          || 'Deployment failed',
      )
    } finally {
      setDeploying(false)
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Loading..." breadcrumb="Groups" />
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin text-exia-cyan" />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <TopBar title="Error" breadcrumb="Groups" />
        <div className="p-8"><ErrorAlert message={error} /></div>
      </>
    )
  }

  if (!group) return null

  return (
    <>
      <TopBar title={group.name} subtitle={`${group.host_ids.length} hosts`} breadcrumb="Groups" />

      <div className="space-y-6 p-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/groups')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/40 bg-exia-card text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
            >
              <ArrowLeft size={15} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-exia-text-primary">{group.name}</h2>
              {group.description && (
                <p className="text-sm text-exia-text-muted">{group.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditOpen}
              className="flex items-center gap-2 rounded-lg border border-exia-border/40 px-3 py-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              onClick={() => setShowDeployModal(true)}
              disabled={group.host_ids.length === 0}
              className="flex items-center gap-2 rounded-lg bg-exia-green px-3 py-1.5 text-xs font-semibold text-black transition-all hover:bg-exia-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Rocket size={13} />
              Deploy Patch
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-exia-text-secondary uppercase tracking-wider">
            Members ({group.host_ids.length})
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={availableHosts.length === 0}
            className="flex items-center gap-2 rounded-lg bg-exia-cyan px-3 py-1.5 text-xs font-semibold text-black transition-all hover:bg-exia-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={13} />
            Add Host
          </button>
        </div>

        {memberHosts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-exia-border/40 bg-exia-elevated text-exia-text-muted">
              <Server size={24} />
            </div>
            <p className="text-sm font-medium text-exia-text-secondary">No hosts in this group</p>
            <p className="text-xs text-exia-text-muted">Add hosts to organize them for bulk operations</p>
          </div>
        ) : (
          <div className="rounded-xl border border-exia-border/40 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-exia-border/30 bg-exia-elevated/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Hostname</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">IP Address</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">OS</th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-exia-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {memberHosts.map((host) => (
                  <tr
                    key={host.id}
                    className="group border-b border-exia-border/20 transition-colors hover:bg-exia-elevated/30 cursor-pointer"
                    onClick={() => navigate(`/hosts/${host.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Server size={13} className="text-exia-text-muted" />
                        <span className="text-sm font-medium text-exia-text-primary">{host.hostname}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-exia-text-secondary">{host.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[11px] font-medium capitalize text-exia-text-secondary">
                        {host.os_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemove(host.id) }}
                        disabled={removing === host.id}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-exia-text-muted transition-colors hover:bg-exia-red/10 hover:text-exia-red disabled:opacity-50"
                      >
                        {removing === host.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <X size={12} />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-exia-text-primary">Edit Group</h2>
              <button onClick={() => setShowEditModal(false)} className="text-exia-text-muted hover:text-exia-text-secondary transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={saving || !editName.trim()}
                className="rounded-lg bg-exia-cyan px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving</span>
                ) : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowDeployModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-exia-text-primary">Deploy Patch to Group</h2>
              <button onClick={() => setShowDeployModal(false)} className="text-exia-text-muted hover:text-exia-text-secondary transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Search Patch</label>
              <input
                type="text"
                value={patchSearch}
                onChange={(e) => setPatchSearch(e.target.value)}
                placeholder="Type to search patches..."
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 mb-4 border border-exia-border/30 rounded-lg p-1">
              {filteredPatches.length === 0 ? (
                <p className="text-sm text-exia-text-muted py-4 text-center">No patches found</p>
              ) : (
                filteredPatches.map((patch) => (
                  <button
                    key={patch.id}
                    onClick={() => setSelectedPatchId(patch.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedPatchId === patch.id
                        ? 'bg-exia-cyan/10 border border-exia-cyan/30'
                        : 'hover:bg-exia-elevated border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-exia-text-primary truncate">{patch.name}</span>
                      {patch.severity && (
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          patch.severity === 'Critical' ? 'bg-exia-red/10 text-exia-red' :
                          patch.severity === 'High' ? 'bg-exia-amber/10 text-exia-amber' :
                          'bg-exia-cyan/10 text-exia-cyan'
                        }`}>
                          {patch.severity}
                        </span>
                      )}
                    </div>
                    {selectedPatchId === patch.id && <Check size={14} className="text-exia-cyan shrink-0" />}
                  </button>
                ))
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Schedule Date (optional)</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-exia-text-secondary mb-1.5">Time (optional)</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDeployModal(false); setSelectedPatchId(null); setPatchSearch('') }}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Cancel
              </button>
              <button
                onClick={handleDeploy}
                disabled={deploying || !selectedPatchId}
                className="flex items-center gap-2 rounded-lg bg-exia-green px-4 py-2 text-sm font-semibold text-black transition-all hover:bg-exia-green/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deploying ? (
                  <><Loader2 size={14} className="animate-spin" /> Deploying</>
                ) : (
                  <><Rocket size={14} /> Deploy to {group?.host_ids.length || 0} host(s)</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-exia-text-primary">Add Host to Group</h2>
              <button onClick={() => setShowAddModal(false)} className="text-exia-text-muted hover:text-exia-text-secondary transition-colors">
                <X size={16} />
              </button>
            </div>

            {availableHosts.length === 0 ? (
              <p className="text-sm text-exia-text-muted py-4 text-center">All hosts are already in this group</p>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-1">
                {availableHosts.map((host) => (
                  <button
                    key={host.id}
                    onClick={() => { handleAdd(host.id); setShowAddModal(false) }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-exia-elevated text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Server size={13} className="text-exia-text-muted" />
                      <span className="text-sm font-medium text-exia-text-primary">{host.hostname}</span>
                      <span className="text-xs text-exia-text-muted">{host.ip_address}</span>
                    </div>
                    <Check size={14} className="text-exia-cyan" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-exia-border/40 px-4 py-2 text-sm font-medium text-exia-text-secondary transition-colors hover:bg-exia-elevated"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
