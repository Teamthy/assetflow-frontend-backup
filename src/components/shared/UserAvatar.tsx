import { getInitials } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { wrapper: 'w-7 h-7', text: 'text-xs' },
  md: { wrapper: 'w-9 h-9', text: 'text-sm' },
  lg: { wrapper: 'w-11 h-11', text: 'text-base' },
}

export function UserAvatar({ name, imageUrl, size = 'md', className }: UserAvatarProps) {
  const { wrapper, text } = sizeMap[size]
  const safeName = name ?? ''

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={safeName}
        className={cn(`${wrapper} rounded-full object-cover flex-shrink-0`, className)}
      />
    )
  }

  return (
    <div
      className={cn(
        `${wrapper} rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0`,
        className
      )}
    >
      <span className={`${text} font-semibold text-brand-700`}>
        {getInitials(safeName)}
      </span>
    </div>
  )
}
