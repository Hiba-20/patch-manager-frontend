import apiClient from './client'
import type { HostResponse, HostSoftwareResponse } from '../types/host'

export async function getHosts(): Promise<HostResponse[]> {
  const { data } = await apiClient.get<HostResponse[]>('/hosts')
  return data
}

export async function getHost(hostId: string): Promise<HostResponse> {
  const { data } = await apiClient.get<HostResponse>(`/hosts/${hostId}`)
  return data
}

export async function getHostSoftware(hostId: string): Promise<HostSoftwareResponse> {
  const { data } = await apiClient.get<HostSoftwareResponse>(`/hosts/${hostId}/software`)
  return data
}
