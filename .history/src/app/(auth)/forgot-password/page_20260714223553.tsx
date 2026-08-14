'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, ArrowLeft, Mail, KeyRound, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { authApi } from '@/lib/api/auth'
import { cn } from '@/lib/utils'

type Step = 'email' | 'otp' | 'password' | 'success'

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type EmailForm = z.infer<typeof emailSchema>

const otpSchema = z.object({
  token: z.string().min(4, 'Enter the code from your email').max(10),
})
type OtpForm = z.infer<typeof otpSchema>

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof passwordSchema>

const RESEND_COOLDOWN_SECONDS = 60

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (resendCooldown === 0) return
    const timer = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleEmailSubmit(values: EmailForm) {
    setError('')
    try {
      await authApi.requestPasswordReset(values.email)
      setEmail(values.email)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setStep('otp')
    } catch {
      // Silent - do not reveal if email exists
      setEmail(values.email)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      setStep('otp')
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !email) return
    try {
      await authApi.requestPasswordReset(email)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success('New code sent')
    } catch {
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
      toast.success('New code sent')
    }
  }

  function handleOtpSubmit(values: OtpForm) {
    setToken(values.token)
    setStep('password')
  }

  async function handlePasswordSubmit(values: PasswordForm) {
    setError('')
    try {
      await authApi.confirmPasswordReset({
        email,
        otp: token,
        newPassword: values.newPassword,
      })
      setStep('success')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e?.response?.data?.message ?? e?.message ?? 'Reset failed. Try requesting a new code.'
      setError(msg)
    }
  }

  return (
    <div>
      <StepIndicator currentStep={step} />

      {step === 'email' && (
        <div>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Enter your email and we&apos;ll send you a verification code
            </p>
          </div>

          <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
              <FormField control={emailForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
                disabled={emailForm.formState.isSubmitting}
              >
                {emailForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending code...
                  </>
                ) : 'Send verification code'}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      )}

      {step === 'otp' && (
        <div>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enter verification code</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              If <span className="font-medium text-slate-700">{email}</span> exists, we sent a code to it.
            </p>
          </div>

          <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
              <FormField control={otpForm.control} name="token" render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter code"
                      autoComplete="one-time-code"
                      autoFocus
                      className="text-center text-lg tracking-wider font-mono h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Code was sent to your email inbox</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
                disabled={otpForm.formState.isSubmitting}
              >
                Continue
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center">
            {resendCooldown > 0 ? (
              <p className="text-sm text-slate-500">
                Resend available in <span className="font-semibold text-slate-700">{resendCooldown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Resend code
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setStep('email'); setError('') }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Use a different email
            </button>
          </div>
        </div>
      )}

      {step === 'password' && (
        <div>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set a new password</h2>
            <p className="text-slate-500 text-sm mt-1.5">
              Choose a strong password you haven&apos;t used before
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-11"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : 'Reset password'}
              </Button>
            </form>
          </Form>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Password reset</h2>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Your password has been updated. Sign in with your new password to continue.
          </p>
          <Button
            onClick={() => router.push('/login')}
            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold w-full h-11"
          >
            Go to sign in
          </Button>
        </div>
      )}
    </div>
  )
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  if (currentStep === 'success') return null

  const steps = [
    { key: 'email', label: 'Email' },
    { key: 'otp', label: 'Code' },
    { key: 'password', label: 'New password' },
  ]
  const currentIdx = steps.findIndex((s) => s.key === currentStep)

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, idx) => {
        const isActive = idx === currentIdx
        const isCompleted = idx < currentIdx
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
              isActive && 'bg-blue-600 text-white ring-4 ring-blue-100',
              isCompleted && 'bg-emerald-500 text-white',
              !isActive && !isCompleted && 'bg-slate-100 text-slate-400'
            )}>
              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                'w-8 h-0.5 transition-all',
                isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}
