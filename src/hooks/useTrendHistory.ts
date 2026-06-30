import { useState, useEffect, useCallback } from 'react'
import { isSameDay, subDays, format } from 'date-fns'
import type { TrendPoint, TrendHistory } from '../types/trend'
import type { DashboardStats } from '../types/dashboard'

const STORAGE_KEY = 'exia-trend-history'
const MAX_POINTS = 60
const PRUNE_AFTER_DAYS = 60

function loadHistory(): TrendHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { points: [] }
}

function saveHistory(history: TrendHistory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {}
}

export function useTrendHistory(currentStats: DashboardStats | null) {
  const [history, setHistory] = useState<TrendHistory>(loadHistory)

  const recordSnapshot = useCallback(() => {
    if (!currentStats) return
    const now = new Date()
    setHistory((prev) => {
      const points = [...prev.points]
      const todayStr = format(now, 'yyyy-MM-dd')

      const existingIndex = points.findIndex((p) => p.date === todayStr)
      const newPoint: TrendPoint = {
        date: todayStr,
        compliance_rate: currentStats.compliance_rate,
        total_hosts: currentStats.total_hosts,
        online_hosts: currentStats.online_hosts,
        offline_hosts: currentStats.offline_hosts,
        critical_high_patches: currentStats.critical_high_patches,
      }

      if (existingIndex >= 0) {
        points[existingIndex] = newPoint
      } else {
        points.push(newPoint)
      }

      const cutoff = subDays(now, PRUNE_AFTER_DAYS)
      const pruned = points
        .filter((p) => new Date(p.date) >= cutoff)
        .slice(-MAX_POINTS)
        .sort((a, b) => a.date.localeCompare(b.date))

      const updated: TrendHistory = { points: pruned }
      saveHistory(updated)
      return updated
    })
  }, [currentStats])

  useEffect(() => {
    recordSnapshot()
  }, [recordSnapshot])

  const clearHistory = useCallback(() => {
    setHistory({ points: [] })
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { history, recordSnapshot, clearHistory }
}
