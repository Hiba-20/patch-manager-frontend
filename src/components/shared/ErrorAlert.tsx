import { AlertTriangle } from 'lucide-react'

interface ErrorAlertProps { message: string }

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-exia-red/20 bg-exia-red/[0.06] px-5 py-4 animate-fade-in">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-exia-red/10 border border-exia-red/20 text-exia-red mt-0.5">
        <AlertTriangle size={16} />
      </div>
      <div>
        <p className="text-sm font-semibold text-exia-red mb-0.5">Request Failed</p>
        <p className="text-sm text-exia-red/70">{message}</p>
      </div>
    </div>
  )
}
