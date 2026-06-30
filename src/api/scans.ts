import apiClient from './client'
import type { LatestScanResponse } from '../types/scan'

export async function getLatestScan(hostId: string): Promise<LatestScanResponse> {
  const { data } = await apiClient.get<LatestScanResponse>(`/scans/hosts/${hostId}/latest`)
  return data
}
