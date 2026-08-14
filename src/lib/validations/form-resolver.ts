import { zodResolver } from '@hookform/resolvers/zod'
import type { Resolver } from 'react-hook-form'

/** zodResolver without Zod input/output mismatch. Safe for `useForm<Values>({ resolver })`. */
export function formResolver(schema: any): Resolver<any> {
  return zodResolver(schema) as Resolver<any>
}