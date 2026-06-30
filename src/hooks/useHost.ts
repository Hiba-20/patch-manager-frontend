import { useState, useEffect } from 'react'
import { getHost } from '../api/hosts'
import type { HostResponse } from '../types/host'

interface UseHostResult {
  data: HostResponse | null
  loading: boolean
  error: string | null
}

export function useHost(hostId: string | undefined): UseHostResult {
  const [data, setData] = useState<HostResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hostId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getHost(hostId)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [hostId])

  return { data, loading, error }
}
