export interface InventoryData {
  hostname?: string
  ip_address?: string
  os_type?: string
  os_version?: string
  os_architecture?: string
  cpu_model?: string
  cpu_cores?: number
  ram_total_gb?: number
  ram_used_percent?: number
  disk_info?: string
  packages?: string[]
}

export interface AnsibleEvent {
  event?: string
  event_data?: Record<string, unknown>
  created?: string
  counter?: number
  uuid?: string
  parent_uuid?: string
  runner_ident?: string
}

export interface ExecutionLog {
  scan_type?: string
  ansible_status?: string
  rc?: number
  inventory_data?: InventoryData
  events?: AnsibleEvent[]
}

export interface ParsedScan {
  scanId: string
  scanDate: string
  status: string
  detectedPatchesCount: number
  executionLog: ExecutionLog
  hasInventory: boolean
  hasEvents: boolean
  rawJson: string
}
