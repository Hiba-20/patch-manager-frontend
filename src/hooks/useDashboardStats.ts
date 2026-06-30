import { useState, useEffect } from 'react'
import { getDashboardStats } from '../api/dashboard'
import type { DashboardStats } from '../types/dashboard'

interface UseDashboardStatsResult {
  data: DashboardStats | null
  loading: boolean
  error: string | null
}

export function useDashboardStats(): UseDashboardStatsResult {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getDashboardStats()
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
