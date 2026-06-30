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

export async function createGroup(name: string, description?: string): Promise<GroupResponse> {
  const { data } = await apiClient.post<GroupResponse>('/groups', { name, description })
  return data
}

export async function deleteGroup(groupId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}`)
}

export async function getGroupDetail(groupId: string): Promise<GroupDetailResponse> {
  const { data } = await apiClient.get<GroupDetailResponse>(`/groups/${groupId}`)
  return data
}

export async function addHostToGroup(groupId: string, hostId: string): Promise<void> {
  await apiClient.post(`/groups/${groupId}/hosts/${hostId}`)
}

export async function removeHostFromGroup(groupId: string, hostId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/hosts/${hostId}`)
}
