export interface TrendPoint {
  date: string
  compliance_rate: number
  total_hosts: number
  online_hosts: number
  offline_hosts: number
  critical_high_patches: number
}

export interface TrendHistory {
  points: TrendPoint[]
}
