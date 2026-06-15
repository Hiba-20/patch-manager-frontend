import { useMemo } from 'react'
import type { LatestScanResponse } from '../types/scan'
import type { ParsedScan, ExecutionLog, InventoryData } from '../types/execution-log'

export function useStructuredScan(scan: LatestScanResponse | null): ParsedScan | null {
  return useMemo(() => {
    if (!scan) return null

    const executionLog = (scan.execution_log ?? {}) as ExecutionLog
    const inventoryData = executionLog.inventory_data as InventoryData | undefined

    return {
      scanId: scan.scan_id,
      scanDate: scan.scan_date,
      status: scan.status,
      detectedPatchesCount: scan.detected_patches_count,
      executionLog,
      hasInventory: !!inventoryData && Object.keys(inventoryData).length > 0,
      hasEvents: Array.isArray(executionLog.events) && executionLog.events.length > 0,
      rawJson: JSON.stringify(scan.execution_log, null, 2),
    }
  }, [scan])
}
