import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Plus, MoreHorizontal, Pencil, Trash2, Check } from 'lucide-react'
import type { Conversation } from '../../types/ai'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, newTitle: string) => void
}

export function ConversationSidebar({ conversations, activeId, onSelect, onNew, onDelete, onRename }: Props) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    if (menuOpenId) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpenId])

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [renamingId])

  const handleStartRename = (id: string, currentTitle: string) => {
    setMenuOpenId(null)
    setRenamingId(id)
    setRenameValue(currentTitle)
  }

  const handleSaveRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  const handleCancelRename = () => {
    setRenamingId(null)
  }

  const handleDelete = (id: string) => {
    setMenuOpenId(null)
    onDelete(id)
  }

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
          <div key={conv.id} className="relative mx-2">
            {renamingId === conv.id ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-exia-cyan/10 px-3 py-2.5">
                <MessageSquare size={14} className="shrink-0 text-exia-cyan opacity-60" />
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename()
                    if (e.key === 'Escape') handleCancelRename()
                  }}
                  onBlur={handleSaveRename}
                  className="flex-1 bg-transparent text-xs text-exia-cyan outline-none placeholder:text-exia-text-muted"
                  placeholder="Nom de la discussion"
                />
                <button
                  onClick={handleSaveRename}
                  className="rounded p-0.5 text-exia-cyan/60 hover:text-exia-cyan"
                >
                  <Check size={12} />
                </button>
              </div>
            ) : (
              <div
                className={`group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  conv.id === activeId
                    ? 'bg-exia-cyan/10 text-exia-cyan'
                    : 'text-exia-text-secondary hover:bg-exia-cyan/5 hover:text-exia-text-primary'
                }`}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare size={14} className="shrink-0 opacity-60" />
                <span className="flex-1 truncate text-xs">{conv.title}</span>
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpenId(menuOpenId === conv.id ? null : conv.id)
                  }}
                  className={`shrink-0 rounded p-1 opacity-40 transition-all hover:opacity-100 hover:text-exia-cyan ${
                    menuOpenId === conv.id
                      ? '!opacity-100 text-exia-cyan'
                      : 'text-exia-text-muted'
                  }`}
                  title="Plus d'options"
                >
                  <MoreHorizontal size={14} />
                </button>
                {menuOpenId === conv.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-lg border border-exia-border/20 bg-exia-surface py-1 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleStartRename(conv.id, conv.title)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-exia-text-secondary transition-colors hover:bg-exia-cyan/10 hover:text-exia-cyan"
                    >
                      <Pencil size={12} />
                      Renommer
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-exia-text-secondary transition-colors hover:bg-red-400/10 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
