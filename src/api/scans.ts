import apiClient from './client'
import type { LatestScanResponse, ScanResponse } from '../types/scan'

export async function getLatestScan(hostId: string): Promise<LatestScanResponse> {
  const { data } = await apiClient.get<LatestScanResponse>(`/scans/hosts/${hostId}/latest`)
  return data
}

export async function triggerScan(hostId: string): Promise<ScanResponse> {
  const { data } = await apiClient.post<ScanResponse>('/scans', {
    host_id: hostId,
    scan_type: 'inventory',
  })
  return data
}
