'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '@/lib/api/auth'
import { useAuthStore } from '@/lib/stores/auth'
import { variants } from '@/lib/animations/tokens'
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
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)

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

  const features = [
    {
      emoji: '📊',
      title: 'Audit-ready from day one',
      desc: 'Every asset change tracked with full lifecycle history.',
    },
    {
      emoji: '⚡',
      title: 'Import in minutes',
      desc: 'Bring your existing Excel register into AssetFlow fast.',
    },
    {
      emoji: '🏢',
      title: 'Built for Nigeria',
      desc: 'IFRS recognition, naira currency, Nigerian compliance.',
    },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col justify-between w-5/12 bg-brand-900 p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-brand-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-400 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="text-white text-2xl font-bold tracking-tight">
            Asset<span className="text-brand-300">Flow</span>
          </div>
        </div>

        <motion.div
          variants={variants.staggerContainer}
          initial="hidden"
          animate="visible"
          className="relative z-10 space-y-4"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={variants.staggerItem}
              className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
            >
              <span className="text-2xl">{f.emoji}</span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-blue-200 text-xs mt-1">{f.desc}</p>
              </div>
            </motion.div>
          ))}

          <div className="flex items-center gap-6 pt-4">
            {[
              'No credit card required',
              'Free 30-day trial',
              'Import from Excel',
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-300" />
                <span className="text-blue-200 text-xs">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10">
          <p className="text-blue-300 text-xs">
            Trusted by organizations across Nigeria
          </p>
        </div>
      </motion.div>

      {/* Right form panel */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900 overflow-y-auto"
      >
        <div className="w-full max-w-md py-8">
          <div className="lg:hidden text-center mb-8">
            <div className="text-2xl font-bold text-brand-700 dark:text-brand-400">
              Asset<span className="text-brand-500">Flow</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Create your account
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
              Set up your organization in under 2 minutes
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* First + Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  First name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('firstName')}
                    placeholder="Ada"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last name
                </label>
                <input
                  {...register('lastName')}
                  placeholder="Okonkwo"
                  className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Work email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="ada@company.ng"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <AnimatePresence>
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className="h-1 flex-1 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700"
                        >
                          <motion.div
                            className="h-full rounded-full"
                            animate={{
                              width: strength.score >= level ? '100%' : '0%',
                              backgroundColor: strength.color,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      ))}
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Organization Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Organization name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  {...register('organizationName')}
                  placeholder="Dangote Foods Ltd"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
                />
              </div>
              {errors.organizationName && (
                <p className="text-xs text-red-500">
                  {errors.organizationName.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors mt-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-brand-600 font-semibold hover:text-brand-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
