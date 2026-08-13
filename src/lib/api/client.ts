import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/lib/stores/auth'
import { API_BASE_URL } from './config'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 responses
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  const queue = [...failedQueue]
  failedQueue = []
  queue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    if (error.response?.status === 401 && !original._retry) {
      const isRefreshCall = typeof original.url === 'string' && original.url.includes('/auth/refresh-token')
      if (isRefreshCall) {
        return Promise.reject(error)
      }
      const { refreshToken } = useAuthStore.getState()

      // If no refresh token stored, just logout
      if (!refreshToken) {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined' && window.location.pathname !== '/register') {
          window.location.href = '/login?reason=session-expired'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return apiClient(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        )

        const responseData = response.data?.data ?? response.data
        const newAccessToken =
          responseData?.accessToken ??
          responseData?.tokens?.accessToken

        const newRefreshToken =
          responseData?.refreshToken ??
          responseData?.tokens?.refreshToken ??
          refreshToken

        if (!newAccessToken) throw new Error('No access token in refresh response')

        useAuthStore.getState().setTokens(newAccessToken, newRefreshToken)
        if ((responseData?.role || responseData?.user) && useAuthStore.getState().user) {
          const current = useAuthStore.getState()
          if (current.user && current.organization) {
            current.setAuth({
              user: responseData.user ?? current.user,
              organization: responseData.organization ?? current.organization,
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
              role: responseData.role ?? current.role,
              isFirstLogin: current.isFirstLogin,
            })
          }
        }
        processQueue(null, newAccessToken)
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(original)

      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined' && window.location.pathname !== '/register') {
          window.location.href = '/login?reason=session-expired'
        }
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
