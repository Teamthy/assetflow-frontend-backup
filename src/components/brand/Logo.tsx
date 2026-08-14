import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('h-8 w-8', className)}
    >
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <rect x="6" y="6" width="8" height="8" rx="1.75" fill="white" />
      <rect x="18" y="6" width="8" height="8" rx="1.75" fill="white" fillOpacity="0.55" />
      <rect x="6" y="18" width="8" height="8" rx="1.75" fill="white" fillOpacity="0.55" />
      <rect x="18" y="18" width="8" height="8" rx="1.75" fill="white" />
    </svg>
  )
}

export function Logo({
  className,
  wordmarkClassName,
  showWordmark = true,
}: {
  className?: string
  wordmarkClassName?: string
  showWordmark?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-8 w-8 flex-shrink-0" />
      {showWordmark && (
        <span className={cn('text-[15px] font-semibold tracking-tight text-slate-900', wordmarkClassName)}>
          AssetFlow
        </span>
      )}
    </div>
  )
}
