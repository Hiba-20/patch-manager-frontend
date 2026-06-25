import { useMemo } from 'react'
import { Package } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import type { InventoryData } from '../../types/execution-log'
import { DataTable } from '../shared/DataTable'

interface PackageItem {
  name: string
  version: string
  arch: string
}

function parsePackages(inventoryData: InventoryData): PackageItem[] {
  if (!inventoryData.packages || !Array.isArray(inventoryData.packages)) return []
  return inventoryData.packages
    .map((line) => {
      const parts = line.split('|')
      if (parts.length < 2) return null
      return {
        name: parts[0],
        version: parts[1] || 'unknown',
        arch: parts[2] || 'unknown',
      }
    })
    .filter((p): p is PackageItem => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

interface PackageListProps {
  inventoryData: InventoryData
}

export function PackageList({ inventoryData }: PackageListProps) {
  const packages = useMemo(() => parsePackages(inventoryData), [inventoryData])

  const columns = useMemo<ColumnDef<PackageItem>[]>(() => [
    {
      header: 'Package',
      accessorKey: 'name',
      cell: ({ getValue }) => (
        <div className="flex items-center gap-2">
          <Package size={13} className="text-exia-text-muted" />
          <span className="font-medium text-exia-text-primary">{getValue() as string}</span>
        </div>
      ),
    },
    {
      header: 'Version',
      accessorKey: 'version',
      cell: ({ getValue }) => <span className="font-mono text-xs text-exia-cyan">{getValue() as string}</span>,
    },
    {
      header: 'Architecture',
      accessorKey: 'arch',
      cell: ({ getValue }) => (
        <span className="rounded-md border border-exia-border/40 bg-exia-elevated px-2 py-0.5 text-[11px] font-medium text-exia-text-secondary">
          {getValue() as string}
        </span>
      ),
    },
  ], [])

  return (
    <DataTable
      data={packages}
      columns={columns}
      enableSearch
      searchPlaceholder="Search packages…"
      enableSorting
      pageSize={25}
      emptyState={
        <div className="flex flex-col items-center gap-2 py-8 text-exia-text-muted">
          <Package size={20} className="opacity-50" />
          <p className="text-sm">No package data found in scan results</p>
        </div>
      }
    />
  )
}
