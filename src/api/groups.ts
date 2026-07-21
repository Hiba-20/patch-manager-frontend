import apiClient from './client'
import type { DeploymentResponse } from './patches'

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

export interface GroupUpdate {
  name?: string
  description?: string
}

export interface GroupDeployRequest {
  patch_id: string
  scheduled_at?: string
}

export interface GroupDeployResponse {
  deployments: DeploymentResponse[]
  message: string
}

export async function getGroups(): Promise<GroupResponse[]> {
  const { data } = await apiClient.get<GroupResponse[]>('/groups')
  return data
}

export async function createGroup(name: string, description?: string): Promise<GroupResponse> {
  const { data } = await apiClient.post<GroupResponse>('/groups', { name, description })
  return data
}

export async function updateGroup(groupId: string, update: GroupUpdate): Promise<GroupResponse> {
  const { data } = await apiClient.patch<GroupResponse>(`/groups/${groupId}`, update)
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

export async function deployToGroup(groupId: string, req: GroupDeployRequest): Promise<GroupDeployResponse> {
  const { data } = await apiClient.post<GroupDeployResponse>(`/groups/${groupId}/deploy`, req)
  return data
}
