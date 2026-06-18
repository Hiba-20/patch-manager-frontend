import { useState, useCallback } from 'react'
import { deployPatch as apiDeployPatch } from '../api/updates'

type DeployState = 'idle' | 'deploying' | 'success' | 'failed'

interface UseDeployPatchResult {
  kbStates: Record<string, DeployState>
  lastCompleted: { kbId: string; state: 'success' | 'failed' } | null
  deploy: (hostId: string, kbId: string, title?: string, severity?: string) => void
  reset: () => void
}

export function useDeployPatch(): UseDeployPatchResult {
  const [kbStates, setKbStates] = useState<Record<string, DeployState>>({})
  const [lastCompleted, setLastCompleted] = useState<{ kbId: string; state: 'success' | 'failed' } | null>(null)

  const deploy = useCallback(async (hostId: string, kbId: string, title?: string, severity?: string) => {
    setKbStates(prev => ({ ...prev, [kbId]: 'deploying' }))
    setLastCompleted(null)

    try {
      const res = await apiDeployPatch(hostId, kbId, title, severity)
      const newState: DeployState = res.status === 'SUCCESS' ? 'success' : 'failed'
      setKbStates(prev => ({ ...prev, [kbId]: newState }))
      setLastCompleted({ kbId, state: newState })
    } catch {
      setKbStates(prev => ({ ...prev, [kbId]: 'failed' }))
      setLastCompleted({ kbId, state: 'failed' })
    }
  }, [])

  const reset = useCallback(() => {
    setLastCompleted(null)
  }, [])

  return { kbStates, lastCompleted, deploy, reset }
}
