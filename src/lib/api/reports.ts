import apiClient from './client'

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    const payload = (response as { data?: unknown }).data
    if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
      return (payload as { data: T }).data
    }
    return payload as T
  }
  return response as T
}

export const reportsApi = {
  assets: async () => {
    const r = await apiClient.get('/reports/assets')
    return unwrap<Record<string, unknown>>(r.data)
  },
  finance: async () => {
    const r = await apiClient.get('/reports/finance')
    return unwrap<Record<string, unknown>>(r.data)
  },
  maintenance: async () => {
    const r = await apiClient.get('/reports/maintenance')
    return unwrap<Record<string, unknown>>(r.data)
  },
  audit: async () => {
    const r = await apiClient.get('/reports/audit')
    return unwrap<Record<string, unknown>>(r.data)
  },
}
