import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertTriangle, CheckCircle2, Info, ServerCrash, Shield, RefreshCw } from 'lucide-react'
import { getDashboardStats } from '../../api/dashboard'
import { getDeployments } from '../../api/patches'
import { getHosts } from '../../api/hosts'

const STORAGE_KEY = 'exia-notifications-read'

interface Notification {
  id: string
  level: 'critical' | 'warning' | 'info'
  title: string
  description: string
  link?: string
  timestamp: Date
}

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch {}
  return new Set()
}

function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])) } catch {}
}

interface Props { open: boolean; onClose: () => void }

export function NotificationsPanel({ open, onClose }: Props) {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds)
  const [loading, setLoading] = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const [stats, deployments, hosts] = await Promise.allSettled([
        getDashboardStats(),
        getDeployments(),
        getHosts(),
      ])

      const alerts: Notification[] = []

      // Critical/High patches
      if (stats.status === 'fulfilled') {
        const s = stats.value
        if (s.critical_count > 0) {
          alerts.push({
            id: 'critical-patches',
            level: 'critical',
            title: `${s.critical_count} Critical Patch${s.critical_count > 1 ? 'es' : ''} Unresolved`,
            description: 'Hosts have unpatched critical severity vulnerabilities.',
            link: '/patches',
            timestamp: new Date(),
          })
        }
        if (s.pending_approvals > 0) {
          alerts.push({
            id: 'pending-approvals',
            level: 'warning',
            title: `${s.pending_approvals} Deployment${s.pending_approvals > 1 ? 's' : ''} Awaiting Approval`,
            description: 'Patch deployments need administrator approval.',
            link: '/deployments',
            timestamp: new Date(),
          })
        }
        if (s.hosts_never_scanned > 0) {
          alerts.push({
            id: 'never-scanned',
            level: 'warning',
            title: `${s.hosts_never_scanned} Host${s.hosts_never_scanned > 1 ? 's' : ''} Never Scanned`,
            description: 'These hosts have no patch compliance data.',
            link: '/hosts',
            timestamp: new Date(),
          })
        }
        if (s.avg_days_since_scan > 7) {
          alerts.push({
            id: 'stale-scans',
            level: 'warning',
            title: 'Fleet Scan Data is Stale',
            description: `Average ${Math.round(s.avg_days_since_scan)} days since last scan. Consider running a fleet scan.`,
            link: '/',
            timestamp: new Date(),
          })
        }
        if (s.offline_hosts > 0) {
          alerts.push({
            id: 'offline-hosts',
            level: 'info',
            title: `${s.offline_hosts} Host${s.offline_hosts > 1 ? 's' : ''} Offline`,
            description: 'These hosts haven\'t reported in the last 6 hours.',
            link: '/hosts',
            timestamp: new Date(),
          })
        }
      }

      // Failed deployments (last 7 days)
      if (deployments.status === 'fulfilled') {
        const failed = deployments.value.filter(d => d.status === 'FAILED')
        if (failed.length > 0) {
          alerts.push({
            id: 'failed-deployments',
            level: 'critical',
            title: `${failed.length} Failed Deployment${failed.length > 1 ? 's' : ''}`,
            description: 'Some patch deployments have failed and may need retry.',
            link: '/deployments',
            timestamp: new Date(),
          })
        }
      }

      // All OK fallback
      if (alerts.length === 0) {
        alerts.push({
          id: 'all-ok',
          level: 'info',
          title: 'Fleet is Healthy',
          description: 'No critical issues detected. All systems operational.',
          timestamp: new Date(),
        })
      }

      setNotifications(alerts)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) fetchAlerts()
  }, [open, fetchAlerts])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAllRead = () => {
    const ids = new Set(notifications.map(n => n.id))
    setReadIds(ids)
    saveReadIds(ids)
  }

  const markRead = (id: string) => {
    const next = new Set(readIds)
    next.add(id)
    setReadIds(next)
    saveReadIds(next)
  }

  const levelIcon = {
    critical: <AlertTriangle size={14} style={{ color: 'var(--accent-red)' }} />,
    warning:  <Shield size={14} style={{ color: 'var(--accent-amber)' }} />,
    info:     <Info size={14} style={{ color: 'var(--accent-cyan)' }} />,
  }

  const levelColor = {
    critical: 'var(--accent-red)',
    warning:  'var(--accent-amber)',
    info:     'var(--accent-cyan)',
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-fade-in"
          style={{ pointerEvents: open ? 'auto' : 'none' }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 z-50 h-full w-80 border-l flex flex-col transition-transform duration-300"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          borderColor: 'var(--border)',
          backgroundColor: 'var(--card)',
          boxShadow: 'var(--shadow-card-lg)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-4 py-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <Bell size={15} style={{ color: 'var(--accent-cyan)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
            {unreadCount > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ backgroundColor: 'var(--accent-red)', color: '#fff' }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchAlerts}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium px-2 py-1 rounded-md transition-colors"
                style={{ color: 'var(--accent-cyan)' }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={18} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {notifications.map(notif => {
                const isRead = readIds.has(notif.id)
                return (
                  <div
                    key={notif.id}
                    className="relative px-4 py-3 transition-colors cursor-pointer"
                    style={{ backgroundColor: isRead ? 'transparent' : 'color-mix(in srgb, var(--accent-cyan) 3%, transparent)' }}
                    onClick={() => {
                      markRead(notif.id)
                      if (notif.link) { navigate(notif.link); onClose() }
                    }}
                  >
                    {!isRead && (
                      <span
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: levelColor[notif.level] }}
                      />
                    )}
                    <div className="flex items-start gap-2.5 pl-2">
                      <div className="mt-0.5 flex-shrink-0">{levelIcon[notif.level]}</div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold leading-snug"
                          style={{ color: isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}
                        >
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {notif.description}
                        </p>
                        {notif.link && (
                          <p className="mt-1 text-[10px] font-medium" style={{ color: 'var(--accent-cyan)' }}>
                            View →
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="border-t px-4 py-3 text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Alerts refresh when panel opens · Powered by Ansible
          </p>
        </div>
      </div>
    </>
  )
}

// Re-export Bell locally to avoid import loop
function Bell({ size, ...props }: { size: number; [k: string]: unknown }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  )
}
