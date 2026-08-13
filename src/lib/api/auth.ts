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
    apiClient.post('/auth/organization-login', {
      organizationSlug: data.slug,
      slug: data.slug,
      email: data.email,
      password: data.password,
    }),

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
  }) =>
    apiClient.post('/auth/password-reset/confirm', {
      token: data.otp,
      otp: data.otp,
      newPassword: data.newPassword,
    }),

  changePassword: (data: {
    currentPassword: string
    newPassword: string
  }) => apiClient.post('/auth/change-password', data),

  verifyPassword: (password: string) =>
    apiClient.post('/auth/verify-password', { password }),

  me: () => apiClient.get('/auth/me'),
}
