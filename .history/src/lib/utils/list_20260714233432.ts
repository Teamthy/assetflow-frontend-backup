export function normalizeListResponse<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]

  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>
    if (Array.isArray(candidate.data)) return candidate.data as T[]
    if (Array.isArray(candidate.items)) return candidate.items as T[]
    if (candidate.data && typeof candidate.data === 'object') {
      const nested = candidate.data as Record<string, unknown>
      if (Array.isArray(nested.data)) return nested.data as T[]
      if (Array.isArray(nested.items)) return nested.items as T[]
    }
  }

  return [] as T[]
}
