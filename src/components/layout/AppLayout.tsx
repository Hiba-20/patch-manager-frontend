import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { CommandPalette } from './CommandPalette'
import { ActiveDeploymentsPanel } from '../dashboard/ActiveDeploymentsPanel'

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-exia-obsidian">
      <CommandPalette />
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />
      <main className="flex flex-1 flex-col overflow-y-auto bg-exia-obsidian relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-10 flex flex-1 flex-col">
          <Outlet />
        </div>
        <ActiveDeploymentsPanel />
      </main>
    </div>
  )
}
