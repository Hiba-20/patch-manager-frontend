import apiClient from './client'
import type { HostResponse, HostSoftwareResponse, HostCreateResponse } from '../types/host'

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

export async function createHost(hostname: string, ipAddress: string, osType: string): Promise<HostCreateResponse> {
  const { data } = await apiClient.post<HostCreateResponse>('/hosts', {
    hostname,
    ip_address: ipAddress,
    os_type: osType,
  })
  return data
}
