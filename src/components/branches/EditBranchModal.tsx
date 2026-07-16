'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { branchSchema, type BranchFormValues } from '@/lib/validations/branch'
import { useUpdateBranch } from '@/lib/hooks/useBranches'
import type { Branch } from '@/types'

interface EditBranchModalProps {
  branch: Branch
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBranchModal({ branch, open, onOpenChange }: EditBranchModalProps) {
  const updateMutation = useUpdateBranch(branch.id)

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: branch.name,
      code: branch.code ?? '',
      description: branch.description ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: branch.name,
        code: branch.code ?? '',
        description: branch.description ?? '',
      })
    }
  }, [open, branch, form])

  async function onSubmit(values: BranchFormValues) {
    const payload: Record<string, string | undefined> = {}
    if (values.name !== branch.name) payload.name = values.name
    if ((values.code ?? '') !== (branch.code ?? '')) payload.code = values.code?.trim() || undefined
    if ((values.description ?? '') !== (branch.description ?? '')) payload.description = values.description?.trim() || undefined

    if (Object.keys(payload).length === 0) {
      onOpenChange(false)
      return
    }

    try {
      await updateMutation.mutateAsync(payload)
      onOpenChange(false)
    } catch {
      // toast in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>Edit branch</DialogTitle>
              <DialogDescription>Update {branch.name} details.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch name <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch code</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={updateMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
