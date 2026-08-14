'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth'
import type { UserRole, ApiError } from '@/types'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters'),
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.register(data)

      // Response shape:
      // { success: true, data: { user, organization, accessToken } }
      const responseData = response.data?.data ?? response.data

      const user = responseData?.user
      if (!user) throw new Error('User not found in response')

      const organization = responseData?.organization
      if (!organization) throw new Error('Organization not found in response')

      // Token is at data.accessToken directly
      const accessToken = responseData?.accessToken
      if (!accessToken) throw new Error('Access token not found in response')

      // No refresh token returned by this backend on register
      const refreshToken = responseData?.refreshToken ?? ''

      // No role returned — default to primary_admin on register
      const role: UserRole =
        responseData?.member?.role ??
        responseData?.role ??
        'primary_admin'

      // Build fullName for display
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
        isFirstLogin: true,
      })

      toast.success(`Account created! Welcome, ${user.firstName}!`)
      window.location.assign('/onboarding')

    } catch (error: unknown) {
      const err = error as ApiError
      console.error('[Register] Error:', error)
      const message =
        err?.response?.data?.message ??
        (error as Error)?.message ??
        'Registration failed'
      toast.error(message)
      if (err?.response?.status === 429) {
        toast.error('Too many registration requests. Please wait a moment and try again.')
      }
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
          <h2 className="text-4xl font-medium text-gray-900">Create Account</h2>
          <p className="mt-3 text-sm text-gray-500/90">Create your organization account to get started</p>

          <button type="button" className="mt-8 flex h-12 w-full items-center justify-center rounded-full bg-gray-500/10">
            <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/login/googleLogo.svg" alt="googleLogo" />
          </button>

          <div className="my-5 flex w-full items-center gap-4">
            <div className="h-px w-full bg-gray-300/90"></div>
            <p className="w-full text-nowrap text-sm text-gray-500/90">or sign up with email</p>
            <div className="h-px w-full bg-gray-300/90"></div>
          </div>

          <div className="flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#6B7280"/>
            </svg>
            <input {...register('firstName')} placeholder="First name" className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80" required />
          </div>
          {errors.firstName && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.firstName.message}</p>}

          <div className="mt-6 flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#6B7280"/>
            </svg>
            <input {...register('lastName')} placeholder="Last name" className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80" required />
          </div>
          {errors.lastName && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.lastName.message}</p>}

          <div className="mt-6 flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280"/>
            </svg>
            <input {...register('email')} type="email" placeholder="Email id" className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80" required />
          </div>
          {errors.email && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.email.message}</p>}

          <div className="mt-6 flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280"/>
            </svg>
            <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Password" className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80" required />
          </div>
          {errors.password && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.password.message}</p>}

          <div className="mt-6 flex h-12 w-full items-center overflow-hidden rounded-full border border-gray-300/60 bg-transparent pl-6 gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500">
              <path d="M3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Zm2-2V7a5 5 0 1 1 10 0v1h2V7a7 7 0 0 0-14 0v1h2Z" fill="#6B7280"/>
            </svg>
            <input {...register('organizationName')} placeholder="Organization name" className="h-full w-full bg-transparent text-sm text-gray-500/80 outline-none placeholder-gray-500/80" required />
          </div>
          {errors.organizationName && <p className="mt-2 w-full text-left text-xs text-red-500">{errors.organizationName.message}</p>}

          <button type="submit" disabled={isLoading} className="mt-8 h-11 w-full rounded-full bg-indigo-500 text-white transition-opacity hover:opacity-90 disabled:opacity-60">
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
          <p className="mt-4 text-sm text-gray-500/90">
            Already have an account?{' '}
            <Link className="text-indigo-400 hover:underline" href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
