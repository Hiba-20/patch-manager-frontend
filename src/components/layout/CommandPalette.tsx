import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LayoutDashboard, Server, Scan, Shield, History, Command } from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  description: string
  icon: typeof Search
  action: () => void
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const allItems: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Overview and compliance metrics',
      icon: LayoutDashboard,
      action: () => { navigate('/'); setOpen(false) },
    },
    {
      id: 'hosts',
      label: 'Hosts',
      description: 'View all registered machines',
      icon: Server,
      action: () => { navigate('/hosts'); setOpen(false) },
    },
    {
      id: 'scan',
      label: 'Latest Scan',
      description: 'View most recent scan results',
      icon: Scan,
      action: () => { navigate('/hosts'); setOpen(false) },
    },
    {
      id: 'patches',
      label: 'Patch Catalog',
      description: 'Browse and manage security patches',
      icon: Shield,
      action: () => { navigate('/patches'); setOpen(false) },
    },
    {
      id: 'audit',
      label: 'Audit Log',
      description: 'View security and activity events',
      icon: History,
      action: () => { navigate('/audit-log'); setOpen(false) },
    },
  ]

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        filtered[selectedIndex].action()
      }
    },
    [filtered, selectedIndex],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-lg rounded-xl border border-exia-border/60 shadow-card-lg overflow-hidden animate-slide-up"
        style={{ background: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-exia-border/30 px-4 py-3">
          <Search size={15} className="text-exia-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages and hosts…"
            className="flex-1 bg-transparent text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 rounded-md border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[10px] font-medium text-exia-text-muted">
            <Command size={10} />
            K
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-exia-text-muted">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    idx === selectedIndex
                      ? 'bg-exia-cyan/[0.08] text-exia-cyan'
                      : 'text-exia-text-secondary hover:bg-elevated'
                  }`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                    idx === selectedIndex
                      ? 'border-exia-cyan/30 bg-exia-cyan/10'
                      : 'border-exia-border/40 bg-exia-elevated'
                  }`}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[10px] text-exia-text-muted">{item.description}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="border-t border-exia-border/30 px-4 py-2 flex items-center gap-4 text-[10px] text-exia-text-muted">
          <span><kbd className="font-mono text-exia-text-secondary">&uarr;</kbd> <kbd className="font-mono text-exia-text-secondary">&darr;</kbd> Navigate</span>
          <span><kbd className="font-mono text-exia-text-secondary">&crarr;</kbd> Open</span>
          <span><kbd className="font-mono text-exia-text-secondary">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
