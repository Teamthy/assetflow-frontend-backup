"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { StepOrgProfile } from "@/components/onboarding/StepOrgProfile"
import { StepAccountingPolicy } from "@/components/onboarding/StepAccountingPolicy"
import { StepBranches } from "@/components/onboarding/StepBranches"
import { StepAssets } from "@/components/onboarding/StepAssets"
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete"

const STEPS = [
  { id: 1, title: "Organization" },
  { id: 2, title: "Policy" },
  { id: 3, title: "Branches" },
  { id: 4, title: "Assets" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [direction, setDirection] = useState(1)

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => [...new Set([...prev, step])])
  }

  const goToNext = () => {
    markStepComplete(currentStep)
    if (currentStep === STEPS.length) {
      setIsComplete(true)
      return
    }
    setDirection(1)
    setCurrentStep((s) => s + 1)
  }

  const goToPrev = () => {
    setDirection(-1)
    setCurrentStep((s) => s - 1)
  }

  const skip = () => {
    router.push("/dashboard")
  }

  if (isComplete) {
    return <OnboardingComplete completedSteps={completedSteps} />
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-bold text-brand-700 dark:text-brand-400">
            Asset<span className="text-brand-500">Flow</span>
          </div>
          <button
            onClick={skip}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Skip setup
          </button>
        </div>
      </div>

      {/* Step indicators */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
        <div className="max-w-3xl mx-auto px-6 py-5">

          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-brand-500 rounded-full"
              animate={{ width: `${((currentStep - 1) / STEPS.length) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>

          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = currentStep === step.id

              return (
                <div key={step.id} className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      backgroundColor: isCompleted ? "#16a34a" : isCurrent ? "#2563eb" : "#e2e8f0",
                      scale: isCurrent ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    {isCompleted ? (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </motion.svg>
                    ) : (
                      <span className={`text-xs font-bold ${isCurrent ? "text-white" : "text-slate-500"}`}>
                        {step.id}
                      </span>
                    )}
                  </motion.div>

                  <div className="hidden sm:block">
                    <p className={`text-xs font-semibold transition-colors ${isCurrent ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>
                      {step.title}
                    </p>
                  </div>

                  {i < STEPS.length - 1 && (
                    <div className="mx-2">
                      <div className="h-px bg-slate-200 dark:bg-slate-700 w-6" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={{
              enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {currentStep === 1 && <StepOrgProfile onNext={goToNext} onSkip={goToNext} />}
            {currentStep === 2 && <StepAccountingPolicy onNext={goToNext} onBack={goToPrev} onSkip={goToNext} />}
            {currentStep === 3 && <StepBranches onNext={goToNext} onBack={goToPrev} onSkip={goToNext} />}
            {currentStep === 4 && <StepAssets onNext={goToNext} onBack={goToPrev} onSkip={skip} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}