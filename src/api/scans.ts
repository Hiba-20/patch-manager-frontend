import apiClient from './client'
import type { LatestScanResponse, ScanResponse } from '../types/scan'

export interface ScanHistoryItem {
  id: string
  status: string
  started_at: string | null
  finished_at: string | null
  duration_seconds: number
  patch_count: number
  hostname: string
}

export async function getLatestScan(hostId: string): Promise<LatestScanResponse> {
  const { data } = await apiClient.get<LatestScanResponse>(`/scans/hosts/${hostId}/latest`)
  return data
}

export async function getHostScanHistory(hostId: string): Promise<ScanHistoryItem[]> {
  const { data } = await apiClient.get<ScanHistoryItem[]>(`/scans/hosts/${hostId}`)
  return data
}

export async function triggerScan(hostId: string): Promise<ScanResponse> {
  const { data } = await apiClient.post<ScanResponse>('/scans', {
    host_id: hostId,
    scan_type: 'inventory',
  })
  return data
}
