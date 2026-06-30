import apiClient from './client'

export interface AuditLogResponse {
  id: string
  user_id: string | null
  action: string
  target_host_id: string | null
  status: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  timestamp: string
}

export async function getAuditLogs(limit = 50, offset = 0): Promise<AuditLogResponse[]> {
  const { data } = await apiClient.get<AuditLogResponse[]>('/audit-logs', {
    params: { limit, offset },
  })
  return data
}
