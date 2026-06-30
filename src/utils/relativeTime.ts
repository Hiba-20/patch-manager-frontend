export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return '\u2014'
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 0) return timeUntil(date)

  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export function timeUntil(date: string | Date): string {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return timeAgo(date)

  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return `${Math.floor(diff / 60000)}min`
  if (hours < 24) return `in ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `in ${days}d`
  return formatDate(date)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '\u2014'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '\u2014'
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
