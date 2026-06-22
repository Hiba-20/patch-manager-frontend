import apiClient from './client'
import type { DashboardMissingUpdatesResponse, DeployPatchResponse, MissingUpdatesResponse } from '../types/update'

export async function getMissingUpdates(hostId: string): Promise<MissingUpdatesResponse> {
  const { data } = await apiClient.get<MissingUpdatesResponse>(`/hosts/${hostId}/missing-updates`)
  return data
}

export async function getDeepScanUpdates(hostId: string): Promise<MissingUpdatesResponse> {
  const { data } = await apiClient.get<MissingUpdatesResponse>(`/hosts/${hostId}/fast-updates`)
  return data
}

export async function getDashboardMissingUpdates(): Promise<DashboardMissingUpdatesResponse> {
  const { data } = await apiClient.get<DashboardMissingUpdatesResponse>('/dashboard/missing-updates')
  return data
}

export async function deployPatch(hostId: string, kbId: string, title?: string, severity?: string): Promise<DeployPatchResponse> {
  const { data } = await apiClient.post<DeployPatchResponse>(`/hosts/${hostId}/deploy-patch`, {
    kb_id: kbId,
    title: title ?? '',
    severity: severity ?? 'Important',
  })
  return data
}
