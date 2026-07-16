import type { AccountingTreatment, RecognitionStatus } from '@/types'

export interface RecognitionInput {
  purchaseCost?: number
  expectedUsefulLifeMonths?: number
  hasFutureEconomicBenefit?: boolean
  costCanBeReliablyMeasured?: boolean
}

export interface RecognitionDecision {
  status: RecognitionStatus
  treatment: AccountingTreatment
  isDepreciable: boolean
  reasons: string[]
  label: string
  description: string
  variant: 'success' | 'info' | 'warning' | 'neutral'
}

// Defaults matching backend policy
export const CAPITALIZATION_THRESHOLD = 50000
export const MIN_USEFUL_LIFE_MONTHS = 12

export function evaluateRecognition(input: RecognitionInput): RecognitionDecision {
  const { purchaseCost, expectedUsefulLifeMonths, hasFutureEconomicBenefit, costCanBeReliablyMeasured } = input

  const reasons: string[] = []

  // Not enough data
  if (purchaseCost === undefined || purchaseCost === null || purchaseCost === 0) {
    return {
      status: 'pending_review',
      treatment: 'pending_review',
      isDepreciable: false,
      reasons: ['Purchase cost is required to determine treatment'],
      label: 'Pending Review',
      description: 'Add purchase cost and useful life to see the recognition decision.',
      variant: 'neutral',
    }
  }

  if (!expectedUsefulLifeMonths) {
    return {
      status: 'pending_review',
      treatment: 'pending_review',
      isDepreciable: false,
      reasons: ['Expected useful life is required to determine treatment'],
      label: 'Pending Review',
      description: 'Enter expected useful life to see the recognition decision.',
      variant: 'neutral',
    }
  }

  // Recognition criteria failed
  if (hasFutureEconomicBenefit === false) {
    reasons.push('No future economic benefit')
    return {
      status: 'not_recognized',
      treatment: 'expensed',
      isDepreciable: false,
      reasons,
      label: 'Expensed',
      description: 'This asset will be expensed immediately because it has no future economic benefit.',
      variant: 'warning',
    }
  }

  if (costCanBeReliablyMeasured === false) {
    reasons.push('Cost cannot be reliably measured')
    return {
      status: 'not_recognized',
      treatment: 'expensed',
      isDepreciable: false,
      reasons,
      label: 'Expensed',
      description: 'This asset will be expensed because its cost cannot be reliably measured.',
      variant: 'warning',
    }
  }

  // Below threshold - track as non-capitalized
  if (purchaseCost < CAPITALIZATION_THRESHOLD) {
    reasons.push('Cost below capitalization threshold of ' + CAPITALIZATION_THRESHOLD.toLocaleString())
    return {
      status: 'recognized',
      treatment: 'tracked_non_capitalized',
      isDepreciable: false,
      reasons,
      label: 'Tracked (Non-Capitalized)',
      description: 'Asset value is below the capitalization threshold, so it will be tracked but not capitalized.',
      variant: 'info',
    }
  }

  // Useful life below minimum
  if (expectedUsefulLifeMonths < MIN_USEFUL_LIFE_MONTHS) {
    reasons.push('Useful life below minimum of ' + MIN_USEFUL_LIFE_MONTHS + ' months')
    return {
      status: 'not_recognized',
      treatment: 'expensed',
      isDepreciable: false,
      reasons,
      label: 'Expensed',
      description: 'Useful life is below the minimum, so this will be expensed rather than capitalized.',
      variant: 'warning',
    }
  }

  // Passes all checks
  reasons.push('Meets capitalization threshold')
  reasons.push('Meets minimum useful life')
  reasons.push('Has future economic benefit')
  reasons.push('Cost can be reliably measured')

  return {
    status: 'recognized',
    treatment: 'capitalized',
    isDepreciable: true,
    reasons,
    label: 'Capitalized',
    description: 'This asset will be capitalized and depreciated over its useful life.',
    variant: 'success',
  }
}
