import { NavLink } from 'react-router-dom'
import { ClipboardCheck, History, LayoutDashboard, Server, Shield, ShieldCheck, UserPlus, Users, Zap } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/hosts',    label: 'Hosts',         icon: Server },
  { to: '/groups',   label: 'Groups',        icon: Users },
  { to: '/deployments', label: 'Deployments', icon: ClipboardCheck },
  { to: '/patches',  label: 'Patches',       icon: Shield },
  { to: '/audit-log', label: 'Audit Log',     icon: History },
]

const SETTINGS_ITEMS = [
  { to: '/settings/invites', label: 'Invites', icon: UserPlus },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col bg-exia-navy border-r border-exia-border/40 shadow-sidebar">
      <div className="flex h-14 items-center gap-3 px-5 border-b border-exia-border/30">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-exia-cyan/25 to-exia-cyan/5 border border-exia-cyan/20">
          <ShieldCheck size={16} className="text-exia-cyan" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-exia-green shadow-glow-green" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-tight text-white">
            exia<span className="text-exia-cyan">.</span>tech
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-exia-text-secondary">
            Patch Manager
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-exia-text-muted">
          Navigation
        </p>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'nav-active-glow bg-exia-cyan/[0.07] text-exia-cyan'
                    : 'text-exia-text-secondary hover:bg-white/[0.03] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-exia-cyan' : 'text-exia-text-muted group-hover:text-slate-300 transition-colors'} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-exia-cyan shadow-glow-cyan animate-pulse-slow" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

        <p className="mb-3 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-exia-text-muted">
          Settings
        </p>
        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'nav-active-glow bg-exia-cyan/[0.07] text-exia-cyan'
                    : 'text-exia-text-secondary hover:bg-white/[0.03] hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? 'text-exia-cyan' : 'text-exia-text-muted group-hover:text-slate-300 transition-colors'} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-exia-cyan shadow-glow-cyan animate-pulse-slow" />
                  )}
                </>
              )}
            </NavLink>
          )
        })}

      <div className="border-t border-exia-border/30 px-5 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex h-2 w-2">
            <span className="h-2 w-2 rounded-full bg-exia-green animate-pulse-slow" />
            <span className="absolute inline-flex h-full w-full rounded-full bg-exia-green opacity-30 animate-ping" />
          </div>
          <span className="text-[10px] font-medium text-exia-green">System Operational</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-exia-text-muted">
          <Zap size={10} />
          <span>Exia Technologies &copy; 2026</span>
        </div>
      </div>
    </aside>
  )
}
