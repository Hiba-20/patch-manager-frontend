import { Bell, ChevronRight, LogOut, Moon, Sun, Monitor, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { useToast } from '../shared/Toast'
import { ConfirmDialog } from '../shared/ConfirmDialog'
import { NotificationsPanel } from './NotificationsPanel'

interface TopBarProps {
  title: string
  subtitle?: string
  breadcrumb?: string
}

export function TopBar({ title, subtitle, breadcrumb }: TopBarProps) {
  const { user, logout } = useAuth()
  const { resolvedTheme, theme, setTheme } = useTheme()
  const toast = useToast()
  const [now, setNow] = useState(new Date())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const themeBtnRef = useRef<HTMLButtonElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const [themeMenuStyle, setThemeMenuStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close theme menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    if (showThemeMenu) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showThemeMenu])

  const handleThemeToggle = () => {
    if (!showThemeMenu && themeBtnRef.current) {
      const rect = themeBtnRef.current.getBoundingClientRect()
      setThemeMenuStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
        zIndex: 99999,
      })
    }
    setShowThemeMenu(v => !v)
  }

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const themeOptions: { key: typeof theme; label: string; Icon: typeof Sun }[] = [
    { key: 'light',  label: 'Light',  Icon: Sun },
    { key: 'dark',   label: 'Dark',   Icon: Moon },
    { key: 'system', label: 'System', Icon: Monitor },
  ]

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-8 backdrop-blur-sm"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--surface)',
        }}
      >
        {/* Bottom gradient line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, var(--accent-cyan) 30%, transparent)' }}
          aria-hidden
        />

        {/* Left — title / breadcrumb */}
        <div className="flex flex-col justify-center">
          {breadcrumb && (
            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <span>{breadcrumb}</span>
              <ChevronRight size={10} />
              <span style={{ color: 'var(--text-secondary)' }}>{title}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>
            {subtitle && (
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-medium border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-cyan) 10%, transparent)',
                  color: 'var(--accent-cyan)',
                  borderColor: 'color-mix(in srgb, var(--accent-cyan) 25%, transparent)',
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right — clock, theme, notifications, user */}
        <div className="flex items-center gap-2">
          {/* Clock */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-mono"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--text-secondary)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-green)' }} />
            <span>{dateStr} &middot; {timeStr}</span>
          </div>

          {/* Theme toggle */}
          <div>
            <button
              id="theme-toggle-btn"
              ref={themeBtnRef}
              onClick={handleThemeToggle}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--text-secondary)' }}
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {showThemeMenu && createPortal(
              <div
                ref={themeMenuRef}
                style={{
                  ...themeMenuStyle,
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card)',
                  boxShadow: 'var(--shadow-card-md)',
                }}
                className="w-36 rounded-xl border overflow-hidden animate-fade-in"
              >
                {themeOptions.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setTheme(key); setShowThemeMenu(false) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                    style={{
                      color: theme === key ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      backgroundColor: theme === key ? 'color-mix(in srgb, var(--accent-cyan) 8%, transparent)' : 'transparent',
                    }}
                  >
                    <Icon size={14} />
                    <span className="font-medium">{label}</span>
                    {theme === key && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-cyan)' }} />
                    )}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* Notifications */}
          <button
            id="notifications-btn"
            onClick={() => setShowNotifications(v => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--text-secondary)' }}
            title="Notifications"
          >
            <Bell size={15} />
            <NotificationDot />
          </button>

          {/* User avatar + logout */}
          {user && (
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border text-[11px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-cyan) 20%, transparent), color-mix(in srgb, var(--accent-cyan) 5%, transparent))',
                  borderColor: 'color-mix(in srgb, var(--accent-cyan) 25%, transparent)',
                  color: 'var(--accent-cyan)',
                }}
                title={user.email}
              >
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)', color: 'var(--text-secondary)' }}
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>

        <ConfirmDialog
          open={showLogoutConfirm}
          title="Sign out"
          message="Are you sure you want to sign out?"
          confirmLabel="Sign out"
          variant="danger"
          onConfirm={() => { toast.success('Signed out'); logout(); setShowLogoutConfirm(false) }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      </header>

      {/* Notifications Slide Panel */}
      <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  )
}

// Small dot that will be driven by real data from NotificationsPanel context
function NotificationDot() {
  // We keep the amber dot — it'll be conditionally shown by NotificationsPanel context later
  return (
    <span
      className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
      style={{ backgroundColor: 'var(--accent-amber)' }}
    />
  )
}
