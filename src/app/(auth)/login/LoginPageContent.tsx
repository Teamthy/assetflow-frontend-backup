'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { getApiErrorMessage } from '@/lib/api/errors'
import { ApiStatusBanner } from '@/components/auth/ApiStatusBanner'
import { useAuthStore } from '@/lib/stores/auth'
import { normalizeRole } from '@/lib/utils/roles'

const loginSchema = z.object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

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
            if (!user) throw new Error('User not found in response')

            const organization = responseData?.organization
            if (!organization) throw new Error('Organization not found in response')

            const accessToken = responseData?.accessToken
            if (!accessToken) throw new Error('Access token not found')

            const refreshToken = responseData?.refreshToken ?? ''

            const role = normalizeRole(responseData?.role ?? responseData?.member?.role, 'standard_staff')

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
            router.push(role === 'admin' ? '/dashboard?welcome=true' : '/dashboard')
        } catch (error: unknown) {
            console.error('[Login] Error:', error)
            toast.error(getApiErrorMessage(error, 'Invalid email or password'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[var(--surface-page)] px-4 py-10 sm:px-6 lg:px-8">
            <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
                <div className="w-full rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-600)]">Welcome back</p>
                        <h2 className="mt-2 text-3xl font-semibold text-[var(--neutral-900)]">Sign in to AssetFlow</h2>
                        <p className="mt-2 text-sm text-[var(--neutral-500)]">Access your dashboard, approvals, and team workspace.</p>
                    </div>

                    <ApiStatusBanner />

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                        {reason === 'session-expired' && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-left">
                                <p className="text-xs font-medium text-amber-700">Your session has expired. Please sign in again.</p>
                            </div>
                        )}

                        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5">
                            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M0 .55.571 0H15.43l.57.55v9.9l-.571.55H.57L0 10.45zm1.143 1.138V9.9h13.714V1.69l-6.503 4.8h-.697zM13.749 1.1H2.25L8 5.356z" fill="#6B7280" />
                            </svg>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="Email address"
                                className="h-full w-full bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]"
                                required
                            />
                        </div>
                        {errors.email && <p className="mt-2 text-left text-xs text-red-500">{errors.email.message}</p>}

                        <div className="mt-4 flex h-12 w-full items-center gap-2 overflow-hidden rounded-full border border-[var(--border-default)] bg-[var(--neutral-50)] pl-5 pr-3">
                            <svg width="13" height="17" viewBox="0 0 13 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13 8.5c0-.938-.729-1.7-1.625-1.7h-.812V4.25C10.563 1.907 8.74 0 6.5 0S2.438 1.907 2.438 4.25V6.8h-.813C.729 6.8 0 7.562 0 8.5v6.8c0 .938.729 1.7 1.625 1.7h9.75c.896 0 1.625-.762 1.625-1.7zM4.063 4.25c0-1.406 1.093-2.55 2.437-2.55s2.438 1.144 2.438 2.55V6.8H4.061z" fill="#6B7280" />
                            </svg>
                            <input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                className="h-full flex-1 bg-transparent text-sm text-[var(--neutral-700)] outline-none placeholder:text-[var(--neutral-400)]"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-sm font-medium text-[var(--neutral-500)]">
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.password && <p className="mt-2 text-left text-xs text-red-500">{errors.password.message}</p>}

                        <div className="mt-6 flex items-center justify-between text-sm text-[var(--neutral-500)]">
                            <label className="flex items-center gap-2">
                                <input className="h-4 w-4 rounded border-[var(--border-strong)]" type="checkbox" id="checkbox" />
                                Remember me
                            </label>
                            <Link className="font-medium text-[var(--brand-600)] hover:text-[var(--brand-700)]" href="/forgot-password">Forgot password?</Link>
                        </div>

                        <button type="submit" disabled={isLoading} className="mt-7 flex h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] text-sm font-semibold text-white transition-opacity hover:bg-[var(--brand-700)] disabled:opacity-60">
                            {isLoading ? 'Signing in...' : 'Login'}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[var(--neutral-500)]">
                        New to AssetFlow?{' '}
                        <Link className="font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)]" href="/register">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
