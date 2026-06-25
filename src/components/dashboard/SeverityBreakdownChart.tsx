import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#f43f5e',
  High: '#f59e0b',
  Medium: '#eab308',
  Low: '#10b981',
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: { severity: string; count: number; fill: string }; value: number }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-exia-border/60 bg-exia-elevated/90 backdrop-blur-md px-4 py-3 shadow-card-md text-sm">
      <p className="font-semibold text-exia-text-primary">{d.severity}</p>
      <p className="text-xs text-exia-text-secondary mt-0.5">
        {d.count} patch{d.count !== 1 ? 'es' : ''}
      </p>
    </div>
  )
}

interface SeverityBreakdownChartProps {
  criticalCount: number
  highCount: number
  mediumCount?: number
  lowCount?: number
}

export function SeverityBreakdownChart({
  criticalCount,
  highCount,
  mediumCount = 0,
  lowCount = 0,
}: SeverityBreakdownChartProps) {
  const data = [
    { severity: 'Critical', count: criticalCount, fill: SEVERITY_COLORS.Critical },
    { severity: 'High', count: highCount, fill: SEVERITY_COLORS.High },
    { severity: 'Medium', count: mediumCount, fill: SEVERITY_COLORS.Medium },
    { severity: 'Low', count: lowCount, fill: SEVERITY_COLORS.Low },
  ].filter((d) => d.count > 0)

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-exia-text-muted text-xs gap-2">
        <span className="text-exia-green text-lg font-bold">0</span>
        <p>No unapplied patches</p>
      </div>
    )
  }

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="severity"
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={600} animationEasing="ease-out" barSize={24}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
