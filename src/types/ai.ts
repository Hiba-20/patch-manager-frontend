export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  session_id?: string
}

export interface ChatResponse {
  response: string
  intent: string
  confidence: number
  language: string
  session_id: string
  data_used: object | null
}

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface ConversationSummary {
  session_id: string
  title: string
  message_count: number
  created_at: string
  updated_at: string
}

export interface CreateConversationResponse {
  session_id: string
  title: string
  created_at: string
}

export interface ConversationMessages {
  session_id: string
  messages: ChatMessage[]
}
