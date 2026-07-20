import { useState, useEffect, useCallback } from 'react'
import {
  Settings,
  Clock,
  Play,
  Terminal,
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Trash2,
  Copy,
  Check,
  Loader2,
  Lock,
} from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { useToast } from '../components/shared/Toast'
import { getSchedulerStatus, triggerScanNow, type SchedulerStatusResponse } from '../api/settings'
import { getInvites, revokeInvite, type InviteResponse } from '../api/invites'
import { toggleMfa } from '../api/auth'
import { GenerateInviteModal } from '../components/invites/GenerateInviteModal'
import { DataTable } from '../components/shared/DataTable'
import { StatusBadge } from '../components/shared/StatusBadge'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import type { ColumnDef } from '@tanstack/react-table'

const TABS = [
  { id: 'scheduler', label: 'Scheduler', icon: Clock },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'invites', label: 'Invites', icon: Users },
  { id: 'about', label: 'About', icon: Terminal },
] as const

export function SettingsPage() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('scheduler')
  const [status, setStatus] = useState<SchedulerStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(false)

  const [invites, setInvites] = useState<InviteResponse[]>([])
  const [invitesLoading, setInvitesLoading] = useState(true)
  const [invitesError, setInvitesError] = useState<string | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [mfaToggling, setMfaToggling] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const data = await getSchedulerStatus()
      setStatus(data)
    } catch {
      toast.error('Failed to fetch settings status')
    } finally {
      setLoading(false)
    }
  }

  const loadInvites = useCallback(async () => {
    setInvitesLoading(true)
    setInvitesError(null)
    try {
      const data = await getInvites()
      setInvites(data)
    } catch (err: unknown) {
      setInvitesError(
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to load invites',
      )
    } finally {
      setInvitesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    loadInvites()
  }, [loadInvites])

  const handleTriggerScan = async () => {
    if (!confirm('This will trigger a compliance scan on all hosts immediately. Continue?')) return
    setTriggering(true)
    try {
      const res = await triggerScanNow()
      toast.success(res.message)
      await fetchStatus()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to trigger scan')
    } finally {
      setTriggering(false)
    }
  }

  const handleRevoke = async (id: string) => {
    setRevoking(id)
    try {
      await revokeInvite(id)
      await loadInvites()
    } catch {
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

  const handleToggleMfa = async () => {
    setMfaToggling(true)
    try {
      const res = await toggleMfa(!mfaEnabled)
      setMfaEnabled(res.mfa_enabled)
      toast.success(res.message)
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || 'Failed to update MFA settings')
    } finally {
      setMfaToggling(false)
    }
  }

  const inviteColumns: ColumnDef<InviteResponse>[] = [
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
    { accessorKey: 'created_by_email', header: 'Created by' },
    {
      accessorKey: 'use_count',
      header: 'Uses',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.use_count}/{row.original.max_uses}</span>
      ),
    },
    {
      accessorKey: 'is_valid',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.is_valid) return <StatusBadge status="Active" />
        if (row.original.use_count >= row.original.max_uses) return <StatusBadge status="Used" />
        return <StatusBadge status="Expired" />
      },
    },
    {
      accessorKey: 'used_by_email',
      header: 'Used by',
      cell: ({ row }) => (
        <span className="text-sm text-exia-text-secondary">{row.original.used_by_email || '\u2014'}</span>
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
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        )
      },
    },
  ]

  return (
    <div className="flex h-full flex-col bg-app">
      <TopBar title="Settings" subtitle="System Configuration" />

      <main className="flex-1 overflow-auto p-6 terminal-scroll">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-1 border-b border-theme mb-6">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-exia-cyan'
                      : 'text-exia-text-muted hover:text-exia-text-secondary'
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-exia-cyan shadow-[0_0_6px_rgba(34,211,238,0.4)]" />
                  )}
                </button>
              )
            })}
          </div>

          {activeTab === 'scheduler' && (
            <div className="space-y-6">
              <div className="depth-card rounded-xl p-6">
                <div className="flex items-center gap-3 border-b border-theme pb-4 mb-4">
                  <div className="p-2 rounded-lg bg-exia-amber/10 text-exia-amber">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Automation & Scheduler</h2>
                    <p className="text-sm text-muted">Background jobs and compliance scans</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-theme">
                      <span className="text-sm text-secondary">Scheduler Status</span>
                      {status?.is_running ? (
                        <span className="badge badge-low"><CheckCircle2 size={12} /> Running</span>
                      ) : (
                        <span className="badge badge-critical"><AlertTriangle size={12} /> Stopped</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-theme">
                      <span className="text-sm text-secondary">Daily Scan Time</span>
                      <span className="text-sm font-mono text-primary">
                        {String(status?.scan_hour || 2).padStart(2, '0')}:{String(status?.scan_minute || 0).padStart(2, '0')} UTC
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-theme">
                      <span className="text-sm text-secondary">Next Scheduled Run</span>
                      <span className="text-sm text-primary">
                        {status?.next_run_at ? new Date(status.next_run_at).toLocaleString() : 'Not scheduled'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center border-l border-theme pl-6">
                    <p className="text-sm text-secondary mb-4">
                      You can manually trigger the daily compliance scan. This will queue Ansible playbooks for all active hosts.
                    </p>
                    <button
                      onClick={handleTriggerScan}
                      disabled={loading || triggering}
                      className="btn-primary w-full justify-center"
                    >
                      <Play size={16} className={triggering ? 'animate-pulse' : ''} />
                      {triggering ? 'Running Scan...' : 'Trigger Scan Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="depth-card rounded-xl p-6">
                <div className="flex items-center gap-3 border-b border-theme pb-4 mb-4">
                  <div className="p-2 rounded-lg bg-exia-cyan/10 text-exia-cyan">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Two-Factor Authentication</h2>
                    <p className="text-sm text-muted">Enhance account security with email-based 2FA</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-surface border border-theme">
                    <div>
                      <p className="text-sm font-medium text-primary">Email MFA</p>
                      <p className="text-xs text-muted mt-0.5">
                        When enabled, a 6-digit code will be sent to your email at each login.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleMfa}
                      disabled={mfaToggling}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        mfaEnabled ? 'bg-exia-cyan' : 'bg-exia-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          mfaEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {mfaEnabled && (
                    <div className="p-3 rounded-lg bg-exia-green/[0.06] border border-exia-green/20">
                      <p className="text-xs text-exia-green">
                        Two-factor authentication is active. You will be prompted for a verification code on your next login.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invites' && (
            <div className="depth-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-exia-text-primary tracking-tight">Invite Links</h2>
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
              {invitesError && <ErrorAlert message={invitesError} />}
              <DataTable
                data={invites}
                columns={inviteColumns}
                loading={invitesLoading}
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
              <GenerateInviteModal
                open={showGenerate}
                onClose={() => setShowGenerate(false)}
                onCreated={loadInvites}
              />
            </div>
          )}

          {activeTab === 'about' && (
            <div className="depth-card rounded-xl p-6">
              <div className="flex items-center gap-3 border-b border-theme pb-4 mb-4">
                <div className="p-2 rounded-lg bg-exia-green/10 text-exia-green">
                  <Terminal size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary">System Information</h2>
                  <p className="text-sm text-muted">Backend health and dependencies</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-surface border border-theme">
                  <p className="text-xs text-muted mb-1">Ansible Runner Version</p>
                  <p className="text-sm font-mono text-primary truncate" title={status?.ansible_version || 'Unknown'}>
                    {status?.ansible_version || 'Unknown / Not detected'}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-surface border border-theme">
                  <p className="text-xs text-muted mb-1">Patch Manager Platform</p>
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    v1.1.0-wsus <Shield size={14} className="text-accent" />
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
