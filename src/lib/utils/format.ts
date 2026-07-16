import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

function safeParseISO(s: string | undefined | null): Date | null {
  if (!s) return null
  try {
    const d = parseISO(s)
    return isValid(d) ? d : null
  } catch {
    return null
  }
}

export function formatCurrency(
  amount: number | undefined | null,
  currency = 'NGN'
): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-NG').format(value)
}

export function formatDate(s: string | undefined | null): string {
  const d = safeParseISO(s)
  return d ? format(d, 'dd MMM yyyy') : '—'
}

export function formatDateTime(s: string | undefined | null): string {
  const d = safeParseISO(s)
  return d ? format(d, 'dd MMM yyyy, HH:mm') : '—'
}

export function formatTimeAgo(s: string | undefined | null): string {
  const d = safeParseISO(s)
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—'
}

export function formatUsefulLife(months: number | undefined | null): string {
  if (months == null) return '—'
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m === 0 ? `${y} year${y === 1 ? '' : 's'}` : `${y}y ${m}m`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`
}
