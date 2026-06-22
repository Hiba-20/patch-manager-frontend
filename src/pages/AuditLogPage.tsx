import { useState, useEffect } from 'react'
import { History, LogIn, LogOut, Scan, Shield, UserPlus, Key, CheckCircle, XCircle, type LucideIcon } from 'lucide-react'
import { getAuditLogs, type AuditLogResponse } from '../api/audit-logs'
import { TableSkeleton } from '../components/skeletons/TableSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'

const ACTION_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  LOGIN:            { icon: LogIn,     color: 'text-exia-cyan',   bg: 'bg-exia-cyan/10' },
  LOGOUT:           { icon: LogOut,    color: 'text-exia-green',  bg: 'bg-exia-green/10' },
  SCAN_LAUNCHED:    { icon: Scan,      color: 'text-exia-cyan',   bg: 'bg-exia-cyan/10' },
  PATCH_APPROVED:   { icon: CheckCircle, color: 'text-exia-green', bg: 'bg-exia-green/10' },
  PATCH_DEPLOYED:   { icon: Shield,    color: 'text-exia-amber',  bg: 'bg-exia-amber/10' },
  HOST_REGISTERED:  { icon: UserPlus,  color: 'text-exia-green',  bg: 'bg-exia-green/10' },
  KEY_ROTATED:      { icon: Key,       color: 'text-exia-amber',  bg: 'bg-exia-amber/10' },
}

function ActionIcon({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { icon: Shield, color: 'text-exia-text-secondary', bg: 'bg-exia-elevated' }
  const Icon = cfg.icon
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/40 ${cfg.bg}`}>
      <Icon size={14} className={cfg.color} />
    </div>
  )
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getAuditLogs(100)
      .then(setLogs)
      .catch((e) => setError(e?.response?.data?.detail ?? e?.message ?? 'Failed to load audit logs'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <TableSkeleton rows={10} cols={3} />
  if (error) return <><TopBar title="Audit Log" /><div className="p-8"><ErrorAlert message={error} /></div></>

  return (
    <>
      <TopBar title="Audit Log" subtitle={`${logs.length} events`} />

      <div className="space-y-5 p-8 animate-slide-up">
        <div className="depth-card rounded-xl p-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/20 to-transparent rounded-t-xl" />
          <div className="mb-6 flex items-center gap-2">
            <History size={14} className="text-exia-cyan" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-exia-text-secondary">Event Timeline</span>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-exia-text-muted">
              <History size={24} className="opacity-50" />
              <p className="text-sm">No audit events recorded yet.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-exia-border/30" />
              <div className="space-y-0">
                {logs.map((log, idx) => (
                  <div key={log.id} className="relative flex gap-4 pb-5 last:pb-0">
                    <div className="relative z-10 mt-1">
                      <ActionIcon action={log.action} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wider text-white">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        {log.status && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                            log.status === 'success' ? 'border-exia-green/20 text-exia-green bg-exia-green/10' :
                            log.status === 'failed' ? 'border-exia-red/20 text-exia-red bg-exia-red/10' :
                            'border-exia-border/40 text-exia-text-secondary bg-exia-elevated'
                          }`}>
                            {log.status === 'success' ? <CheckCircle size={10} /> : log.status === 'failed' ? <XCircle size={10} /> : null}
                            {log.status}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="mt-0.5 text-xs text-exia-text-secondary">
                          {JSON.stringify(log.details).slice(0, 120)}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-[10px] text-exia-text-muted">
                        <span>{formatTimestamp(log.timestamp)}</span>
                        {log.ip_address && <span className="font-mono">{log.ip_address}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
