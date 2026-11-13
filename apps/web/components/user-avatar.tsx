import { cn } from '@workspace/ui/lib/utils'
import Image from 'next/image'

import { getInitials } from '@/lib/utils'

const avatarSizes = {
  md: {
    className: 'size-11',
    pixel: 44,
  },
  lg: {
    className: 'size-12',
    pixel: 48,
  },
  hero: {
    className:
      'size-16 font-bold text-2xl tracking-tight sm:size-24 sm:text-4xl',
    pixel: 96,
  },
} as const

interface Props {
  /** Layout only: width, alignment, margins. Size and type live on `size`. */
  className?: string
  email: string
  image: string | null
  name: string
  size: keyof typeof avatarSizes
}

/** A round profile photo, or the person's initials when they have none. */
export function UserAvatar({ className, email, image, name, size }: Props) {
  const avatarSize = avatarSizes[size]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-foreground',
        avatarSize.className,
        className
      )}
    >
      {image ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={avatarSize.pixel}
          // Photos are data URLs from sign-up or Google profile pictures.
          unoptimized
          src={image}
          width={avatarSize.pixel}
        />
      ) : (
        getInitials({ email, name })
      )}
    </span>
  )
}
