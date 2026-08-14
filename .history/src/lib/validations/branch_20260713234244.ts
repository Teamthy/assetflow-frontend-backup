import { z } from 'zod'

export const branchSchema = z.object({
  name: z.string().min(2, 'Branch name is required').max(150),
  code: z.string().max(50).optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
})

export type BranchFormValues = z.input<typeof branchSchema>
