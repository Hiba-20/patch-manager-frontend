import { useState, useRef, useCallback, useEffect } from 'react'
import { triggerScan, getLatestScan } from '../api/scans'
import type { LatestScanResponse } from '../types/scan'

type ScanState = 'idle' | 'launching' | 'scanning' | 'completed' | 'failed'

interface UseTriggerScanResult {
  state: ScanState
  result: LatestScanResponse | null
  error: string | null
  launch: () => void
  reset: () => void
}

const POLL_INTERVAL = 3000
const MAX_POLLS = 20

export function useTriggerScan(hostId: string | undefined): UseTriggerScanResult {
  const [state, setState] = useState<ScanState>('idle')
  const [result, setResult] = useState<LatestScanResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const pollCountRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current !== undefined) {
      clearInterval(pollRef.current)
      pollRef.current = undefined
    }
    pollCountRef.current = 0
  }, [])

  const launch = useCallback(async () => {
    if (!hostId) return
    setState('launching')
    setError(null)
    setResult(null)

    try {
      const scanResp = await triggerScan(hostId)
      setState('scanning')

      let pollCount = 0
      const poll = setInterval(async () => {
        pollCount++
        pollCountRef.current = pollCount
        try {
          const latest = await getLatestScan(hostId)
          if (latest.status === 'completed') {
            setResult(latest)
            setState('completed')
            clearInterval(poll)
            pollRef.current = undefined
          } else if (latest.status === 'failed') {
            setResult(latest)
            setState('failed')
            clearInterval(poll)
            pollRef.current = undefined
          }
        } catch {
          // continue polling
        }
        if (pollCount >= MAX_POLLS) {
          clearInterval(poll)
          pollRef.current = undefined
          setState(scanResp.status === 'failed' ? 'failed' : 'completed')
        }
      }, POLL_INTERVAL)
      pollRef.current = poll
    } catch (e: unknown) {
      setState('failed')
      setError((e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? (e as Error)?.message ?? 'Failed to launch scan')
    }
  }, [hostId])

  const reset = useCallback(() => {
    stopPolling()
    setState('idle')
    setResult(null)
    setError(null)
  }, [stopPolling])

  useEffect(() => {
    return stopPolling
  }, [stopPolling])

  return { state, result, error, launch, reset }
}
