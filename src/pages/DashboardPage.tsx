import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Server, Wifi, WifiOff, AlertTriangle, RefreshCw, Activity } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { StatsCard } from '../components/shared/StatsCard'
import { LoadingSpinner } from '../components/shared/LoadingSpinner'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'

/* ── Palette ──────────────────────────────────────────────────── */
const COLORS = {
  cyan:   '#22d3ee',
  green:  '#10b981',
  amber:  '#f59e0b',
  red:    '#f43f5e',
  muted:  '#1a2744',
}

/* ── Custom Recharts Tooltip ──────────────────────────────────── */
// Recharts injects these at runtime into custom content renderers.
// Defining them locally avoids version-dependent internal type paths.
interface CustomTooltipProps {
  active?:  boolean
  payload?: Array<{ name?: string; value?: number | string }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-xl border border-white/[0.08] bg-exia-elevated px-4 py-3 shadow-card text-sm">
      <p className="font-medium text-white">{name}</p>
      <p className="text-exia-text-secondary mt-0.5">{value}</p>
    </div>
  )
}

/* ── Donut center label overlay ───────────────────────────────── */
interface DonutLabelProps {
  value: string | number
  sub: string
  color: string
}
function DonutLabel({ value, sub, color }: DonutLabelProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-3xl font-bold tabular-nums" style={{ color }}>{value}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-exia-text-secondary">{sub}</span>
    </div>
  )
}

/* ── Main Component ───────────────────────────────────────────── */
export function DashboardPage() {
  const { data, loading, error } = useDashboardStats()

  if (loading) return <LoadingSpinner />
  if (error)   return <><TopBar title="Dashboard" /><div className="p-8"><ErrorAlert message={error} /></div></>

  const onlinePie = [
    { name: 'Online',  value: data?.online_hosts  ?? 0 },
    { name: 'Offline', value: data?.offline_hosts ?? 0 },
  ]
  const compRate   = data?.compliance_rate ?? 0
  const compliancePie = [
    { name: 'Compliant',     value: Math.round(compRate * 10) },
    { name: 'Non-Compliant', value: Math.round((100 - compRate) * 10) },
  ]
  const compliantHosts = Math.round(compRate * (data?.total_hosts ?? 0) / 100)

  return (
    <>
      <TopBar title="Dashboard" subtitle="Live" />

      <div className="space-y-7 p-8 animate-slide-up">

        {/* ── Stats row ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Total Hosts"
            value={data?.total_hosts ?? 0}
            icon={<Server size={18} />}
            accent="cyan"
            sublabel="Registered machines"
          />
          <StatsCard
            title="Online"
            value={data?.online_hosts ?? 0}
            icon={<Wifi size={18} />}
            accent="green"
            sublabel="Reachable right now"
          />
          <StatsCard
            title="Offline"
            value={data?.offline_hosts ?? 0}
            icon={<WifiOff size={18} />}
            accent="red"
            sublabel="Unreachable hosts"
          />
          <StatsCard
            title="Critical / High"
            value={data?.critical_high_patches ?? 0}
            icon={<AlertTriangle size={18} />}
            accent="amber"
            sublabel="Unapplied patches"
          />
        </div>

        {/* ── Section header ─────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-exia-cyan" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-exia-text-secondary">
              Fleet Overview
            </span>
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-exia-text-secondary transition-colors hover:border-exia-cyan/30 hover:text-exia-cyan">
            <RefreshCw size={12} />
            Refresh
          </button>
        </div>

        {/* ── Charts row ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* Online Status donut */}
          <div className="relative rounded-xl border border-white/[0.05] bg-exia-card p-6 shadow-card transition-all duration-300 hover:border-white/[0.09]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-green/30 to-transparent rounded-t-xl" />

            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
                Host Online Status
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-exia-text-muted font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-exia-green animate-pulse-slow" />
                LIVE
              </div>
            </div>

            <div className="relative mt-4" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={onlinePie}
                    cx="50%" cy="50%"
                    innerRadius={72} outerRadius={100}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    <Cell fill={COLORS.green} />
                    <Cell fill={COLORS.muted} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <DonutLabel
                value={data?.online_hosts ?? 0}
                sub="online"
                color={COLORS.green}
              />
            </div>

            {/* Legend */}
            <div className="mt-4 flex justify-center gap-6 text-xs">
              <span className="flex items-center gap-2 text-exia-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-exia-green" />
                Online ({data?.online_hosts ?? 0})
              </span>
              <span className="flex items-center gap-2 text-exia-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.muted }} />
                Offline ({data?.offline_hosts ?? 0})
              </span>
            </div>
          </div>

          {/* Compliance donut */}
          <div className="relative rounded-xl border border-white/[0.05] bg-exia-card p-6 shadow-card transition-all duration-300 hover:border-white/[0.09]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/30 to-transparent rounded-t-xl" />

            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
                Compliance Rate
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                compRate >= 80
                  ? 'bg-exia-green/10 text-exia-green border-exia-green/25'
                  : compRate >= 50
                  ? 'bg-exia-amber/10 text-exia-amber border-exia-amber/25'
                  : 'bg-exia-red/10 text-exia-red border-exia-red/25'
              }`}>
                {compRate >= 80 ? 'Healthy' : compRate >= 50 ? 'Warning' : 'Critical'}
              </span>
            </div>

            <div className="relative mt-4" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compliancePie}
                    cx="50%" cy="50%"
                    innerRadius={72} outerRadius={100}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    <Cell fill={compRate >= 80 ? COLORS.green : compRate >= 50 ? COLORS.amber : COLORS.red} />
                    <Cell fill={COLORS.muted} />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <DonutLabel
                value={`${compRate.toFixed(1)}%`}
                sub="compliant"
                color={compRate >= 80 ? COLORS.green : compRate >= 50 ? COLORS.amber : COLORS.red}
              />
            </div>

            <p className="mt-4 text-center text-xs text-exia-text-muted">
              {data?.total_hosts === 0
                ? 'No hosts registered'
                : `${compliantHosts} of ${data?.total_hosts} hosts fully updated`}
            </p>
          </div>
        </div>

      </div>
    </>
  )
}
