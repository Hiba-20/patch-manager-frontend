import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-exia-border/20 bg-exia-surface px-4 py-3">
      <div className="relative flex-1">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Posez une question sur votre parc..."}
          rows={1}
          disabled={disabled}
          className="w-full resize-none rounded-xl border border-exia-border/30 bg-exia-bg px-4 py-2.5 pr-12 text-sm text-exia-text-primary placeholder-exia-text-muted outline-none transition-colors focus:border-exia-cyan/50 focus:ring-1 focus:ring-exia-cyan/20 disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-exia-cyan text-white transition-all hover:bg-exia-cyan/90 disabled:opacity-40"
      >
        {disabled ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
      </button>
    </form>
  )
}
