import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react'

export type DeployStatus = 'pending' | 'deploying' | 'success' | 'failed' | 'rebooting' | 'scheduled'

export interface DeploymentTask {
  id: string
  hostId: string
  hostname: string
  kbId: string
  title: string
  severity: string
  status: DeployStatus
  startedAt: Date
  finishedAt?: Date
  message?: string
}

export interface DeploymentGroup {
  kbId: string
  title: string
  severity: string
  tasks: DeploymentTask[]
}

interface ActiveDeploymentsContextType {
  groups: DeploymentGroup[]
  addTask: (hostId: string, hostname: string, kbId: string, title: string, severity: string) => string
  updateTask: (taskId: string, partial: Partial<DeploymentTask>) => void
  removeTask: (taskId: string) => void
  clearCompleted: () => void
  totalActive: number
}

const ActiveDeploymentsContext = createContext<ActiveDeploymentsContextType | null>(null)

let taskCounter = 0

export function ActiveDeploymentsProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<DeploymentTask[]>([])

  const groups = useMemo(() => {
    const map = new Map<string, DeploymentTask[]>()
    for (const t of tasks) {
      const key = t.kbId
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return Array.from(map.entries()).map(([kbId, ts]) => ({
      kbId,
      title: ts[0].title,
      severity: ts[0].severity,
      tasks: ts,
    }))
  }, [tasks])

  const addTask = useCallback((hostId: string, hostname: string, kbId: string, title: string, severity: string) => {
    const id = `deploy-${++taskCounter}`
    setTasks((prev) => [...prev, { id, hostId, hostname, kbId, title, severity, status: 'pending', startedAt: new Date() }])
    return id
  }, [])

  const updateTask = useCallback((taskId: string, partial: Partial<DeploymentTask>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...partial } : t)))
  }, [])

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => t.status === 'pending' || t.status === 'deploying' || t.status === 'scheduled'))
  }, [])

  const totalActive = useMemo(() => tasks.filter((t) => t.status === 'pending' || t.status === 'deploying' || t.status === 'scheduled').length, [tasks])

  return (
    <ActiveDeploymentsContext.Provider value={{ groups, addTask, updateTask, removeTask, clearCompleted, totalActive }}>
      {children}
    </ActiveDeploymentsContext.Provider>
  )
}

export function useActiveDeployments(): ActiveDeploymentsContextType {
  const ctx = useContext(ActiveDeploymentsContext)
  if (!ctx) throw new Error('useActiveDeployments must be used within ActiveDeploymentsProvider')
  return ctx
}
