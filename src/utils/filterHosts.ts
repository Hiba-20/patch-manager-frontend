import type { HostResponse } from '../types/host'

export interface HostFilters {
  search: string
  osType: string
  status: string
}

export const DEFAULT_HOST_FILTERS: HostFilters = {
  search: '',
  osType: '',
  status: '',
}

export function filterHosts(hosts: HostResponse[], filters: HostFilters): HostResponse[] {
  if (!Array.isArray(hosts)) return []
  return hosts.filter((host) => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match =
        host.hostname.toLowerCase().includes(q) ||
        host.ip_address.toLowerCase().includes(q) ||
        host.os_type.toLowerCase().includes(q)
      if (!match) return false
    }
    if (filters.osType && host.os_type.toLowerCase() !== filters.osType.toLowerCase()) return false
    if (filters.status && host.status.toLowerCase() !== filters.status.toLowerCase()) return false
    return true
  })
}

export function getUniqueOsTypes(hosts: HostResponse[]): string[] {
  if (!Array.isArray(hosts)) return []
  return [...new Set(hosts.map((h) => h.os_type).filter(Boolean))]
}

export function getUniqueStatuses(hosts: HostResponse[]): string[] {
  if (!Array.isArray(hosts)) return []
  return [...new Set(hosts.map((h) => h.status).filter(Boolean))]
}
