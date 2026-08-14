'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { useAuthStore } from '@/lib/stores/auth'
import { normalizeRole } from '@/lib/utils/roles'

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
    organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function RegisterPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
    if (typeof window !== 'undefined' && window.location.search) {
      router.replace('/register')
    }
  }, [router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: formResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const { confirmPassword: _confirmPassword, ...submitData } = data
      const response = await authApi.register(submitData)
      const responseData = response.data?.data ?? response.data
      const user = responseData?.user
      if (!user) throw new Error('Could not create the account.')
      const organization = responseData?.organization
      if (!organization) throw new Error('Could not create the organization.')
      const accessToken = responseData?.accessToken
      if (!accessToken) throw new Error('Could not create the account.')

      setAuth({
        user: { ...user, fullName: `${user.firstName} ${user.lastName}` },
        organization,
        accessToken,
        refreshToken: responseData?.refreshToken ?? '',
        role: normalizeRole(responseData?.role ?? responseData?.member?.role, 'admin'),
        isFirstLogin: true,
      })

      router.replace('/onboarding')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Could not create the account'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Create account</h1>
      <p className="mt-1 text-sm text-slate-500">Register your organization.</p>

      <form method="post" action="#" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">First name</label>
            <input {...register('firstName')} placeholder="First name" className={fieldClass} required />
            {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Last name</label>
            <input {...register('lastName')} placeholder="Last name" className={fieldClass} required />
            {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input {...register('email')} type="email" placeholder="you@company.com" className={fieldClass} required />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization</label>
          <input {...register('organizationName')} placeholder="Organization name" className={fieldClass} required />
          {errors.organizationName && <p className="mt-1 text-xs text-red-600">{errors.organizationName.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
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
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
          <input {...register('confirmPassword')} type="password" placeholder="Re-enter password" className={fieldClass} required />
          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={!ready || isLoading}
          className="mt-1 flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {!ready ? 'Loading…' : isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already registered?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </div>
  )
}
