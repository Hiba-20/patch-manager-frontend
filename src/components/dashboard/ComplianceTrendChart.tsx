import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import type { TrendPoint } from '../../types/trend'

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: TrendPoint }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl border border-exia-border/60 bg-exia-elevated/90 backdrop-blur-md px-4 py-3 shadow-card-md text-sm">
      <p className="text-[11px] font-medium text-exia-text-muted mb-1">
        {format(parseISO(d.date), 'MMM d, yyyy')}
      </p>
      <p className="font-semibold text-exia-cyan">
        {d.compliance_rate.toFixed(1)}% compliant
      </p>
      <p className="text-xs text-exia-text-secondary mt-0.5">
        {d.online_hosts} online / {d.total_hosts} total
      </p>
    </div>
  )
}

interface ComplianceTrendChartProps {
  data: TrendPoint[]
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] text-exia-text-muted text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-exia-cyan animate-pulse-slow" />
          Collecting data...
        </div>
        <p>Visit this page daily to build compliance trend history</p>
      </div>
    )
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: string) => format(parseISO(val), 'MMM d')}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
           <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--accent-cyan)', strokeWidth: 1, strokeOpacity: 0.2 }} />
          <Area
            type="monotone"
            dataKey="compliance_rate"
            stroke="#22d3ee"
            strokeWidth={2}
            fill="url(#complianceGradient)"
            animationDuration={600}
            animationEasing="ease-out"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--accent-cyan)', stroke: 'var(--card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
