import { useState, useEffect } from 'react'
import { getHosts } from '../api/hosts'
import type { HostResponse } from '../types/host'

interface UseHostsResult {
  data: HostResponse[]
  loading: boolean
  error: string | null
}

export function useHosts(): UseHostsResult {
  const [data, setData] = useState<HostResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getHosts()
      .then((res) => { if (!cancelled) setData(res) })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { data, loading, error }
}
