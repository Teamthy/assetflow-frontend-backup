import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User, Organization, UserRole } from "@/types"
import { normalizeRole } from "@/lib/utils/roles"

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
  hasHydrated: boolean

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
  setHasHydrated: () => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

function inferRole(_user: User | null): UserRole | null {
  return null
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
      hasHydrated: false,

      setAuth: (data) => {
        set({
          user: data.user,
          organization: data.organization,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          role: data.role ? normalizeRole(data.role) : inferRole(data.user),
          isAuthenticated: true,
          isFirstLogin: data.isFirstLogin ?? false,
          hasHydrated: true,
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
      setHasHydrated: () => set({ hasHydrated: true }),

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
          hasHydrated: true,
        })
      },
    }),
    {
      name: "assetflow-auth",
      storage: createJSONStorage(() => localStorage),
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
          role: state.role ? normalizeRole(state.role) : null,
          isAuthenticated: Boolean(state.accessToken || state.isAuthenticated),
          hasHydrated: true,
        } as AuthState
      },
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true })
      },
    },
  ),
)
