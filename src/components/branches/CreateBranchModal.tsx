'use client'

import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/validations/form-resolver'
import { Building2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { branchSchema, type BranchFormValues } from '@/lib/validations/branch'
import { useCreateBranch } from '@/lib/hooks/useBranches'

interface CreateBranchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBranchModal({ open, onOpenChange }: CreateBranchModalProps) {
  const createMutation = useCreateBranch()

  const form = useForm<BranchFormValues>({
    resolver: formResolver(branchSchema),
    defaultValues: { name: '', code: '', description: '' },
  })

  async function onSubmit(values: BranchFormValues) {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        code: values.code?.trim() || undefined,
        description: values.description?.trim() || undefined,
      })
      form.reset()
      onOpenChange(false)
    } catch {
      // toast in hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) form.reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle>Add branch</DialogTitle>
              <DialogDescription>Create a new location for organizing assets.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="px-6 py-5 space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lagos Head Office" {...field} />
                  </FormControl>
                  <FormDescription>Must be unique within your organization</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. LHO" {...field} />
                  </FormControl>
                  <FormDescription>Short unique code (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Address, purpose, or notes about this branch"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={createMutation.isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create branch'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
