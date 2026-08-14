import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Organization, UserRole } from "@/types"

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`
}

function deleteCookie(name: string) {
  if (typeof window === 'undefined') return
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
}

export interface AuthState {
  user: User | null
  organization: Organization | null
  accessToken: string | null
  refreshToken: string | null
  role: UserRole | null
  isAuthenticated: boolean
  isFirstLogin: boolean

  setAuth: (data: {
    user: User
    organization: Organization
    accessToken: string
    refreshToken?: string
    role?: UserRole | null
    isFirstLogin?: boolean
  }) => void
  setTokens: (accessToken: string, refreshToken?: string) => void
  setFirstLoginComplete: () => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

function inferRole(_user: User | null): UserRole | null {
  return "primary_admin" as UserRole
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      role: null,
      isAuthenticated: false,
      isFirstLogin: false,

      setAuth: (data) => {
        set({
          user: data.user,
          organization: data.organization,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          role: data.role ?? inferRole(data.user),
          isAuthenticated: true,
          isFirstLogin: data.isFirstLogin ?? false,
        })

        setCookie('access-token', data.accessToken, 60 * 60 * 24 * 7)
        if (data.refreshToken) {
          setCookie('refresh-token', data.refreshToken, 60 * 60 * 24 * 30)
        } else {
          deleteCookie('refresh-token')
        }
      },

      setTokens: (accessToken, refreshToken) =>
        set((s) => {
          const nextRefreshToken = refreshToken ?? s.refreshToken
          setCookie('access-token', accessToken, 60 * 60 * 24 * 7)
          if (nextRefreshToken) {
            setCookie('refresh-token', nextRefreshToken, 60 * 60 * 24 * 30)
          } else {
            deleteCookie('refresh-token')
          }
          return {
            accessToken,
            refreshToken: nextRefreshToken,
          }
        }),

      setFirstLoginComplete: () => set({ isFirstLogin: false }),

      updateUser: (updates) =>
        set((s) => ({
          user: s.user ? { ...s.user, ...updates } : s.user,
        })),

      logout: () => {
        deleteCookie('access-token')
        deleteCookie('refresh-token')
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          role: null,
          isAuthenticated: false,
          isFirstLogin: false,
        })
      },
    }),
    {
      name: "assetflow-auth",
      partialize: (s) => ({
        user: s.user,
        organization: s.organization,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        role: s.role,
        isAuthenticated: s.isAuthenticated,
        isFirstLogin: s.isFirstLogin,
      }),
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<AuthState>
        return {
          ...currentState,
          ...state,
          isAuthenticated: Boolean(state.accessToken || state.isAuthenticated),
        } as AuthState
      },
    },
  ),
)
