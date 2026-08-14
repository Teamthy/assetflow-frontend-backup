'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth'
import type { UserRole, ApiError } from '@/types'

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    organizationName: z
      .string()
      .min(2, 'Organization name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 1) return { score, label: 'Weak', color: '#ef4444' }
  if (score <= 2) return { score, label: 'Fair', color: '#f59e0b' }
  if (score <= 3) return { score, label: 'Good', color: '#3b82f6' }
  if (score <= 4) return { score, label: 'Strong', color: '#10b981' }
  return { score, label: 'Very Strong', color: '#059669' }
}

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password') ?? ''
  const passwordStrength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { confirmPassword: _confirmPassword, ...submitData } = data
      const response = await authApi.register(submitData)

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
    <div className="min-h-screen bg-[var(--surface-page)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
            <div className="mb-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-600)]">Get started</p>
              <h2 className="mt-2 text-3xl font-semibold text-[var(--neutral-900)]">Create your account</h2>
              <p className="mt-2 text-sm text-[var(--neutral-500)]">Set up your organization and begin your asset workflow.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
              <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#6B7280" />
                </svg>
                <input {...register('firstName')} placeholder="First name" className="h-full w-full bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]" required />
              </div>
              {errors.firstName && <p className="mt-2 text-left text-xs text-red-500">{errors.firstName.message}</p>}

              <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#6B7280" />
                </svg>
                <input {...register('lastName')} placeholder="Last name" className="h-full w-full bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]" required />
              </div>
              {errors.lastName && <p className="mt-2 text-left text-xs text-red-500">{errors.lastName.message}</p>}

              <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5">
                <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
                </svg>
                <input {...register('email')} type="email" placeholder="Email address" className="h-full w-full bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]" required />
              </div>
              {errors.email && <p className="mt-2 text-left text-xs text-red-500">{errors.email.message}</p>}

              <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5 pr-3">
                <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                </svg>
                <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Password" className="h-full flex-1 bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm font-medium text-[var(--neutral-500)]">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-left text-xs text-red-500">{errors.password.message}</p>}

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-medium text-[var(--neutral-500)]">
                  <span>Password strength</span>
                  <span style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{ width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color }}
                  />
                </div>
              </div>

              <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5 pr-3">
                <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                </svg>
                <input {...register('confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" className="h-full flex-1 bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-sm font-medium text-[var(--neutral-500)]">
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-2 text-left text-xs text-red-500">{errors.confirmPassword.message}</p>}

              <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500">
                  <path d="M3 10h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Zm2-2V7a5 5 0 1 1 10 0v1h2V7a7 7 0 0 0-14 0v1h2Z" fill="#6B7280" />
                </svg>
                <input {...register('organizationName')} placeholder="Organization name" className="h-full w-full bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]" required />
              </div>
              {errors.organizationName && <p className="mt-2 text-left text-xs text-red-500">{errors.organizationName.message}</p>}

              <button type="submit" disabled={isLoading} className="mt-7 flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] text-sm font-semibold text-white transition-opacity hover:bg-[var(--brand-700)] disabled:opacity-60">
                {isLoading ? 'Creating account...' : 'Create Account'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--neutral-500)]">
              Already have an account?{' '}
              <Link className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]" href="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
