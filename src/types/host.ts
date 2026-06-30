export interface HostResponse {
  id: string
  hostname: string
  ip_address: string
  os_type: string
  status: string
  created_at: string
}

export interface HostCreateResponse extends HostResponse {
  api_key: string
}

export interface HardwareInfo {
  cpu_model: string | null
  cpu_cores: number | null
  ram_total_gb: number | null
  ram_used_percent: number | null
  disk_total_gb: number | null
  disk_used_percent: number | null
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
  cve_references: string[] | null
}

export interface HostSoftwareResponse {
  host_id: string
  hostname: string
  hardware?: HardwareInfo | null
  software: SoftwareItem[]
  patches: PatchOnHost[]
}
