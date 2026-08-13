import apiClient from './client'

export const authApi = {
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    organizationName: string
  }) =>
    apiClient.post('/auth/register', {
      ...data,
      accountType: 'organization',
    }),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),

  orgLogin: (data: { slug: string; email: string; password: string }) =>
    apiClient.post('/auth/organization-login', data),

  logout: () => apiClient.post('/auth/logout'),

  logoutAll: () => apiClient.post('/auth/logout-all'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh-token', { refreshToken }),

  requestPasswordReset: (email: string) =>
    apiClient.post('/auth/password-reset/request', { email }),

  confirmPasswordReset: (data: {
    email: string
    otp: string
    newPassword: string
  }) => apiClient.post('/auth/password-reset/confirm', data),

  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }) => apiClient.post('/auth/change-password', data),

  verifyPassword: (password: string) =>
    apiClient.post('/auth/verify-password', { password }),

  me: () => apiClient.get('/auth/me'),
}
