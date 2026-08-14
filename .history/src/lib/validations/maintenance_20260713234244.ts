import { z } from 'zod'

export const maintenancePriorityEnum = z.enum(['low', 'medium', 'high', 'critical'])
export const maintenanceStatusEnum = z.enum(['open', 'in_progress', 'completed', 'cancelled'])

export const createMaintenanceSchema = z.object({
  assetId: z.string().min(1, 'Please select an asset'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  priority: maintenancePriorityEnum.default('medium'),
  dueAt: z.string().optional().or(z.literal('')),
  assignedTo: z.string().optional().or(z.literal('')),
})

export type CreateMaintenanceFormValues = z.input<typeof createMaintenanceSchema>

export const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  status: maintenanceStatusEnum.optional(),
})

export type UpdateMaintenanceFormValues = z.input<typeof updateMaintenanceSchema>

export const completeMaintenanceSchema = z.object({
  completionNote: z.string().min(5, 'Please describe what was done').max(1000),
  completedAt: z.string().min(1, 'Completion date is required'),
})

export type CompleteMaintenanceFormValues = z.input<typeof completeMaintenanceSchema>
