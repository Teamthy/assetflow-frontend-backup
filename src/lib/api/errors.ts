import axios from 'axios'

const readApiMessage = (error: unknown): string | undefined => {
  if (!axios.isAxiosError(error)) return undefined
  const data = error.response?.data as {
    message?: string
    errors?: Array<{ path?: Array<string | number>; message?: string }>
  } | undefined

  const issues = Array.isArray(data?.errors) ? data.errors : []
  const details = issues
    .map((issue) => {
      const path = Array.isArray(issue.path) ? issue.path.filter(Boolean).join('.') : ''
      const text = typeof issue.message === 'string' ? issue.message : ''
      if (path && text) return `${path}: ${text}`
      return text
    })
    .filter(Boolean)

  if (details.length > 0) return details.join(' · ')

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
        return 'The request timed out. Try again.'
      }
      return 'Unable to reach the server. Check your connection and try again.'
    }
  }

  if (error instanceof Error && error.message && error.message !== 'Network Error') {
    return error.message
  }

  return fallback
}
