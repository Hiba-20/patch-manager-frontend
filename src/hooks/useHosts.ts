import { useState, useEffect, useCallback } from 'react'
import { getHosts } from '../api/hosts'
import type { HostResponse } from '../types/host'

interface UseHostsResult {
  data: HostResponse[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useHosts(): UseHostsResult {
  const [data, setData] = useState<HostResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getHosts()
      .then((res) => {
        if (cancelled) return
        if (Array.isArray(res)) {
          setData(res)
        } else {
          setError('Invalid response format')
        }
      })
      .catch((e) => { if (!cancelled) setError(e?.response?.data?.detail ?? e?.message ?? 'Unknown error') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
