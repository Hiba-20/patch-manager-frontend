import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

let toastId = 0

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={14} className="text-exia-green" />,
  error: <XCircle size={14} className="text-exia-red" />,
  warning: <AlertTriangle size={14} className="text-exia-amber" />,
  info: <Info size={14} className="text-exia-cyan" />,
}

const BORDERS: Record<ToastType, string> = {
  success: 'border-exia-green/20 bg-exia-green/[0.06]',
  error: 'border-exia-red/20 bg-exia-red/[0.06]',
  warning: 'border-exia-amber/20 bg-exia-amber/[0.06]',
  info: 'border-exia-cyan/20 bg-exia-cyan/[0.06]',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = String(++toastId)
    setToasts((prev) => [...prev.slice(-4), { id, type, message }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])

  const ctx: ToastContextType = {
    toast: addToast,
    success: (msg) => addToast('success', msg),
    error: (msg) => addToast('error', msg),
    warning: (msg) => addToast('warning', msg),
    info: (msg) => addToast('info', msg),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs shadow-lg backdrop-blur-sm animate-slide-up ${BORDERS[t.type]}`}
            style={{ minWidth: 260, maxWidth: 400 }}
          >
            {ICONS[t.type]}
            <span className="flex-1 text-exia-text-secondary font-medium">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-exia-text-muted hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
