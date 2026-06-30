import { useState } from 'react'
import { X, Copy, Check, Loader2, Server, Monitor, Terminal, KeyRound, User, Lock } from 'lucide-react'
import { createHost } from '../../api/hosts'
import type { HostCreateResponse } from '../../types/host'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function AddHostModal({ open, onClose, onCreated }: Props) {
  const [hostname, setHostname] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [osType, setOsType] = useState('windows')
  const [winrmUser, setWinrmUser] = useState('')
  const [winrmPassword, setWinrmPassword] = useState('')
  const [sshUser, setSshUser] = useState('')
  const [sshPassword, setSshPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<HostCreateResponse | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await createHost(hostname, ipAddress, osType, winrmUser || undefined, winrmPassword || undefined, sshUser || undefined, sshPassword || undefined)
      setResult(res)
      onCreated()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err as Error)?.message ??
        'Failed to add host'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.api_key)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result.api_key
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    setHostname('')
    setIpAddress('')
    setOsType('windows')
    setWinrmUser('')
    setWinrmPassword('')
    setSshUser('')
    setSshPassword('')
    setCopied(false)
    onClose()
  }

  const OsIcon = osType === 'windows' ? Monitor : Terminal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border border-exia-border/60 shadow-card-lg overflow-hidden"
        style={{ background: 'var(--card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/30 to-transparent" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-exia-text-primary tracking-tight">
            {result ? 'Host Registered' : 'Add Host'}
          </h2>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-exia-text-muted hover:text-exia-text-secondary hover:bg-elevated transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {!result ? (
          <div className="px-6 pb-6 space-y-5">
            {error && (
              <div className="rounded-lg border border-exia-red/20 bg-exia-red/[0.06] px-3.5 py-2.5 text-xs text-exia-red font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                <Server size={13} />
                Hostname
              </label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="e.g. win10-prod-01"
                required
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                <Server size={13} />
                IP Address
              </label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g. 192.168.56.5"
                required
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                <OsIcon size={13} />
                Operating System
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOsType('windows')}
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                    osType === 'windows'
                      ? 'border-exia-cyan/40 bg-exia-cyan/[0.08] text-exia-cyan'
                      : 'border-exia-border/50 bg-exia-card text-exia-text-secondary hover:border-exia-border/70'
                  }`}
                >
                  <Monitor size={14} />
                  Windows
                </button>
                <button
                  onClick={() => setOsType('linux')}
                  className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm transition-colors ${
                    osType === 'linux'
                      ? 'border-exia-cyan/40 bg-exia-cyan/[0.08] text-exia-cyan'
                      : 'border-exia-border/50 bg-exia-card text-exia-text-secondary hover:border-exia-border/70'
                  }`}
                >
                  <Terminal size={14} />
                  Linux
                </button>
              </div>
            </div>

            {osType === 'windows' ? (
              <>
                <div className="h-px bg-exia-border/20" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-exia-text-muted">WinRM Credentials</p>
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
              </>
            ) : (
              <>
                <div className="h-px bg-exia-border/20" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-exia-text-muted">SSH Credentials</p>
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                    <User size={13} />
                    SSH Username
                  </label>
                  <input
                    type="text"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    placeholder="e.g. root"
                    className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                    <Lock size={13} />
                    SSH Password
                  </label>
                  <input
                    type="password"
                    value={sshPassword}
                    onChange={(e) => setSshPassword(e.target.value)}
                    placeholder="SSH password or key passphrase"
                    className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading || !hostname || !ipAddress}
              className="relative w-full overflow-hidden rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Registering...
                </span>
              ) : (
                'Register Host'
              )}
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-5">
            <div className="rounded-lg border border-exia-green/20 bg-exia-green/[0.06] px-4 py-3">
              <p className="text-xs font-medium text-exia-green mb-1">
                Host registered successfully
              </p>
              <p className="text-[10px] text-exia-text-secondary">
                {result.hostname} ({result.ip_address})
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                <KeyRound size={13} />
                API Key
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-exia-border/50 bg-exia-card px-3 py-2.5 text-xs text-exia-text-secondary font-mono break-all select-all">
                  {result.api_key}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-exia-border/50 bg-exia-card text-exia-text-secondary hover:text-exia-cyan hover:border-exia-cyan/30 transition-colors flex-shrink-0"
                >
                  {copied ? <Check size={14} className="text-exia-green" /> : <Copy size={14} />}
                </button>
              </div>
              {copied && (
                <p className="mt-1 text-[10px] text-exia-green font-medium">Copied to clipboard!</p>
              )}
            </div>

            <div className="rounded-lg border border-exia-amber/20 bg-exia-amber/[0.06] px-4 py-3">
              <p className="text-[10px] text-exia-text-secondary leading-relaxed">
                This API key is shown only once. Configure your agent with this key to authenticate this host for scanning and updates.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full rounded-lg border border-exia-border/50 bg-exia-card py-2.5 text-sm font-medium text-exia-text-secondary hover:text-exia-text-primary hover:border-exia-cyan/30 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
