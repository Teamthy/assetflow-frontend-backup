'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
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
  const isFirstLogin = useAuthStore((s) => s.isFirstLogin)
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  const setFirstLoginComplete = useAuthStore((s) => s.setFirstLoginComplete)
  const user = useAuthStore((s) => s.user)
  const organization = useAuthStore((s) => s.organization)
  const { completedSteps, markStepComplete } = useOnboardingStore()
  const [phase, setPhase] = useState<Phase>('wizard')
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    if (!hasHydrated) return

    if (!isFirstLogin) {
      router.replace('/dashboard')
      return
    }

    setPhase('wizard')
  }, [hasHydrated, isFirstLogin, router])

  const goNext = () => {
    markStepComplete(currentStep)
    if (currentStep === 4) { setPhase('complete'); return }
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  const goBack = () => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(1, s - 1))
  }

  const skipStep = () => {
    if (currentStep === 4) { setPhase('complete'); return }
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  const finish = () => {
    setFirstLoginComplete()
    router.push('/dashboard')
  }

  const firstName = user?.firstName ?? user?.fullName?.split(' ')[0] ?? 'there'

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome to AssetFlow, {firstName}!
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              Your organization{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                {organization?.name}
              </strong>{' '}
              is ready.
            </p>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-700 mb-6" />

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">
            Let us help you get set up in 3 simple steps
          </p>

          <div className="space-y-3 mb-8">
            {[
              { n: '①', title: 'Configure your organization', desc: 'Set your capitalization policy and fiscal year.', time: '5 min' },
              { n: '②', title: 'Add your assets', desc: 'Import your existing Excel register or add assets manually.', time: '10 min' },
              { n: '③', title: 'Invite your team', desc: 'Add your Finance Manager, Branch Managers, and staff.', time: '2 min' },
            ].map((step) => (
              <motion.button
                key={step.n}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setPhase('wizard')}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card text-left hover:border-brand-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{step.n}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0 ml-4">{step.time} →</span>
              </motion.button>
            ))}
          </div>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPhase('wizard')}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
            >
              Start Setup — Step 1
            </motion.button>
            <button
              onClick={finish}
              className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip for now → go to dashboard
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-10 shadow-modal text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            You are all set, {firstName}!
          </h2>
          <p className="text-slate-500 text-sm mb-8">Here is what you have set up:</p>

          <div className="space-y-2.5 mb-8 text-left">
            {[
              { label: `Organization: ${organization?.name}`, done: true },
              { label: 'Accounting policy configured', done: completedSteps.includes(2) },
              { label: 'Branches created', done: completedSteps.includes(3) },
              { label: 'Assets added', done: completedSteps.includes(4) },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <CheckCircle2
                  className={`w-5 h-5 flex-shrink-0 ${item.done ? 'text-emerald-500' : 'text-slate-300'}`}
                />
                <span className={`text-sm font-medium ${item.done ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700 mb-6" />

          <div className="space-y-2 mb-4">
            {[
              { label: 'View your assets', href: '/assets' },
              { label: 'Invite your team', href: '/settings/team' },
              { label: 'View audit summary', href: '/reports/audit' },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="block w-full py-2.5 px-4 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 transition-colors text-center"
              >
                {action.label}
              </a>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={finish}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors"
          >
            Go to Dashboard →
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-bold text-brand-700 dark:text-brand-400">
            Asset<span className="text-brand-500">Flow</span>
          </div>
          <button onClick={finish} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            Skip setup →
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-6 pb-5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-5 overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done = completedSteps.includes(step.id)
              const current = currentStep === step.id
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <motion.div
                    animate={{ backgroundColor: done ? '#16a34a' : current ? '#2563eb' : '#e2e8f0' }}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    {done ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-xs font-bold ${current ? 'text-white' : 'text-slate-400'}`}>{step.id}</span>
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium ml-1.5 hidden sm:block ${current ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700 mx-3" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
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
  const titles = [
    'Tell us about your organization',
    'Configure your accounting policy',
    'Add your locations',
    'Add your assets',
  ]

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
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add your first assets</h2>
          <p className="text-slate-500 mt-2 text-sm">{descriptions[3]}</p>
        </div>
        <div className="space-y-4">
          {[
            { emoji: '📊', label: 'Import from Excel', badge: 'RECOMMENDED', desc: 'Already have an asset register in Excel? Upload it in minutes.', action: () => { onNext(); router.push('/assets/import?from=onboarding') } },
            { emoji: '✏️', label: 'Add assets manually', badge: null, desc: 'Start fresh and add assets one by one.', action: () => { onNext(); router.push('/assets/new?from=onboarding') } },
            { emoji: '⏭️', label: 'Skip for now', badge: null, desc: 'Go to your dashboard and add assets later.', action: onFinish },
          ].map((opt) => (
            <motion.button
              key={opt.label}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={opt.action}
              className="w-full p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-left hover:border-brand-300 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{opt.emoji}</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{opt.label}</p>
                </div>
                {opt.badge && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 pl-12">{opt.desc}</p>
            </motion.button>
          ))}
        </div>
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-700 transition-colors">← Back</button>
      </div>
    )
  }

  return null
}
