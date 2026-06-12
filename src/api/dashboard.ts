import apiClient from './client'
import type { DashboardStats } from '../types/dashboard'

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>('/dashboard/stats')
  return data
}
