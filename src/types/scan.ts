export interface ScanResponse {
  id: string
  host_id: string
  scan_type: string
  status: string
  scanned_at: string
}

export interface LatestScanResponse {
  scan_id: string
  scan_date: string
  detected_patches_count: number
  status: string
  execution_log: unknown
}
