import { z } from 'zod'

export const assetStatusEnum = z.enum(['active', 'maintenance', 'disposed'])
export const assetConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor'])
export const disposalMethodEnum = z.enum([
  'sold', 'donated', 'scrapped', 'lost', 'written_off', 'other',
])
export const depreciationMethodEnum = z.enum(['straight_line', 'reducing_balance'])

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === null || value === undefined) return undefined
  return value
}

const requiredMoney = z.preprocess((value) => {
  const next = emptyToUndefined(value)
  if (next === undefined) return undefined
  const numeric = typeof next === 'number' ? next : Number(next)
  return Number.isFinite(numeric) ? numeric : next
}, z.number({
  required_error: 'Purchase cost is required',
  invalid_type_error: 'Purchase cost is required',
}).min(0, 'Purchase cost cannot be negative'))

const optionalMoney = z.preprocess((value) => {
  const next = emptyToUndefined(value)
  if (next === undefined) return undefined
  const numeric = typeof next === 'number' ? next : Number(next)
  return Number.isFinite(numeric) ? numeric : next
}, z.number().min(0).optional())

const optionalMonths = z.preprocess((value) => {
  const next = emptyToUndefined(value)
  if (next === undefined) return undefined
  const numeric = typeof next === 'number' ? next : Number(next)
  return Number.isFinite(numeric) ? numeric : next
}, z.number().int().min(0).optional())

export const createAssetSchema = z.object({
  name: z.string().min(2, 'Asset name is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  assetTag: z.string().min(1, 'Asset tag is required').max(100),
  serialNumber: z.string().max(100).optional().or(z.literal('')),
  category: z.string().max(100).optional().or(z.literal('')),
  manufacturer: z.string().max(100).optional().or(z.literal('')),
  model: z.string().max(100).optional().or(z.literal('')),
  branchId: z.string().optional().or(z.literal('')),
  assignedTo: z.string().optional().or(z.literal('')),
  status: assetStatusEnum.optional().default('active'),
  condition: assetConditionEnum.optional().default('good'),
  purchaseCost: requiredMoney,
  purchaseDate: z.string().optional().or(z.literal('')),
  warrantyExpiryDate: z.string().optional().or(z.literal('')),
  expectedUsefulLifeMonths: optionalMonths,
  residualValue: optionalMoney,
  isDepreciable: z.boolean().optional(),
  hasFutureEconomicBenefit: z.boolean().optional(),
  costCanBeReliablyMeasured: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (value.purchaseDate && value.warrantyExpiryDate && value.warrantyExpiryDate < value.purchaseDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['warrantyExpiryDate'],
      message: 'Warranty expiry must be on or after the purchase date',
    })
  }
  if (
    value.residualValue !== undefined &&
    typeof value.purchaseCost === 'number' &&
    value.residualValue > value.purchaseCost
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['residualValue'],
      message: 'Residual value cannot exceed purchase cost',
    })
  }
})
export type CreateAssetFormValues = z.input<typeof createAssetSchema>

export const transferAssetSchema = z.object({
  toBranchId: z.string().optional().or(z.literal('')),
  toUserId: z.string().optional().or(z.literal('')),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
}).refine(
  (d) => Boolean(d.toBranchId?.trim() || d.toUserId?.trim()),
  { message: 'Select a new branch or new assignee', path: ['toBranchId'] },
)
export type TransferAssetFormValues = z.input<typeof transferAssetSchema>

export const disposeAssetSchema = z.object({
  method: disposalMethodEnum,
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  proceeds: z.coerce.number().min(0).default(0),
  disposedAt: z.string().min(1, 'Disposal date is required'),
  approvedByUserId: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})
export type DisposeAssetFormValues = z.input<typeof disposeAssetSchema>

export const restoreAssetSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  targetStatus: z.enum(['active', 'maintenance']).default('active'),
  status: z.enum(['active', 'maintenance']).optional(),
})
export type RestoreAssetFormValues = z.input<typeof restoreAssetSchema>

export const recordDepreciationSchema = z.object({
  fiscalYear: z.coerce.number().int().min(1900).max(2100),
  depreciationMethod: depreciationMethodEnum.default('straight_line'),
  periodUsedPriorYears: z.coerce.number().min(0).default(0),
  periodUsedCurrentYear: z.coerce.number().min(0).max(12, 'Current year cannot exceed 12 months').default(12),
  accumulatedDepreciationBf: z.coerce.number().min(0).default(0),
  yearlyDepCharge: z.coerce.number().min(0).default(0),
  totalAccumulatedDepreciation: z.coerce.number().min(0).default(0),
  runDate: z.string().min(1, 'Run date is required'),
})
export type RecordDepreciationFormValues = z.input<typeof recordDepreciationSchema>
