'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth'
import type { UserRole, ApiError } from '@/types'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const reason = searchParams.get('reason')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)

      // Response shape same as register:
      // { success: true, data: { user, organization, accessToken } }
      const responseData = response.data?.data ?? response.data

      const user = responseData?.user
      if (!user) throw new Error('User not found in response')

      const organization = responseData?.organization
      if (!organization) throw new Error('Organization not found in response')

      const accessToken = responseData?.accessToken
      if (!accessToken) throw new Error('Access token not found')

      const refreshToken = responseData?.refreshToken ?? ''

      const role: UserRole =
        responseData?.member?.role ??
        responseData?.role ??
        'standard_staff'

      const userWithFullName = {
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
      }

      setAuth({
        user: userWithFullName,
        organization,
        accessToken,
        refreshToken,
        role,
      })

      const firstName = user.firstName ?? 'there'
      toast.success(`Welcome back, ${firstName}!`)
      router.push('/dashboard')

    } catch (error: unknown) {
      const err = error as ApiError
      console.error('[Login] Error:', error)
      toast.error(
        err?.response?.data?.message ?? 'Invalid email or password'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full bg-white">
      <div className="hidden w-full md:inline-block">
        <img className="h-full w-full object-cover" src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/leftSideImage.png" alt="leftSideImage" />
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 py-10">
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col items-center justify-center">
          <h2 className="text-4xl font-medium text-gray-900">Sign in</h2>
          <p className="mt-3 text-sm text-gray-500/90">Welcome back! Please sign in to continue</p>

          {reason === 'session-expired' && (
            <div className="mt-4 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left">
              <p className="text-xs font-medium text-amber-700">
                Your session has expired. Please sign in again.
              </p>
            </div>
          )}

          <button type="button" className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gray-500/10">
            <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
          </button>

          <div className="my-5 flex w-full items-center gap-4">
            <div className="h-px w-full bg-gray-300/90"></div>
            <p className="w-full text-nowrap text-sm text-gray-500/90">or sign in with email</p>
            <div className="h-px w-full bg-gray-300/90"></div>
          </div>

          <div className="flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
            </svg>
            <input
              {...register('email')}
              type="email"
              placeholder="Email id"
              className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80"
              required
            />
          </div>
          {errors.email && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.email.message}</p>}

          <div className="mt-6 flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
            </svg>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80"
              required
            />
          </div>
          {errors.password && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.password.message}</p>}

          <div className="mt-8 flex w-full items-center justify-between text-gray-500/80">
            <div className="flex items-center gap-2">
              <input className="h-5" type="checkbox" id="checkbox" />
              <label className="text-sm" htmlFor="checkbox">Remember me</label>
            </div>
            <Link className="text-sm underline" href="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" disabled={isLoading} className="mt-8 h-11 w-full rounded-full bg-indigo-500 text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
          <p className="mt-4 text-sm text-gray-500/90">
            Don’t have an account?{' '}
            <Link className="text-indigo-400 hover:underline" href="/register">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
