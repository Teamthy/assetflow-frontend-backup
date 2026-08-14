import { z } from 'zod'

export const assetStatusEnum = z.enum(['active', 'maintenance', 'disposed'])
export const assetConditionEnum = z.enum(['excellent', 'good', 'fair', 'poor'])
export const disposalMethodEnum = z.enum(['sold', 'donated', 'scrapped', 'lost', 'written_off', 'other'])
export const depreciationMethodEnum = z.enum(['straight_line', 'reducing_balance'])

export const createAssetSchema = z.object({
  name: z.string().min(2, 'Asset name is required').max(200, 'Name is too long'),
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
  purchaseCost: z.coerce.number().min(0, 'Cost cannot be negative').optional(),
  purchaseDate: z.string().optional().or(z.literal('')),
  warrantyExpiryDate: z.string().optional().or(z.literal('')),
  expectedUsefulLifeMonths: z.coerce.number().int().min(0).optional(),
  residualValue: z.coerce.number().min(0).optional(),
  isDepreciable: z.boolean().optional(),
  hasFutureEconomicBenefit: z.boolean().optional(),
  costCanBeReliablyMeasured: z.boolean().optional(),
})

export type CreateAssetFormValues = z.infer<typeof createAssetSchema>

export const transferAssetSchema = z.object({
  toBranchId: z.string().optional().or(z.literal('')),
  toUserId: z.string().optional().or(z.literal('')),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
}).refine(
  (data) => Boolean(data.toBranchId?.trim() || data.toUserId?.trim()),
  { message: 'Select a new branch or new assignee', path: ['toBranchId'] }
)

export type TransferAssetFormValues = z.infer<typeof transferAssetSchema>

export const disposeAssetSchema = z.object({
  method: disposalMethodEnum,
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  proceeds: z.coerce.number().min(0, 'Proceeds cannot be negative').default(0),
  disposedAt: z.string().min(1, 'Disposal date is required'),
  approvedByUserId: z.string().optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export type DisposeAssetFormValues = z.infer<typeof disposeAssetSchema>

export const restoreAssetSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  targetStatus: assetStatusEnum.default('active'),
})

export type RestoreAssetFormValues = z.infer<typeof restoreAssetSchema>

export const recordDepreciationSchema = z.object({
  fiscalYear: z.coerce.number().int().min(1900).max(2100),
  depreciationMethod: depreciationMethodEnum,
  periodUsedPriorYears: z.coerce.number().min(0),
  periodUsedCurrentYear: z.coerce.number().min(0).max(12),
  accumulatedDepreciationBf: z.coerce.number().min(0),
  yearlyDepCharge: z.coerce.number().min(0),
  totalAccumulatedDepreciation: z.coerce.number().min(0),
  runDate: z.string().min(1, 'Run date is required'),
})

export type RecordDepreciationFormValues = z.infer<typeof recordDepreciationSchema>
