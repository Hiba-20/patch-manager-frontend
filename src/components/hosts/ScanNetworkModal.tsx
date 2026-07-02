import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Monitor, Terminal, Check, XCircle, Network, User, Lock } from 'lucide-react'
import { scanNetwork, createHost } from '../../api/hosts'
import { useToast } from '../shared/Toast'
import type { DiscoveredHost } from '../../types/host'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

type ModalState = 'form' | 'scanning' | 'results' | 'registering' | 'done'

export function ScanNetworkModal({ open, onClose, onCreated }: Props) {
  const [cidr, setCidr] = useState('')
  const [sshUser, setSshUser] = useState('root')
  const [winrmUser, setWinrmUser] = useState('')
  const [winrmPassword, setWinrmPassword] = useState('')
  const [state, setState] = useState<ModalState>('form')
  const [discovered, setDiscovered] = useState<DiscoveredHost[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [registeredCount, setRegisteredCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const toast = useToast()

  useEffect(() => {
    if (open) {
      setCidr('')
      setSshUser('root')
      setWinrmUser('')
      setWinrmPassword('')
      setState('form')
      setDiscovered([])
      setSelected(new Set())
      setElapsed(0)
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (state === 'scanning') {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state])

  const handleScan = async () => {
    if (!cidr.trim()) return
    setState('scanning')
    setError(null)
    try {
      const result = await scanNetwork(cidr, sshUser || undefined, winrmUser || undefined, winrmPassword || undefined)
      setDiscovered(result.hosts)
      setSelected(new Set(result.hosts.map((_, i) => i)))
      setState('results')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err as Error)?.message ??
        'Scan failed'
      setError(msg)
      setState('form')
    }
  }

  const handleRegister = async () => {
    const toRegister = Array.from(selected).map((i) => discovered[i])
    if (toRegister.length === 0) return
    setState('registering')
    setError(null)
    let count = 0
    for (const host of toRegister) {
      try {
        const body: Record<string, string | null> = {
          hostname: host.hostname,
          ip_address: host.ip_address,
          os_type: host.os_type,
        }
        if (host.os_type === 'linux') {
          body.ssh_user = sshUser || 'root'
        } else {
          body.winrm_user = winrmUser || null
          body.winrm_password = winrmPassword || null
        }
        await createHost(
          host.hostname,
          host.ip_address,
          host.os_type,
          host.os_type === 'windows' ? winrmUser || undefined : undefined,
          host.os_type === 'windows' ? winrmPassword || undefined : undefined,
          host.os_type === 'linux' ? sshUser || 'root' : undefined,
          undefined,
        )
        count++
      } catch {
        // skip duplicates or failures
      }
    }
    setRegisteredCount(count)
    setState('done')
    onCreated()
  }

  const toggleAll = () => {
    if (selected.size === discovered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(discovered.map((_, i) => i)))
    }
  }

  const toggle = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelected(next)
  }

  if (!open) return null

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { if (state !== 'scanning') onClose() }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl rounded-xl border border-exia-border/60 shadow-card-lg overflow-hidden"
        style={{ background: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/30 to-transparent" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-exia-text-primary tracking-tight">
            {state === 'form' && 'Scan Network'}
            {state === 'scanning' && 'Scanning...'}
            {state === 'results' && `Found ${discovered.length} host${discovered.length !== 1 ? 's' : ''}`}
            {state === 'registering' && 'Registering...'}
            {state === 'done' && 'Registration Complete'}
          </h2>
          <button
            onClick={onClose}
            disabled={state === 'scanning' || state === 'registering'}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-exia-text-muted hover:text-exia-text-secondary hover:bg-elevated transition-colors disabled:opacity-40"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {error && (
            <div className="rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-3.5 py-2.5 text-xs text-exia-red font-medium">
              {error}
            </div>
          )}

          {state === 'form' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                  <Network size={13} />
                  CIDR Range
                </label>
                <input
                  type="text"
                  value={cidr}
                  onChange={(e) => setCidr(e.target.value)}
                  placeholder="e.g. 192.168.56.0/24"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>

              <div className="h-px bg-exia-border/20" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-exia-text-muted">SSH (Linux)</p>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                  <User size={13} />
                  SSH Username
                </label>
                <input
                  type="text"
                  value={sshUser}
                  onChange={(e) => setSshUser(e.target.value)}
                  placeholder="root"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>

              <div className="h-px bg-exia-border/20" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-exia-text-muted">WinRM (Windows)</p>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                  <User size={13} />
                  WinRM Username
                </label>
                <input
                  type="text"
                  value={winrmUser}
                  onChange={(e) => setWinrmUser(e.target.value)}
                  placeholder="e.g. Administrator"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                  <Lock size={13} />
                  WinRM Password
                </label>
                <input
                  type="password"
                  value={winrmPassword}
                  onChange={(e) => setWinrmPassword(e.target.value)}
                  placeholder="WinRM password"
                  className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                />
              </div>

              <button
                onClick={handleScan}
                disabled={!cidr.trim()}
                className="relative w-full overflow-hidden rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Start Scan
              </button>
            </>
          )}

          {state === 'scanning' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="animate-spin text-exia-cyan" />
              <p className="text-sm text-exia-text-secondary font-medium">
                Scanning {cidr}...
              </p>
              <p className="text-xs text-exia-text-muted font-mono">
                {formatTime(elapsed)} elapsed
              </p>
              <div className="flex items-center gap-2 text-[10px] text-exia-text-muted">
                <span className="flex items-center gap-1"><Terminal size={11} /> nmap discovery</span>
                <span className="text-exia-border">|</span>
                <span className="flex items-center gap-1"><Monitor size={11} /> WinRM test</span>
              </div>
            </div>
          )}

          {state === 'results' && (
            <>
              <p className="text-xs text-exia-text-muted">
                Scan completed in {formatTime(Math.round(elapsed))}
              </p>
              {discovered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <XCircle size={24} className="text-exia-text-muted" />
                  <p className="text-sm text-exia-text-secondary">No hosts found</p>
                  <button
                    onClick={() => setState('form')}
                    className="text-xs text-exia-cyan hover:underline"
                  >
                    Try a different CIDR
                  </button>
                </div>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-exia-border/40">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-exia-border/40 bg-exia-elevated/50">
                          <th className="px-3 py-2.5 text-left w-8">
                            <input
                              type="checkbox"
                              checked={selected.size === discovered.length}
                              onChange={toggleAll}
                              className="rounded"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-left font-medium text-exia-text-secondary">IP Address</th>
                          <th className="px-3 py-2.5 text-left font-medium text-exia-text-secondary">OS</th>
                          <th className="px-3 py-2.5 text-left font-medium text-exia-text-secondary">Hostname</th>
                          <th className="px-3 py-2.5 text-left font-medium text-exia-text-secondary">Reachable</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discovered.map((host, i) => (
                          <tr
                            key={i}
                            onClick={() => toggle(i)}
                            className="border-b border-exia-border/20 hover:bg-exia-elevated/30 cursor-pointer transition-colors"
                          >
                            <td className="px-3 py-2.5">
                              <input
                                type="checkbox"
                                checked={selected.has(i)}
                                onChange={() => toggle(i)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-3 py-2.5 font-mono text-exia-text-primary">{host.ip_address}</td>
                            <td className="px-3 py-2.5">
                              <span className="flex items-center gap-1.5">
                                {host.os_type === 'linux' ? <Terminal size={12} /> : <Monitor size={12} />}
                                <span className="capitalize">{host.os_type}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-exia-text-secondary">{host.hostname}</td>
                            <td className="px-3 py-2.5">
                              {host.winrm_ok === true && (
                                <span className="flex items-center gap-1 text-exia-green">
                                  <Check size={12} /> WinRM
                                </span>
                              )}
                              {host.winrm_ok === false && (
                                <span className="flex items-center gap-1 text-exia-red">
                                  <XCircle size={12} /> WinRM
                                </span>
                              )}
                              {host.os_type === 'linux' && (
                                <span className="text-exia-text-muted">SSH</span>
                              )}
                              {host.winrm_ok === null && host.os_type === 'windows' && (
                                <span className="text-exia-text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={selected.size === 0}
                    className="relative w-full overflow-hidden rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Register Selected ({selected.size})
                  </button>
                </>
              )}
            </>
          )}

          {(state === 'registering') && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 size={32} className="animate-spin text-exia-cyan" />
              <p className="text-sm text-exia-text-secondary font-medium">
                Registering hosts...
              </p>
            </div>
          )}

          {state === 'done' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-exia-green/[0.1] border border-exia-green/20">
                <Check size={28} className="text-exia-green" />
              </div>
              <p className="text-sm font-medium text-exia-text-primary">
                {registeredCount} host{registeredCount !== 1 ? 's' : ''} registered successfully
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card py-2.5 text-sm font-medium text-exia-text-secondary hover:text-exia-text-primary hover:border-exia-cyan/30 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
