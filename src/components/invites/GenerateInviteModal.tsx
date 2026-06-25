import { useState } from 'react'
import { X, Copy, Check, Loader2, Link, Clock, Users } from 'lucide-react'
import { createInvite, type InviteCreateResponse } from '../../api/invites'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function GenerateInviteModal({ open, onClose, onCreated }: Props) {
  const [maxUses, setMaxUses] = useState(1)
  const [expiresInHours, setExpiresInHours] = useState(48)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InviteCreateResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await createInvite(maxUses, expiresInHours)
      setResult(res)
      onCreated()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to generate invite'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result.url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setResult(null)
    setError(null)
    setCopied(false)
    setMaxUses(1)
    setExpiresInHours(48)
    onClose()
  }

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
            {result ? 'Invite Created' : 'Generate Invite'}
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
                <Users size={13} />
                Max uses
              </label>
              <select
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              >
                <option value={1}>Single use</option>
                <option value={5}>5 uses</option>
                <option value={10}>10 uses</option>
                <option value={25}>25 uses</option>
                <option value={100}>100 uses</option>
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-exia-text-secondary mb-2">
                <Clock size={13} />
                Expires in
              </label>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(Number(e.target.value))}
                className="w-full rounded-lg border border-exia-border/50 bg-exia-card px-3.5 py-2.5 text-sm text-exia-text-primary focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 transition-colors"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={168}>7 days</option>
                <option value={720}>30 days</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="relative w-full overflow-hidden rounded-lg bg-exia-cyan py-2.5 text-sm font-semibold text-black transition-all hover:bg-exia-cyan/90 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={15} className="animate-spin" />
                  Generating...
                </span>
              ) : (
                'Generate Invite Link'
              )}
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-5">
            <div className="rounded-lg border border-exia-green/20 bg-exia-green/[0.06] px-4 py-3">
              <p className="text-xs font-medium text-exia-green mb-1">
                Share this link with the new administrator:
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 rounded-lg border border-exia-border/50 bg-exia-card px-3 py-2 text-xs text-exia-text-secondary font-mono truncate">
                  <Link size={12} className="inline mr-1.5 text-exia-cyan" />
                  {result.url}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-exia-border/50 bg-exia-card text-exia-text-secondary hover:text-exia-cyan hover:border-exia-cyan/30 transition-colors"
                >
                  {copied ? <Check size={14} className="text-exia-green" /> : <Copy size={14} />}
                </button>
              </div>
              {copied && (
                <p className="mt-1.5 text-[10px] text-exia-green font-medium">Copied to clipboard!</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] text-exia-text-muted">
              <Users size={12} />
              <span>{maxUses === 1 ? 'Single use' : `${maxUses} uses`}</span>
              <span className="text-exia-border/50">&middot;</span>
              <Clock size={12} />
              <span>Expires in {expiresInHours}h</span>
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
