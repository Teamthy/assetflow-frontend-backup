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
import { normalizeRole } from '@/lib/utils/roles'
import type { ApiError } from '@/types'

const schema = z.object({
  slug: z.string().min(2, 'Organization slug is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

export default function OrgLoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const response = await authApi.orgLogin(data)
      const payload = response.data?.data ?? response.data
      if (!payload?.user || !payload?.organization || !payload?.accessToken) {
        throw new Error('Invalid login response')
      }
      setAuth({
        user: {
          ...payload.user,
          fullName: `${payload.user.firstName} ${payload.user.lastName}`,
        },
        organization: payload.organization,
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken ?? '',
        role: normalizeRole(payload.role, 'standard_staff'),
      })
      toast.success('Welcome back')
      router.push('/dashboard')
    } catch (error: unknown) {
      const err = error as ApiError
      toast.error(err?.response?.data?.message ?? 'Unable to sign in to this organization')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--surface-page)] px-4 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-600)]">Organization</p>
        <h2 className="mt-2 text-3xl font-semibold text-[var(--neutral-900)]">Sign in to a workspace</h2>
        <p className="mt-2 text-sm text-[var(--neutral-500)]">Use your organization slug if you belong to more than one workspace.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <input {...register('slug')} placeholder="organization-slug" className="h-12 w-full rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] px-5 text-sm outline-none" />
            {errors.slug && <p className="mt-2 text-xs text-red-500">{errors.slug.message}</p>}
          </div>
          <div>
            <input {...register('email')} type="email" placeholder="Email address" className="h-12 w-full rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] px-5 text-sm outline-none" />
            {errors.email && <p className="mt-2 text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div>
            <input {...register('password')} type="password" placeholder="Password" className="h-12 w-full rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] px-5 text-sm outline-none" />
            {errors.password && <p className="mt-2 text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isLoading} className="h-11 w-full rounded-full bg-[var(--brand-600)] text-sm font-semibold text-white disabled:opacity-60">
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--neutral-500)]">
          Single organization?{' '}
          <Link href="/login" className="font-semibold text-[var(--brand-600)]">Use regular sign in</Link>
        </p>
      </div>
    </div>
  )
}
