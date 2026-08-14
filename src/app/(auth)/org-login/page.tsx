'use client'

import { useState } from 'react'
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

const schema = z.object({
  slug: z.string().min(2, 'Organization slug is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

export default function OrgLoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: formResolver(schema) })

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
      router.push('/dashboard')
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, 'Unable to sign in to this organization'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Organization sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Use the organization slug if you belong to more than one workspace.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-3.5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization slug</label>
          <input {...register('slug')} placeholder="acme-holdings" className={fieldClass} />
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input {...register('email')} type="email" placeholder="you@company.com" className={fieldClass} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
          <input {...register('password')} type="password" placeholder="Password" className={fieldClass} />
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isLoading ? 'Signing in…' : 'Continue'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        One organization?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Standard sign in
        </Link>
      </p>
    </div>
  )
}
