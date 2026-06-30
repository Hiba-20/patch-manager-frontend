import { useState, useEffect } from 'react'
import { getHostSoftware } from '../api/hosts'
import type { HostSoftwareResponse } from '../types/host'

interface UseHostSoftwareResult {
  data: HostSoftwareResponse | null
  loading: boolean
  error: string | null
}

export function useHostSoftware(hostId: string | undefined): UseHostSoftwareResult {
  const [data, setData] = useState<HostSoftwareResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hostId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getHostSoftware(hostId)
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [hostId])

  return { data, loading, error }
}
