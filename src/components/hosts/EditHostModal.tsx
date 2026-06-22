import { useState } from 'react'
import { X, Loader2, Monitor, Terminal, Server } from 'lucide-react'
import { updateHost } from '../../api/hosts'
import type { HostResponse } from '../../types/host'

interface Props {
  host: HostResponse
  open: boolean
  onClose: () => void
  onUpdated: () => void
}

export function EditHostModal({ host, open, onClose, onUpdated }: Props) {
  const [hostname, setHostname] = useState(host?.hostname ?? '')
  const [ipAddress, setIpAddress] = useState(host?.ip_address ?? '')
  const [osType, setOsType] = useState(host?.os_type ?? 'windows')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open || !host) return null

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await updateHost(host.id, {
        hostname: hostname !== host.hostname ? hostname : undefined,
        ip_address: ipAddress !== host.ip_address ? ipAddress : undefined,
        os_type: osType !== host.os_type ? osType : undefined,
      })
      onUpdated()
      onClose()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        (err as Error)?.message ??
        'Failed to update host'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const OsIcon = osType === 'windows' ? Monitor : Terminal

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-xl border border-exia-border/60 shadow-card-lg overflow-hidden"
        style={{ background: '#0b1120' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/30 to-transparent" />

        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-base font-bold text-white tracking-tight">Edit Host</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-exia-text-muted hover:text-exia-text-secondary hover:bg-white/[0.05] transition-colors"
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

          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
              <Server size={13} />
              Hostname
            </label>
            <input
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
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
              className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-white placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
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

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-exia-border/50 bg-exia-card py-2.5 text-sm font-medium text-exia-text-secondary hover:text-white hover:border-exia-cyan/30 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
