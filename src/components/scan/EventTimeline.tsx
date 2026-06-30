import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react'
import type { AnsibleEvent } from '../../types/execution-log'

interface EventTimelineProps {
  events: AnsibleEvent[]
}

function getEventIcon(event: AnsibleEvent) {
  const status = event.event_data?.status as string ?? event.event ?? ''
  if (status === 'ok' || event.event === 'runner_on_ok') return CheckCircle2
  if (status === 'failed' || event.event === 'runner_on_failed') return XCircle
  return Clock
}

function getEventColor(event: AnsibleEvent) {
  const status = event.event_data?.status as string ?? event.event ?? ''
  if (status === 'ok' || event.event === 'runner_on_ok') return 'text-exia-green'
  if (status === 'failed' || event.event === 'runner_on_failed') return 'text-exia-red'
  return 'text-exia-text-muted'
}

function getEventLabel(event: AnsibleEvent): string {
  const task = event.event_data?.task as string ?? ''
  const action = event.event_data?.action as string ?? ''
  if (task) return task
  if (action) return `Ansible: ${action}`
  return event.event ?? 'Unknown event'
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-exia-text-muted text-xs">
        <Clock size={24} className="mb-2 opacity-50" />
        No events recorded
      </div>
    )
  }

  return (
    <div className="relative">
      {events.map((event, idx) => {
        const Icon = getEventIcon(event)
        const color = getEventColor(event)
        const isLast = idx === events.length - 1

        return (
          <div key={event.counter ?? idx} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <div className="absolute left-[13px] top-7 bottom-0 w-px bg-exia-border/30" />
            )}
            <div className={`relative flex h-7 w-7 items-center justify-center rounded-full border border-exia-border/40 bg-exia-elevated flex-shrink-0 ${color}`}>
              <Icon size={12} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white truncate">
                  {getEventLabel(event)}
                </p>
                <ArrowRight size={10} className="text-exia-text-muted flex-shrink-0" />
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {event.created && (
                  <span className="text-[10px] font-mono text-exia-text-muted">
                    {new Date(event.created).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                )}
                {event.counter != null && (
                  <span className="text-[10px] font-mono text-exia-text-muted">
                    #{event.counter}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
