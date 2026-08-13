import { z } from 'zod'

export const assetStatusEnum = z.enum(['active', 'maintenance', 'disposed'])
export const assetConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor'])
export const disposalMethodEnum = z.enum([
  'sold', 'donated', 'scrapped', 'lost', 'written_off', 'other',
])
export const depreciationMethodEnum = z.enum(['straight_line', 'reducing_balance'])

const isBlank = (value: unknown) => value === '' || value === null || value === undefined

/** Form-safe number: accepts '', undefined, string, or number. Never uses z.preprocess (input becomes unknown). */
function formNumber(options: {
  requiredMessage?: string
  invalidMessage: string
  min?: number
  integer?: boolean
}) {
  return z
    .union([z.number(), z.string(), z.undefined(), z.null()])
    .transform((value, ctx) => {
      if (isBlank(value)) {
        if (options.requiredMessage) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: options.requiredMessage })
          return z.NEVER
        }
        return undefined
      }
      const numeric = typeof value === 'number' ? value : Number(value)
      if (!Number.isFinite(numeric)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: options.invalidMessage })
        return z.NEVER
      }
      if (options.integer && !Number.isInteger(numeric)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: options.invalidMessage })
        return z.NEVER
      }
      if (options.min !== undefined && numeric < options.min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: options.min === 0 ? 'Cannot be negative' : `Cannot be less than ${options.min}`,
        })
        return z.NEVER
      }
      return numeric
    })
}

const requiredMoney = formNumber({
  requiredMessage: 'Purchase cost is required',
  invalidMessage: 'Purchase cost is required',
  min: 0,
})

const optionalMoney = formNumber({
  invalidMessage: 'Enter a valid amount',
  min: 0,
})

const optionalMonths = formNumber({
  invalidMessage: 'Enter a whole number of months',
  min: 0,
  integer: true,
})

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
export type CreateAssetFormInput = z.input<typeof createAssetSchema>
export type CreateAssetFormValues = z.output<typeof createAssetSchema>

export function toOptionalNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : undefined
}

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