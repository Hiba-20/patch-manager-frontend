import { Server, Globe, Cpu, HardDrive, Database, Monitor } from 'lucide-react'
import type { InventoryData } from '../../types/execution-log'

interface InventorySummaryProps {
  data: InventoryData
}

function StatRow({ icon: Icon, label, value, accent }: { icon: typeof Server; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-exia-border/20 last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-exia-border/40 text-exia-text-muted">
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-exia-text-muted">{label}</p>
        <p className={`text-sm font-medium truncate ${accent || 'text-exia-text-primary'}`}>{value}</p>
      </div>
    </div>
  )
}

export function InventorySummary({ data }: InventorySummaryProps) {
  let diskUsedPercent: number | null = null
  let diskTotal: string | null = null
  let diskUsed: string | null = null

  if (typeof data.disk_info === 'string') {
    const diskParts = data.disk_info.match(/(\d+G)\s+(\d+G)\s+(\d+)%/)
    diskUsedPercent = diskParts ? parseInt(diskParts[3]) : null
    diskTotal = diskParts?.[1] ?? null
    diskUsed = diskParts?.[2] ?? null
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="depth-card rounded-xl p-5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-cyan/30 via-exia-cyan/10 to-transparent rounded-t-xl" />
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">System Identity</p>
          <StatRow icon={Server}   label="Hostname"       value={data.hostname || 'Unknown'} />
          <StatRow icon={Globe}    label="IP Address"      value={data.ip_address || 'Unknown'} accent="text-exia-cyan font-mono" />
          <StatRow icon={Monitor}  label="Operating System" value={[data.os_type, data.os_version].filter(Boolean).join(' ') || 'Unknown'} />
          <StatRow icon={Cpu}      label="Architecture"    value={data.os_architecture || 'Unknown'} />
        </div>

        <div className="depth-card rounded-xl p-5">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-exia-green/30 via-exia-green/10 to-transparent rounded-t-xl" />
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-exia-text-muted">Hardware Resources</p>

          {data.cpu_model ? (
            <StatRow icon={Cpu} label="CPU" value={`${data.cpu_model} (${data.cpu_cores ?? '?'} cores)`} />
          ) : null}

          {data.ram_total_gb != null && (
            <div className="py-2.5 border-b border-exia-border/20">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-exia-border/40 text-exia-text-muted">
                  <Database size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-exia-text-muted">Memory</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-exia-text-secondary">{data.ram_total_gb} GB total</span>
                    <span className="text-xs font-medium text-exia-text-primary">{data.ram_used_percent != null ? `${data.ram_used_percent}% used` : 'Unknown'}</span>
                  </div>
                  {data.ram_used_percent != null && (
                    <div className="h-1.5 w-full bg-exia-elevated rounded-full overflow-hidden mt-1.5">
                      <div className="h-full bg-exia-cyan rounded-full transition-all duration-500" style={{ width: `${Math.min(data.ram_used_percent, 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {diskTotal && (
            <div className="py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-exia-elevated border border-exia-border/40 text-exia-text-muted">
                  <HardDrive size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-exia-text-muted">Disk</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-exia-text-secondary">{diskTotal} total</span>
                    <span className="text-xs font-medium text-exia-text-primary">{diskUsed} used</span>
                  </div>
                  {diskUsedPercent != null && (
                    <div className="h-1.5 w-full bg-exia-elevated rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        diskUsedPercent > 90 ? 'bg-exia-red' : diskUsedPercent > 70 ? 'bg-exia-amber' : 'bg-exia-green'
                      }`} style={{ width: `${Math.min(diskUsedPercent, 100)}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
