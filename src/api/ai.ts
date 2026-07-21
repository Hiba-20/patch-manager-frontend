import apiClient from './client'
import type { ChatResponse, ConversationSummary, ConversationMessages, CreateConversationResponse } from '../types/ai'
import type { ComplianceDocumentResponse, DeploymentDocumentResponse } from '../types/report'

export async function analyzeReport(req: {
  report_type: 'compliance' | 'deployment'
  report_data: ComplianceDocumentResponse | DeploymentDocumentResponse
}): Promise<{ analysis: string }> {
  const { data } = await apiClient.post<{ analysis: string }>('/ai/analyze-report', req)
  return data
}

export async function askAI(question: string, session_id?: string): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>('/ai/chat', { question, session_id })
  return data
}

export async function createConversation(): Promise<CreateConversationResponse> {
  const { data } = await apiClient.post<CreateConversationResponse>('/ai/conversations')
  return data
}

export async function listConversations(): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<ConversationSummary[]>('/ai/conversations')
  return data
}

export async function getConversationMessages(session_id: string): Promise<ConversationMessages> {
  const { data } = await apiClient.get<ConversationMessages>(`/ai/conversations/${session_id}/messages`)
  return data
}

export async function deleteConversationAPI(session_id: string): Promise<void> {
  await apiClient.delete(`/ai/conversations/${session_id}`)
}
