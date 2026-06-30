import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string | ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  const confirmBg = variant === 'danger'
    ? 'bg-exia-red hover:bg-exia-red/90'
    : 'bg-exia-cyan hover:bg-exia-cyan/90'

  return createPortal(
    <div onClick={onCancel} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-xl border border-exia-border/40 bg-exia-card p-6 shadow-2xl animate-fade-in">
        <div className="mb-4 flex items-start gap-3">
          {variant === 'danger' && (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-exia-red/10">
              <AlertTriangle size={15} className="text-exia-red" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-exia-text-primary">{title}</h3>
            <p className="mt-1 text-xs text-exia-text-secondary leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="text-exia-text-muted hover:text-exia-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-exia-border/40 px-3.5 py-1.5 text-xs font-semibold text-exia-text-secondary transition-colors hover:bg-exia-elevated"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold text-exia-text-primary transition-all ${confirmBg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
