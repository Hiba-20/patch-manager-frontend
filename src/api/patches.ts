import apiClient from './client'

export interface PatchResponse {
  id: string
  name: string
  version: string
  vendor: string | null
  os_type: string
  severity: string | null
  cve_references: string[]
  created_at: string
}

export interface DeploymentResponse {
  id: string
  patch_id: string
  host_id: string
  hostname: string
  patch_name: string
  severity: string | null
  status: string
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  approved_by: string | null
  logs: string | null
}

export interface PatchCreate {
  name: string
  version: string
  vendor?: string
  os_type?: string
  severity?: string
  cve_references?: string[]
  ansible_playbook?: string
}

export interface DeploymentCreate {
  patch_id: string
  host_id: string
  scheduled_at?: string
}

export async function getPatches(search?: string): Promise<PatchResponse[]> {
  const params = search ? { search } : {}
  const { data } = await apiClient.get<PatchResponse[]>('/patches', { params })
  return data
}

export async function getPatch(patchId: string): Promise<PatchResponse> {
  const { data } = await apiClient.get<PatchResponse>(`/patches/${patchId}`)
  return data
}

export async function createPatch(req: PatchCreate): Promise<PatchResponse> {
  const { data } = await apiClient.post<PatchResponse>('/patches', req)
  return data
}

export async function deletePatch(patchId: string): Promise<void> {
  await apiClient.delete(`/patches/${patchId}`)
}

export async function getDeployments(): Promise<DeploymentResponse[]> {
  const { data } = await apiClient.get<DeploymentResponse[]>('/patches/deployments/all')
  return data
}

export async function createDeployment(req: DeploymentCreate): Promise<DeploymentResponse> {
  const { data } = await apiClient.post<DeploymentResponse>('/patches/deployments', req)
  return data
}

export async function approveDeployment(deploymentId: string): Promise<DeploymentResponse> {
  const { data } = await apiClient.patch<DeploymentResponse>(`/patches/deployments/${deploymentId}/approve`)
  return data
}

export async function rejectDeployment(deploymentId: string): Promise<DeploymentResponse> {
  const { data } = await apiClient.patch<DeploymentResponse>(`/patches/deployments/${deploymentId}/reject`)
  return data
}

export async function cancelDeployment(deploymentId: string): Promise<DeploymentResponse> {
  const { data } = await apiClient.post<DeploymentResponse>(`/patches/deployments/${deploymentId}/cancel`)
  return data
}

export async function retryDeployment(deploymentId: string): Promise<DeploymentResponse> {
  const { data } = await apiClient.post<DeploymentResponse>(`/patches/deployments/${deploymentId}/retry`)
  return data
}
