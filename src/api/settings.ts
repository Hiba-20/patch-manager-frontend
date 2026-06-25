import apiClient from './client'

export interface SchedulerStatusResponse {
  next_run_at: string | null
  last_triggered: string | null
  scan_hour: number
  scan_minute: number
  is_running: boolean
  ansible_version: string | null
}

export interface TriggerScanResponse {
  triggered_at: string
  message: string
}

export async function getSchedulerStatus(): Promise<SchedulerStatusResponse> {
  const { data } = await apiClient.get<SchedulerStatusResponse>('/settings/scheduler')
  return data
}

export async function triggerScanNow(): Promise<TriggerScanResponse> {
  const { data } = await apiClient.post<TriggerScanResponse>('/settings/scheduler/trigger')
  return data
}
