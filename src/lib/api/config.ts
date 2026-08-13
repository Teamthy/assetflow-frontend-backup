export const DEFAULT_API_BASE_URL = 'http://localhost:6000/api'

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL?.trim() || DEFAULT_API_BASE_URL
).replace(/\/$/, '')

export const API_HEALTH_URL = `${API_BASE_URL}/health`
