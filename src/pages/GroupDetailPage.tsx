import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getGroupDetail, removeHostFromGroup, addHostToGroup, type GroupDetailResponse } from '../api/groups'
import { getHosts } from '../api/hosts'
import { TopBar } from '../components/layout/TopBar'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { useToast } from '../components/shared/Toast'
import { Users, Server, X, ArrowLeft, Plus, Check, Loader2 } from 'lucide-react'
import type { HostResponse } from '../types/host'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [group, setGroup] = useState<GroupDetailResponse | null>(null)
  const [allHosts, setAllHosts] = useState<HostResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    setError(null)
    try {
      const [g, hosts] = await Promise.all([
        getGroupDetail(groupId),
        getHosts(),
      ])
      setGroup(g)
      setAllHosts(hosts)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => { load() }, [load])

  const memberHosts = allHosts.filter((h) => group?.host_ids.includes(h.id))
  const availableHosts = allHosts.filter((h) => !group?.host_ids.includes(h.id))

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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/40 bg-exia-card text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">{group.name}</h2>
            {group.description && (
              <p className="text-sm text-exia-text-muted">{group.description}</p>
            )}
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
                        <span className="text-sm font-medium text-white">{host.hostname}</span>
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

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Add Host to Group</h2>
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
                      <span className="text-sm font-medium text-white">{host.hostname}</span>
                      <span className="text-xs text-exia-text-muted">{host.ip_address}</span>
                    </div>
                    <Check size={14} className="text-exia-cyan opacity-0 group-hover:opacity-100" />
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
