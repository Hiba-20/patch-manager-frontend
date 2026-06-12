import { useState, useEffect } from 'react'
import { getLatestScan } from '../api/scans'
import type { LatestScanResponse } from '../types/scan'

interface UseLatestScanResult {
  data: LatestScanResponse | null
  loading: boolean
  error: string | null
}

export function useLatestScan(hostId: string | undefined): UseLatestScanResult {
  const [data, setData] = useState<LatestScanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hostId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getLatestScan(hostId)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [hostId])

  return { data, loading, error }
}
