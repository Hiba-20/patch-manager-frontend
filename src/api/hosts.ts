import apiClient from './client'
import type { DiscoveredHost, HostResponse, HostSoftwareResponse, HostCreateResponse } from '../types/host'

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

export async function createHost(hostname: string, ipAddress: string, osType: string, winrmUser?: string, winrmPassword?: string, sshUser?: string, sshPassword?: string): Promise<HostCreateResponse> {
  const { data } = await apiClient.post<HostCreateResponse>('/hosts', {
    hostname,
    ip_address: ipAddress,
    os_type: osType,
    winrm_user: winrmUser || null,
    winrm_password: winrmPassword || null,
    ssh_user: sshUser || null,
    ssh_password: sshPassword || null,
  })
  return data
}

export async function updateHost(hostId: string, data: { hostname?: string; ip_address?: string; os_type?: string; winrm_user?: string; winrm_password?: string; ssh_user?: string; ssh_password?: string }): Promise<HostResponse> {
  const { data: res } = await apiClient.put<HostResponse>(`/hosts/${hostId}`, data)
  return res
}

export async function deleteHost(hostId: string): Promise<void> {
  await apiClient.delete(`/hosts/${hostId}`)
}

export async function getSshPublicKey(): Promise<{ public_key: string }> {
  const { data } = await apiClient.get<{ public_key: string }>('/hosts/ssh-public-key')
  return data
}

export async function scanNetwork(cidr: string, sshUser?: string, winrmUser?: string, winrmPassword?: string): Promise<{ elapsed_seconds: number; hosts: DiscoveredHost[] }> {
  const { data } = await apiClient.post<{ elapsed_seconds: number; hosts: DiscoveredHost[] }>('/hosts/scan-network', {
    cidr,
    ssh_user: sshUser || null,
    winrm_user: winrmUser || null,
    winrm_password: winrmPassword || null,
  })
  return data
}
