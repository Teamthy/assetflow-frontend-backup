const LOCAL_HOST = /localhost|127\.0\.0\.1/i

export const API_PROXY_PREFIX = '/backend/api'

export const DEFAULT_API_TARGET = 'http://127.0.0.1:6000'

export function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim() || ''

  if (typeof window !== 'undefined') {
    if (!configured || LOCAL_HOST.test(configured)) {
      return API_PROXY_PREFIX
    }
    return configured.replace(/\/$/, '')
  }

  if (!configured || LOCAL_HOST.test(configured)) {
    const target = (process.env.API_PROXY_TARGET || DEFAULT_API_TARGET).replace(
      /\/$/,
      '',
    )
    return `${target}/api`
  }

  return configured.replace(/\/$/, '')
}

export const API_BASE_URL = resolveApiBaseUrl()

export const API_HEALTH_URL = `${API_BASE_URL}/health`
