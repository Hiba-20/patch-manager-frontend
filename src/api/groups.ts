import apiClient from './client'

export interface GroupResponse {
  id: string
  name: string
  description: string | null
  host_count: number
}

export interface GroupDetailResponse {
  id: string
  name: string
  description: string | null
  host_ids: string[]
}

export async function getGroups(): Promise<GroupResponse[]> {
  const { data } = await apiClient.get<GroupResponse[]>('/groups')
  return data
}
