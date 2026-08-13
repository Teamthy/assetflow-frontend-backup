const LOCAL_HOST = /localhost|127\.0\.0\.1/i
export const API_PROXY_PREFIX = '/backend/api'
export const DIRECT_API_BASE_URL = 'http://127.0.0.1:7000/api'
export function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim() || ''
  if (typeof window !== 'undefined') {
    if (!configured || LOCAL_HOST.test(configured)) return API_PROXY_PREFIX
    return configured.replace(/\/$/, '')
  }
  if (!configured || LOCAL_HOST.test(configured)) return DIRECT_API_BASE_URL
  return configured.replace(/\/$/, '')
}
export const API_BASE_URL = resolveApiBaseUrl()
export const API_HEALTH_CANDIDATES = [`${API_PROXY_PREFIX}/health`, `${DIRECT_API_BASE_URL}/health`]
export const API_HEALTH_URL = API_HEALTH_CANDIDATES[0]
