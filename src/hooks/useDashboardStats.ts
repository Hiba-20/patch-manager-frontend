import { useState, useEffect, useRef } from 'react'
import { getDashboardStats } from '../api/dashboard'
import type { DashboardStats } from '../types/dashboard'

interface UseDashboardStatsResult {
  data: DashboardStats | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

const POLL_INTERVAL = 30_000

export function useDashboardStats(): UseDashboardStatsResult {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const fetch = () => {
    getDashboardStats()
      .then((res) => {
        setData(res)
        setLastUpdated(new Date())
        setError(null)
      })
      .catch((e) => {
        if (!data) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    fetch()
    intervalRef.current = setInterval(fetch, POLL_INTERVAL)
    return () => { clearInterval(intervalRef.current) }
  }, [])

  return { data, loading, error, lastUpdated }
}
