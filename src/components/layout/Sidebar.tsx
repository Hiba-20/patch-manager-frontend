import { NavLink } from 'react-router-dom'
import {
  BarChart, BrainCircuit, ClipboardCheck, History, LayoutDashboard,
  Server, Settings, Shield, ShieldCheck, Users, Zap,
  PanelLeft, PanelLeftClose,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/',         label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/hosts',    label: 'Hosts',         icon: Server },
  { to: '/groups',   label: 'Groups',        icon: Users },
  { to: '/deployments', label: 'Deployments', icon: ClipboardCheck },
  { to: '/patches',  label: 'Patches',       icon: Shield },
  { to: '/reports',  label: 'Reports',       icon: BarChart },
  { to: '/audit-log', label: 'Audit Log',     icon: History },
  { to: '/ai-assistant', label: 'AI Assistant', icon: BrainCircuit },
]

const SETTINGS_ITEMS = [
  { to: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  return (
    <aside
      className={`flex flex-col bg-exia-navy border-r border-exia-border/40 shadow-sidebar transition-all duration-200 ${
        open ? 'w-60' : 'w-16'
      }`}
    >
      {/* ── Logo + Toggle ── */}
      <div className="flex h-14 items-center justify-between border-b border-exia-border/30 pr-3">
        <div
          className={`flex items-center min-w-0 ${
            open ? 'gap-3 pl-5' : 'pl-0 flex-1 justify-center'
          }`}
        >
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-exia-cyan/25 to-exia-cyan/5 border border-exia-cyan/20">
            <ShieldCheck size={16} className="text-exia-cyan" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-exia-green shadow-glow-green" />
          </div>
          {open && (
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-sm font-bold tracking-tight text-exia-text-primary truncate">
                exia<span className="text-exia-cyan">.</span>tech
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-exia-text-secondary truncate">
                Patch Manager
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-exia-text-muted hover:text-exia-text-secondary hover:bg-exia-elevated/50 transition-colors"
          title={open ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {open ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className={`flex-1 space-y-0.5 ${open ? 'px-3 py-5' : 'px-1.5 py-4'}`}>
        {open && (
          <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-exia-text-muted">
            Navigation
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center rounded-lg transition-all duration-150 ${
                  open
                    ? 'gap-3 px-3 py-2.5 text-sm font-medium'
                    : 'justify-center px-0 py-2.5'
                } ${
                  isActive
                    ? 'nav-active-glow bg-exia-cyan/[0.07] text-exia-cyan'
                    : 'text-exia-text-secondary hover:bg-elevated hover:text-primary'
                }`
              }
              title={open ? undefined : item.label}
            >
              {({ isActive }) => (
                <div className={`flex items-center ${open ? 'w-full gap-3' : 'flex-col gap-0.5'}`}>
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-exia-cyan shrink-0'
                        : 'text-exia-text-muted group-hover:text-primary transition-colors shrink-0'
                    }
                  />
                  {open && <span className="flex-1 truncate">{item.label}</span>}
                  {open && isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-exia-cyan shadow-glow-cyan animate-pulse-slow shrink-0" />
                  )}
                  {!open && isActive && (
                    <span className="h-1 w-1 rounded-full bg-exia-cyan shadow-glow-cyan animate-pulse-slow" />
                  )}
                </div>
              )}
            </NavLink>
          )
        })}

        {open && (
          <p className="mb-3 mt-6 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-exia-text-muted">
            Settings
          </p>
        )}

        {SETTINGS_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center rounded-lg transition-all duration-150 ${
                  open
                    ? 'gap-3 px-3 py-2.5 text-sm font-medium'
                    : 'justify-center px-0 py-2.5'
                } ${
                  isActive
                    ? 'nav-active-glow bg-exia-cyan/[0.07] text-exia-cyan'
                    : 'text-exia-text-secondary hover:bg-elevated hover:text-primary'
                }`
              }
              title={open ? undefined : item.label}
            >
              {({ isActive }) => (
                <div className={`flex items-center ${open ? 'w-full gap-3' : 'flex-col gap-0.5'}`}>
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? 'text-exia-cyan shrink-0'
                        : 'text-exia-text-muted group-hover:text-primary transition-colors shrink-0'
                    }
                  />
                  {open && <span className="flex-1 truncate">{item.label}</span>}
                  {open && isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-exia-cyan shadow-glow-cyan animate-pulse-slow shrink-0" />
                  )}
                  {!open && isActive && (
                    <span className="h-1 w-1 rounded-full bg-exia-cyan shadow-glow-cyan animate-pulse-slow" />
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* ── Footer ── */}
      {open && (
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
      )}
    </aside>
  )
}
