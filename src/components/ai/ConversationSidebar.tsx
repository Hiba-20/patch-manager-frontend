import { MessageSquare, Plus, Trash2 } from 'lucide-react'
import type { Conversation } from '../../types/ai'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

export function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete }: Props) {
  if (conversations.length === 0) return null

  return (
    <aside className="flex w-64 flex-col border-r border-exia-border/20 bg-exia-surface/50">
      <div className="flex items-center justify-between border-b border-exia-border/20 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-exia-text-muted">
          Discussions
        </span>
        <button
          onClick={onNew}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-exia-text-muted transition-colors hover:bg-exia-cyan/10 hover:text-exia-cyan"
          title="Nouvelle discussion"
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group relative mx-2 flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all ${
              conv.id === activeId
                ? 'bg-exia-cyan/10 text-exia-cyan'
                : 'text-exia-text-secondary hover:bg-exia-cyan/5 hover:text-exia-text-primary'
            }`}
            onClick={() => onSelect(conv.id)}
          >
            <MessageSquare size={14} className="shrink-0 opacity-60" />
            <span className="flex-1 truncate text-xs">
              {conv.title}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
              className="shrink-0 rounded p-0.5 text-exia-text-muted opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
              title="Supprimer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  )
}
