'use client'

import { CheckCircle2, AlertTriangle, Info, HelpCircle } from 'lucide-react'
import { evaluateRecognition, type RecognitionInput } from '@/lib/utils/recognition'
import { cn } from '@/lib/utils'

interface RecognitionPreviewProps {
  input: RecognitionInput
}

const variantConfig = {
  success: {
    container: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    labelColor: 'text-emerald-900',
    descColor: 'text-emerald-800',
    Icon: CheckCircle2,
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    labelColor: 'text-blue-900',
    descColor: 'text-blue-800',
    Icon: Info,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    labelColor: 'text-amber-900',
    descColor: 'text-amber-800',
    Icon: AlertTriangle,
  },
  neutral: {
    container: 'bg-slate-50 border-slate-200',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    labelColor: 'text-slate-900',
    descColor: 'text-slate-600',
    Icon: HelpCircle,
  },
}

export function RecognitionPreview({ input }: RecognitionPreviewProps) {
  const decision = evaluateRecognition(input)
  const config = variantConfig[decision.variant]
  const Icon = config.Icon

  return (
    <div className={cn('rounded-xl border p-4', config.container)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', config.iconBg)}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-semibold', config.labelColor)}>Recognition:</span>
            <span className={cn('text-sm font-bold', config.labelColor)}>{decision.label}</span>
          </div>
          <p className={cn('text-sm mt-1 leading-relaxed', config.descColor)}>
            {decision.description}
          </p>
          {decision.reasons.length > 0 && (
            <ul className="mt-3 space-y-1">
              {decision.reasons.map((reason, idx) => (
                <li key={idx} className={cn('text-xs flex items-center gap-1.5', config.descColor)}>
                  <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
