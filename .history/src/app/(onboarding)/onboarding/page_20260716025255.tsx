'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { useOnboardingStore } from '@/lib/stores/onboarding'
import { StepOrgProfile } from '@/components/onboarding/StepOrgProfile'
import { StepAccountingPolicy } from '@/components/onboarding/StepAccountingPolicy'
import { StepBranches } from '@/components/onboarding/StepBranches'

const STEPS = [
  { id: 1, label: 'Organization' },
  { id: 2, label: 'Policy' },
  { id: 3, label: 'Branches' },
  { id: 4, label: 'Assets' },
]

type Phase = 'welcome' | 'wizard' | 'complete'

export default function OnboardingPage() {
  const router = useRouter()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const setFirstLoginComplete = useAuthStore((s) => s.setFirstLoginComplete)
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const { completedSteps, markStepComplete } = useOnboardingStore()
  const [phase, setPhase] = useState<Phase>('welcome')
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (!isFirstLogin) {
      router.replace('/dashboard')
      return
    }

    setPhase('welcome')
  }, [hasHydrated, isAuthenticated, isFirstLogin, router])

  const goNext = () => {
    markStepComplete(currentStep)
    if (currentStep === 4) {
      setPhase('complete')
      return
    }
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const skipStep = () => {
    if (currentStep === 4) {
      setPhase('complete')
      return
    }
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  const finish = () => {
    markStepComplete(4)
    setFirstLoginComplete()
    router.push('/dashboard')
  }

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there'

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-10"
          >
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-50)] text-3xl">
                  ✨
                </div>
              </div>
              <h1 className="text-2xl font-semibold text-[var(--neutral-900)]">
                Welcome to AssetFlow, {firstName}!
              </h1>
              <p className="mt-2 text-sm text-[var(--neutral-500)]">
                Your organization{' '}
                <strong className="text-[var(--neutral-700)]">{organization?.name}</strong>{' '}
                is ready.
              </p>
            </div>

            <div className="mb-6 h-px bg-[var(--border-default)]" />

            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[var(--neutral-400)]">
              Let us help you get set up in 3 simple steps
            </p>

            <div className="mb-8 space-y-3">
              {[
                { n: '01', title: 'Configure your organization', desc: 'Set your capitalization policy and fiscal year.', time: '5 min' },
                { n: '02', title: 'Add your assets', desc: 'Import your existing Excel register or add assets manually.', time: '10 min' },
                { n: '03', title: 'Invite your team', desc: 'Add your Finance Manager, Branch Managers, and staff.', time: '2 min' },
              ].map((step) => (
                <motion.button
                  key={step.n}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setPhase('wizard')}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--border-default)] bg-[var(--neutral-50)] p-4 text-left transition-all hover:border-[var(--brand-600)]"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-base font-semibold text-[var(--brand-600)]">{step.n}</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--neutral-900)]">{step.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--neutral-500)]">{step.desc}</p>
                    </div>
                  </div>
                  <span className="ml-4 flex-shrink-0 text-xs font-medium text-[var(--neutral-400)]">{step.time}</span>
                </motion.button>
              ))}
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPhase('wizard')}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] text-sm font-semibold text-white transition-opacity hover:bg-[var(--brand-700)]"
              >
                Start setup
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <button
                onClick={finish}
                className="w-full py-2.5 text-sm font-medium text-[var(--neutral-500)] transition-colors hover:text-[var(--neutral-700)]"
              >
                Skip for now and go to dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-[var(--surface-page)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 text-center shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-10"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--brand-50)]"
            >
              <span className="text-4xl">🎉</span>
            </motion.div>

            <h2 className="mb-2 text-2xl font-semibold text-[var(--neutral-900)]">
              You are all set, {firstName}!
            </h2>
            <p className="mb-8 text-sm text-[var(--neutral-500)]">Here is what you have set up:</p>

            <div className="mb-8 space-y-2.5 text-left">
              {[
                { label: `Organization: ${organization?.name}`, done: true },
                { label: 'Accounting policy configured', done: completedSteps.includes(2) },
                { label: 'Branches created', done: completedSteps.includes(3) },
                { label: 'Assets added', done: completedSteps.includes(4) },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${item.done ? 'text-emerald-500' : 'text-[var(--neutral-300)]'}`} />
                  <span className={`text-sm font-medium ${item.done ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-400)] line-through'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-6 h-px bg-[var(--border-default)]" />

            <div className="mb-4 space-y-2">
              {[
                { label: 'View your assets', href: '/assets' },
                { label: 'Invite your team', href: '/settings/team' },
                { label: 'View audit summary', href: '/reports/audit' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="block w-full rounded-2xl bg-[var(--neutral-50)] px-4 py-2.5 text-center text-sm font-medium text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-100)]"
                >
                  {action.label}
                </a>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={finish}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-600)] text-sm font-semibold text-white transition-opacity hover:bg-[var(--brand-700)]"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface-page)]">
      <div className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold text-[var(--brand-700)]">
            Asset<span className="text-[var(--brand-500)]">Flow</span>
          </div>
          <button onClick={finish} className="text-sm font-medium text-[var(--neutral-500)] transition-colors hover:text-[var(--neutral-700)]">
            Skip setup
          </button>
        </div>

        <div className="mx-auto max-w-2xl px-6 pb-5">
          <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]">
            <motion.div
              className="h-full rounded-full bg-[var(--brand-600)]"
              animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = completedSteps.includes(step.id)
              const current = currentStep === step.id
              return (
                <div key={step.id} className="flex flex-1 items-center">
                  <motion.div
                    animate={{ backgroundColor: done ? '#16a34a' : current ? 'var(--brand-600)' : 'var(--neutral-200)' }}
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
                  >
                    {done ? (
                      <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-xs font-bold ${current ? 'text-white' : 'text-[var(--neutral-400)]'}`}>{step.id}</span>
                    )}
                  </motion.div>
                  <span className={`ml-1.5 hidden text-xs font-medium sm:block ${current ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-400)]'}`}>
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && <div className="mx-3 h-px flex-1 bg-[var(--border-default)]" />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 px-6 py-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 48 : -48, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -48 : 48, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
            className="w-full"
          >
            <StepContent
              step={currentStep}
              onNext={goNext}
              onBack={goBack}
              onSkip={skipStep}
              onFinish={finish}
              router={router}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function StepContent({ step, onNext, onBack, onSkip, onFinish, router }: {
  step: number
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onFinish: () => void
  router: ReturnType<typeof useRouter>
}) {
  const descriptions = [
    'We use this to personalize your experience and format your reports correctly.',
    'These settings control how AssetFlow classifies your assets. You can change these at any time.',
    'Create branches for each location where you have assets. You can add more later.',
    'Choose how you want to bring your assets into AssetFlow.',
  ]

  if (step === 1) {
    return <StepOrgProfile onNext={onNext} onSkip={onSkip} />
  }

  if (step === 2) {
    return <StepAccountingPolicy onNext={onNext} onBack={onBack} onSkip={onSkip} />
  }

  if (step === 3) {
    return <StepBranches onNext={onNext} onBack={onBack} onSkip={onSkip} />
  }

  if (step === 4) {
    return (
      <div className="space-y-6 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-8 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--neutral-900)]">Add your first assets</h2>
          <p className="mt-2 text-sm text-[var(--neutral-500)]">{descriptions[3]}</p>
        </div>
        <div className="space-y-4">
          {[
            { emoji: '📊', label: 'Import from Excel', badge: 'RECOMMENDED', desc: 'Already have an asset register in Excel? Upload it in minutes.', action: async () => { onNext(); await router.push('/assets/import?from=onboarding') } },
            { emoji: '✏️', label: 'Add assets manually', badge: null, desc: 'Start fresh and add assets one by one.', action: async () => { onNext(); await router.push('/assets/new?from=onboarding') } },
            { emoji: '⏭️', label: 'Skip for now', badge: null, desc: 'Go to your dashboard and add assets later.', action: onFinish },
          ].map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={opt.action}
              className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--neutral-50)] p-6 text-left transition-all hover:border-[var(--brand-600)]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{opt.emoji}</span>
                  <p className="font-semibold text-[var(--neutral-900)]">{opt.label}</p>
                </div>
                {opt.badge && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="pl-12 text-sm text-[var(--neutral-500)]">{opt.desc}</p>
            </motion.button>
          ))}
        </div>
        <button onClick={onBack} className="text-sm font-medium text-[var(--neutral-500)] transition-colors hover:text-[var(--neutral-700)]">
          ← Back
        </button>
      </div>
    )
  }

  return null
}
