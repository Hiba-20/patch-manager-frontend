import ReactMarkdown from 'react-markdown'
import type { ChatMessage as ChatMessageType } from '../../types/ai'

interface Props {
  message: ChatMessageType
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-exia-cyan text-white rounded-br-md'
            : 'bg-exia-surface border border-exia-border/30 text-exia-text-primary rounded-bl-md'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none
              [&_strong]:font-semibold
              [&_ul]:list-disc [&_ul]:pl-4
              [&_li]:mb-1
              [&_p]:mb-2
              [&_p:last-child]:mb-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
        <span className={`mt-1 block text-[10px] ${isUser ? 'text-white/60' : 'text-exia-text-muted'}`}>
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}
