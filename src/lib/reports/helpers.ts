export function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function listRows<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  const record = asRecord(value)
  if (Array.isArray(record.data)) return record.data as T[]
  if (Array.isArray(record.items)) return record.items as T[]
  return []
}

export function periodLabel(date = new Date()): string {
  return date.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}
