import axios from 'axios'
import { API_BASE_URL } from './config'

const readApiMessage = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) return undefined
  const data = error.response?.data as { message?: string } | undefined
  return typeof data?.message === 'string' && data.message.trim()
    ? data.message
    : undefined
}

export const isApiUnreachable = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false
  return !error.response
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong',
): string => {
  const apiMessage = readApiMessage(error)
  if (apiMessage) return apiMessage

  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return `The AssetFlow API at ${API_BASE_URL} timed out.`
      }
      return `Cannot reach the AssetFlow API at ${API_BASE_URL}. In assetflowserver run pnpm dev until it logs "API running on port 6000", then open ${API_BASE_URL}/health — it must return {"status":"ok"}.`
    }
  }

  if (error instanceof Error && error.message && error.message !== 'Network Error') {
    return error.message
  }

  return fallback
}
