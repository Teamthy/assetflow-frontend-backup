'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/lib/stores/auth'
import { normalizeRole } from '@/lib/utils/roles'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const reason = searchParams.get('reason')

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [hasHydrated, isAuthenticated, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: formResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      const responseData = response.data?.data ?? response.data
      const user = responseData?.user
      if (!user) throw new Error('Sign-in failed. Try again.')
      const organization = responseData?.organization
      if (!organization) throw new Error('No organization on this account.')
      const accessToken = responseData?.accessToken
      if (!accessToken) throw new Error('Sign-in failed. Try again.')

      setAuth({
        user: { ...user, fullName: `${user.firstName} ${user.lastName}` },
        organization,
        accessToken,
        refreshToken: responseData?.refreshToken ?? '',
        role: normalizeRole(responseData?.role ?? responseData?.member?.role, 'standard_staff'),
      })

      router.push('/dashboard')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Invalid email or password'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Use your work email and password.</p>

      <form method="post" action="#" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        {reason === 'session-expired' && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Your session expired. Sign in again.
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={fieldClass}
            required
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Password"
              className={`${fieldClass} pr-16`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 text-xs font-medium text-slate-500"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        No account?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
          Create one
        </Link>
      </p>
    </div>
  )
}
