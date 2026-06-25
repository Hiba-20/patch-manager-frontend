import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

interface Props {
  open: boolean
  action: 'approve' | 'reject'
  count: number
  onConfirm: (comment: string) => void
  onCancel: () => void
}

export function BulkActionConfirmModal({ open, action, count, onConfirm, onCancel }: Props) {
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const isApprove = action === 'approve'
  const title = isApprove ? `Approve ${count} Deployment${count !== 1 ? 's' : ''}?`
    : `Reject ${count} Deployment${count !== 1 ? 's' : ''}?`

  return createPortal(
    <div
      onClick={onCancel}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-4 flex items-start gap-3">
          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
            isApprove ? 'bg-exia-green/10' : 'bg-exia-red/10'
          }`}>
            <AlertTriangle size={15} className={isApprove ? 'text-exia-green' : 'text-exia-red'} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-exia-text-primary">{title}</h3>
            <p className="mt-1 text-xs text-exia-text-secondary leading-relaxed">
              {isApprove
                ? 'All selected pending deployments will be scheduled for installation.'
                : 'All selected pending deployments will be rejected and will not be installed.'}
            </p>
          </div>
          <button onClick={onCancel} className="text-exia-text-muted hover:text-exia-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-exia-text-secondary mb-1">
            Comment <span className="text-exia-text-muted">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Reason for this bulk action..."
            rows={3}
            className="w-full rounded-lg border border-exia-border/50 bg-exia-navy px-3 py-2 text-sm text-exia-text-primary placeholder:text-exia-text-muted focus:border-exia-cyan/40 focus:outline-none focus:ring-1 focus:ring-exia-cyan/20 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-exia-border/40 px-3.5 py-1.5 text-xs font-semibold text-exia-text-secondary transition-colors hover:bg-exia-elevated"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(comment)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-exia-text-primary transition-all ${
              isApprove
                ? 'bg-exia-green hover:bg-exia-green/90'
                : 'bg-exia-red hover:bg-exia-red/90'
            }`}
          >
            {isApprove ? `Approve ${count}` : `Reject ${count}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
