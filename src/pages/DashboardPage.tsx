import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Server, Wifi, WifiOff, AlertTriangle, RefreshCw, Activity, TrendingUp, Info, ClipboardCheck } from 'lucide-react'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useTrendHistory } from '../hooks/useTrendHistory'
import { getDeployments } from '../api/patches'
import { StatsCard } from '../components/shared/StatsCard'
import { ComplianceTrendChart } from '../components/dashboard/ComplianceTrendChart'
import { SeverityBreakdownChart } from '../components/dashboard/SeverityBreakdownChart'
import { AggregatedUpdatesTable } from '../components/dashboard/AggregatedUpdatesTable'
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton'
import { ErrorAlert } from '../components/shared/ErrorAlert'
import { TopBar } from '../components/layout/TopBar'

const COLORS = {
  cyan:  '#22d3ee',
  green: '#10b981',
  amber: '#f59e0b',
  red:   '#f43f5e',
  muted: '#1e3050',
}

interface DonutTooltipProps { active?: boolean; payload?: Array<{ name?: string; value?: number | string }> }

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div className="rounded-xl border border-exia-border/60 bg-exia-elevated/90 backdrop-blur-md px-4 py-3 shadow-card-md text-sm">
      <p className="font-medium text-white">{name}</p>
      <p className="text-xs text-exia-text-secondary mt-0.5">{value}</p>
    </div>
  )
}

function DonutLabel({ value, sub, color }: { value: string | number; sub: string; color: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <span className="text-3xl font-bold tabular-nums tracking-tight" style={{ color }}>{value}</span>
      <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-exia-text-secondary">{sub}</span>
    </div>
  )
}

export function DashboardPage() {
  const { data, loading, error, lastUpdated } = useDashboardStats()
  const { history } = useTrendHistory(data)
  const [deployActivity, setDeployActivity] = useState<{ date: string; count: number }[]>([])

  useEffect(() => {
    getDeployments()
      .then((deps) => {
        const last7 = new Date()
        last7.setDate(last7.getDate() - 7)
        const counts: Record<string, number> = {}
        for (const d of deps) {
          const time = d.finished_at || d.started_at || d.scheduled_at
          if (!time) continue
          const date = new Date(time)
          if (date < last7) continue
          const key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          counts[key] = (counts[key] ?? 0) + 1
        }
        setDeployActivity(Object.entries(counts).map(([date, count]) => ({ date, count })))
      })
      .catch(() => {})
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <><TopBar title="Dashboard" /><div className="p-8"><ErrorAlert message={error} /></div></>

  const onlinePie = [
    { name: 'Online',  value: data?.online_hosts  ?? 0 },
    { name: 'Offline', value: data?.offline_hosts ?? 0 },
  ]
  const compRate = data?.compliance_rate ?? 0
  const compliancePie = [
    { name: 'Compliant',     value: data?.online_hosts ?? 0 },
    { name: 'Non-Compliant', value: data?.offline_hosts ?? 0 },
  ]
  const compliantHosts = Math.round(compRate * (data?.total_hosts ?? 0) / 100)

  return (
    <>
      <TopBar title="Dashboard" subtitle="Live" />

      <div className="space-y-7 p-8 animate-slide-up">
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
            trend={data ? Math.round((data.online_hosts / Math.max(data.total_hosts, 1)) * 100) : undefined}
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-exia-cyan" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-exia-text-secondary">
              Fleet Overview
            </span>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-exia-text-muted font-mono">
                Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="depth-card rounded-xl p-6 depth-card-hover">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/20 to-transparent rounded-t-xl" />
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
                Compliance Trend
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-exia-text-muted font-mono">
                <TrendingUp size={12} className="text-exia-cyan" />
                {history.points.length} days
              </div>
            </div>
            <ComplianceTrendChart data={history.points} />
            {history.points.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-exia-text-muted">
                  Latest: <span className="font-semibold text-exia-cyan">{compRate.toFixed(1)}%</span>
                </span>
                <span className="text-exia-text-muted">
                  Range: <span className="font-semibold text-white">
                    {Math.min(...history.points.map(p => p.compliance_rate)).toFixed(0)}%
                    {' \u2014 '}
                    {Math.max(...history.points.map(p => p.compliance_rate)).toFixed(0)}%
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="depth-card rounded-xl p-6 depth-card-hover">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-amber/20 to-transparent rounded-t-xl" />
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
                Unapplied Patches by Severity
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                (data?.critical_high_patches ?? 0) > 0
                  ? 'bg-exia-amber/10 text-exia-amber border-exia-amber/25'
                  : 'bg-exia-green/10 text-exia-green border-exia-green/25'
              }`}>
                {(data?.critical_high_patches ?? 0) > 0 ? 'Action Needed' : 'All Clear'}
              </span>
            </div>
            <SeverityBreakdownChart
              criticalCount={data?.critical_count ?? 0}
              highCount={data?.high_count ?? 0}
              mediumCount={data?.medium_count ?? 0}
              lowCount={data?.low_count ?? 0}
            />
            <p className="mt-2 text-[11px] text-exia-text-muted text-center">
              {(data?.critical_high_patches ?? 0) > 0
                ? `${data?.critical_high_patches} critical or high severity patches require attention`
                : 'All hosts are up to date'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="depth-card rounded-xl p-6 depth-card-hover">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-green/20 to-transparent rounded-t-xl" />
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
                Host Online Status
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-exia-text-muted font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-exia-green animate-pulse-slow" />
                LIVE
              </div>
            </div>
            <div className="relative mt-4" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={onlinePie}
                    cx="50%" cy="50%"
                    innerRadius={68} outerRadius={94}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationDuration={800}
                    animationEasing="ease-out"
                  >
                    <Cell fill={COLORS.green} />
                    <Cell fill={COLORS.muted} />
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <DonutLabel value={data?.online_hosts ?? 0} sub="online" color={COLORS.green} />
            </div>
            <div className="mt-4 flex justify-center gap-6 text-xs">
              <span className="flex items-center gap-2 text-exia-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-exia-green" />
                Online ({data?.online_hosts ?? 0})
              </span>
              <span className="flex items-center gap-2 text-exia-text-secondary">
                <span className="h-2.5 w-2.5 rounded-full bg-exia-muted" />
                Offline ({data?.offline_hosts ?? 0})
              </span>
            </div>
          </div>

          <div className="depth-card rounded-xl p-6 depth-card-hover">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-cyan/20 to-transparent rounded-t-xl" />
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
            <div className="relative mt-4" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={compliancePie}
                    cx="50%" cy="50%"
                    innerRadius={68} outerRadius={94}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    <Cell fill={compRate >= 80 ? COLORS.green : compRate >= 50 ? COLORS.amber : COLORS.red} />
                    <Cell fill={COLORS.muted} />
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
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
                : data && data.hosts_without_data > 0
                ? `${data.hosts_without_data} host(s) have no scan data`
                : `${compliantHosts} of ${data?.total_hosts} hosts fully updated`}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-exia-cyan/15 bg-exia-cyan/[0.04] px-4 py-3 flex items-start gap-3">
          <Info size={14} className="text-exia-cyan mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-exia-text-secondary leading-relaxed">
            Scaling to 200+ hosts? This view lets you patch by update rather than by machine.
            For enterprise caching, pair with <span className="font-semibold text-exia-cyan">WSUS</span> (Windows),
            {' '}<span className="font-semibold text-exia-cyan">apt-cacher-ng</span> or <span className="font-semibold text-exia-cyan">dnf reposync</span> (Linux).
          </p>
        </div>

        <div className="depth-card rounded-xl p-6">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-exia-amber/20 to-transparent rounded-t-xl" />
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-exia-text-secondary">
              Deployment Activity (7 days)
            </p>
            <ClipboardCheck size={14} className="text-exia-cyan" />
          </div>
          <div style={{ height: 160 }}>
            {deployActivity.length === 0 ? (
              <div className="flex items-center justify-center h-full text-exia-text-muted text-xs">
                No recent deployments
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deployActivity}>
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={{ stroke: '#1e3050' }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.2)', borderRadius: '8px', fontSize: '11px' }} labelStyle={{ color: '#94a3b8' }} />
                  <Bar dataKey="count" fill="#22d3ee" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <AggregatedUpdatesTable />
      </div>
    </>
  )
}
