import apiClient from './client'

export interface PatchResponse {
  id: string
  name: string
  version: string
  vendor: string | null
  os_type: string
  severity: string | null
  classification: string | null
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
  classification?: string
  cve_references?: string[]
  ansible_playbook?: string
}

export interface DeploymentCreate {
  patch_id: string
  host_id: string
  scheduled_at?: string
}

export async function getPatches(search?: string, classification?: string): Promise<PatchResponse[]> {
  const params: Record<string, string> = {}
  if (search) params.search = search
  if (classification) params.classification = classification
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

export async function approveDeployment(deploymentId: string, comment?: string): Promise<DeploymentResponse> {
  const params: Record<string, string> = {}
  if (comment) params.comment = comment
  const { data } = await apiClient.patch<DeploymentResponse>(`/patches/deployments/${deploymentId}/approve`, null, { params })
  return data
}

export async function rejectDeployment(deploymentId: string, comment?: string): Promise<DeploymentResponse> {
  const params: Record<string, string> = {}
  if (comment) params.comment = comment
  const { data } = await apiClient.patch<DeploymentResponse>(`/patches/deployments/${deploymentId}/reject`, null, { params })
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

export interface BulkOperationResponse {
  succeeded: string[]
  failed: string[]
  message: string
}

export async function bulkApproveDeployments(deploymentIds: string[], comment?: string): Promise<BulkOperationResponse> {
  const { data } = await apiClient.patch<BulkOperationResponse>('/patches/deployments/bulk-approve', { deployment_ids: deploymentIds, comment })
  return data
}

export async function bulkRejectDeployments(deploymentIds: string[], comment?: string): Promise<BulkOperationResponse> {
  const { data } = await apiClient.patch<BulkOperationResponse>('/patches/deployments/bulk-reject', { deployment_ids: deploymentIds, comment })
  return data
}

export interface ApprovalLogEntry {
  id: string
  deployment_id: string
  admin_id: string
  admin_name: string
  action: string
  comment: string | null
  created_at: string
}

export async function getDeploymentApprovalLog(deploymentId: string): Promise<ApprovalLogEntry[]> {
  const { data } = await apiClient.get<ApprovalLogEntry[]>(`/patches/deployments/${deploymentId}/approval-log`)
  return data
}

export interface AffectedHostResponse {
  host_id: string
  hostname: string
  ip_address: string
  os_type: string
  severity: string
}

export interface AffectedHostsResponse {
  patch_kb_id: string
  total_affected: number
  hosts: AffectedHostResponse[]
}

export async function getPatchAffectedHosts(patchId: string): Promise<AffectedHostsResponse> {
  const { data } = await apiClient.get<AffectedHostsResponse>(`/patches/${patchId}/affected-hosts`)
  return data
}
