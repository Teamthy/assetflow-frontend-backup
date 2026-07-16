import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface OnboardingState {
  completedSteps: number[]
  wizardDismissed: boolean
  bannerDismissed: boolean
  tooltipsShown: string[]
  markStepComplete: (step: number) => void
  dismissWizard: () => void
  dismissBanner: () => void
  markTooltipShown: (key: string) => void
  reset: () => void
  isComplete: () => boolean
}

const TOTAL_STEPS = 4

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completedSteps: [],
      wizardDismissed: false,
      bannerDismissed: false,
      tooltipsShown: [],

      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: [...new Set([...state.completedSteps, step])],
        })),

      dismissWizard: () => set({ wizardDismissed: true }),
      dismissBanner: () => set({ bannerDismissed: true }),

      markTooltipShown: (key) =>
        set((state) => ({
          tooltipsShown: [...new Set([...state.tooltipsShown, key])],
        })),

      reset: () =>
        set({
          completedSteps: [],
          wizardDismissed: false,
          bannerDismissed: false,
          tooltipsShown: [],
        }),

      isComplete: () => get().completedSteps.length >= TOTAL_STEPS,
    }),
    {
      name: 'assetflow-onboarding',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
