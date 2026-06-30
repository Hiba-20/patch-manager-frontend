import { Bell, ChevronRight, LogOut, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../shared/Toast'
import { ConfirmDialog } from '../shared/ConfirmDialog'

interface TopBarProps {
  title: string
  subtitle?: string
  breadcrumb?: string
}

export function TopBar({ title, subtitle, breadcrumb }: TopBarProps) {
  const { user, logout } = useAuth()
  const toast = useToast()
  const [now, setNow] = useState(new Date())
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-exia-border/40 bg-exia-navy/80 px-8 backdrop-blur-sm">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/15 to-transparent" />

      <div className="flex flex-col justify-center">
        {breadcrumb && (
          <div className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-exia-text-muted">
            <span>{breadcrumb}</span>
            <ChevronRight size={10} />
            <span className="text-exia-text-secondary">{title}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold tracking-tight text-white">{title}</h1>
          {subtitle && (
            <span className="rounded-md bg-exia-cyan/10 px-2 py-0.5 text-[10px] font-medium text-exia-cyan border border-exia-cyan/20">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-exia-border/40 bg-exia-card px-3 py-1.5 text-xs text-exia-text-secondary font-mono">
          <span className="h-1.5 w-1.5 rounded-full bg-exia-green animate-pulse-slow" />
          <span>{dateStr} &middot; {timeStr}</span>
        </div>

        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/40 bg-exia-card text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan">
          <Bell size={15} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-exia-amber shadow-glow-amber" />
        </button>

        {user && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-exia-cyan/20 to-exia-cyan/5 border border-exia-cyan/20 text-[11px] font-bold text-exia-cyan" title={user.email}>
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/40 bg-exia-card text-exia-text-secondary transition-colors hover:border-exia-red/30 hover:text-exia-red"
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
  )
}
