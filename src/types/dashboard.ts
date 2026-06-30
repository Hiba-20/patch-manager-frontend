export interface DashboardStats {
  // Original fields
  total_hosts: number
  online_hosts: number
  offline_hosts: number
  critical_high_patches: number
  compliance_rate: number
  critical_count: number
  high_count: number
  medium_count: number
  low_count: number
  hosts_without_data: number

  // New KPI fields
  hosts_never_scanned: number
  avg_days_since_scan: number
  deployment_success_rate: number
  pending_approvals: number
  patch_velocity_current: number
  patch_velocity_previous: number
  reboot_required_count: number
}
