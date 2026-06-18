export interface MissingUpdate {
  kb_id: string
  title: string
  severity: string
  categories: string[]
  installed: boolean
}

export interface MissingUpdatesResponse {
  host_id: string
  hostname: string
  cached_at: string | null
  updates: MissingUpdate[]
}

export interface DashboardMissingUpdate {
  host_id: string
  hostname: string
  kb_id: string
  title: string
  severity: string
}

export interface DashboardMissingUpdatesResponse {
  total_missing: number
  hosts_affected: number
  updates: DashboardMissingUpdate[]
}

export interface DeployPatchResponse {
  deployment_id: string
  patch_id: string
  host_id: string
  hostname: string
  kb_id: string
  status: string
  reboot_required: boolean
  details: string
}
