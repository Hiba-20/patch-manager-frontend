import apiClient from './client'

export interface InviteResponse {
  id: string
  code: string
  created_by: string
  created_by_email: string
  used_by: string | null
  used_by_email: string | null
  expires_at: string
  max_uses: number
  use_count: number
  is_valid: boolean
  created_at: string
}

export interface InviteCreateResponse {
  id: string
  code: string
  url: string
  expires_at: string
}

export async function getInvites(): Promise<InviteResponse[]> {
  const { data } = await apiClient.get<InviteResponse[]>('/auth/invites')
  return data
}

export async function createInvite(maxUses = 1, expiresInHours = 48): Promise<InviteCreateResponse> {
  const { data } = await apiClient.post<InviteCreateResponse>('/auth/invites', {
    max_uses: maxUses,
    expires_in_hours: expiresInHours,
  })
  return data
}

export async function revokeInvite(inviteId: string): Promise<void> {
  await apiClient.delete(`/auth/invites/${inviteId}`)
}
