import { useState, useRef, useEffect, useCallback } from 'react'
import { BrainCircuit, MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ChatMessage } from '../components/ai/ChatMessage'
import { ChatInput } from '../components/ai/ChatInput'
import { ConversationSidebar } from '../components/ai/ConversationSidebar'
import { askAI, createConversation, deleteConversationAPI } from '../api/ai'
import type { ChatMessage as ChatMessageType, Conversation } from '../types/ai'

const SUGGESTIONS = [
  "Résumé exécutif du parc",
  "Quels sont les hôtes avec des correctifs critiques ?",
  "Quel est le taux de succès cette semaine ?",
  "Combien d'hôtes dans le parc ?",
  "Quels hôtes n'ont jamais été scannés ?",
  "Quel est le dernier déploiement échoué ?",
]

const STORAGE_KEY = 'ai-conversations'
const SIDEBAR_STORAGE_KEY = 'ai-sidebar-open'

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveConversations(convs: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
  } catch { /* quota exceeded — silent */ }
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function AIAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false' }
    catch { return true }
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeConv = conversations.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    saveConversations(conversations)
  }, [conversations])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen))
  }, [sidebarOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConv?.messages])

  const updateConversation = useCallback((id: string, updater: (c: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)))
  }, [])

  const handleNew = useCallback(async () => {
    try {
      const res = await createConversation()
      const now = new Date().toISOString()
      const conv: Conversation = {
        id: res.session_id,
        title: 'Nouvelle discussion',
        messages: [],
        createdAt: now,
        updatedAt: now,
      }
      setConversations((prev) => [conv, ...prev])
      setActiveId(conv.id)
    } catch {
      const id = generateId()
      const now = new Date().toISOString()
      const conv: Conversation = {
        id,
        title: 'Nouvelle discussion',
        messages: [],
        createdAt: now,
        updatedAt: now,
      }
      setConversations((prev) => [conv, ...prev])
      setActiveId(id)
    }
  }, [])

  const handleDelete = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id))
    if (activeId === id) {
      setActiveId(null)
    }
    deleteConversationAPI(id).catch(() => {})
  }, [activeId])

  const handleSelect = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const handleRename = useCallback((id: string, newTitle: string) => {
    updateConversation(id, (c) => ({ ...c, title: newTitle, updatedAt: new Date().toISOString() }))
  }, [updateConversation])

  const handleSend = useCallback(async (question: string) => {
    if (!activeId) return

    const userMsg: ChatMessageType = { role: 'user', content: question, timestamp: new Date().toISOString(), session_id: activeId }

    updateConversation(activeId, (c) => {
      const title = c.title === 'Nouvelle discussion' && question.length > 3
        ? question.slice(0, 50) + (question.length > 50 ? '...' : '')
        : c.title
      return { ...c, title, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString() }
    })

    setLoading(true)
    try {
      const chatResponse = await askAI(question, activeId)
      const assistantMsg: ChatMessageType = {
        role: 'assistant',
        content: chatResponse.response,
        timestamp: new Date().toISOString(),
        session_id: chatResponse.session_id,
      }
      updateConversation(activeId, (c) => ({
        ...c,
        messages: [...c.messages, assistantMsg],
        updatedAt: new Date().toISOString(),
      }))
    } catch {
      const errorMsg: ChatMessageType = {
        role: 'assistant',
        content: "Désolé, le service IA est temporairement indisponible. Veuillez réessayer.",
        timestamp: new Date().toISOString(),
      }
      updateConversation(activeId, (c) => ({
        ...c,
        messages: [...c.messages, errorMsg],
        updatedAt: new Date().toISOString(),
      }))
    } finally {
      setLoading(false)
    }
  }, [activeId, updateConversation])

  const messages = activeConv?.messages ?? []

  return (
    <div className="flex h-full">
      {sidebarOpen && (
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      )}

      <div className="mx-auto flex h-full max-w-3xl flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-exia-border/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-exia-text-muted transition-colors hover:bg-exia-cyan/10 hover:text-exia-cyan"
              title={sidebarOpen ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
              <BrainCircuit size={20} className="text-purple-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-exia-text-primary">AI Assistant</h1>
              <p className="text-xs text-exia-text-muted">
                Posez des questions sur votre parc en langage naturel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 rounded-lg bg-exia-cyan/10 px-3 py-1.5 text-xs font-medium text-exia-cyan transition-colors hover:bg-exia-cyan/20"
            >
              <MessageSquarePlus size={12} />
              Nouvelle discussion
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !loading && (
            <div className="mt-8 text-center">
              <BrainCircuit size={48} className="mx-auto mb-4 text-exia-text-muted/40" />
              <h2 className="mb-2 text-lg font-semibold text-exia-text-primary">
                Que puis-je faire pour vous ?
              </h2>
              <p className="mb-6 text-sm text-exia-text-muted">
                Essayez l'une de ces questions :
              </p>
              <div className="mx-auto flex max-w-md flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="rounded-xl border border-exia-border/20 bg-exia-surface px-4 py-2.5 text-sm text-exia-text-secondary transition-all hover:border-exia-cyan/30 hover:text-exia-cyan"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage key={`${activeId}-${i}`} message={msg} />
          ))}
          {loading && (
            <div className="flex justify-start mb-4">
              <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-exia-surface border border-exia-border/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-exia-text-muted/40 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-exia-text-muted/40 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-exia-text-muted/40 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={handleSend} disabled={loading || !activeId} placeholder={activeId ? undefined : "Créez une nouvelle discussion pour commencer"} />
      </div>
    </div>
  )
}
