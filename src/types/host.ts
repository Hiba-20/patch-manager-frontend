export interface HostResponse {
  id: string
  hostname: string
  ip_address: string
  os_type: string
  status: string
  created_at: string
}

export interface SoftwareItem {
  id: string
  name: string
  version: string | null
  vendor: string | null
  install_date: string | null
  package_manager: string | null
}

export interface PatchOnHost {
  patch_id: string
  patch_name: string
  patch_version: string
  severity: string | null
  status: string
  scheduled_at: string | null
}

export interface HostSoftwareResponse {
  host_id: string
  hostname: string
  software: SoftwareItem[]
  patches: PatchOnHost[]
}
