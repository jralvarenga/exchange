'use client'

import { cn } from '@workspace/ui/lib/utils'
import Image from 'next/image'
import { useState } from 'react'

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

/** A round profile photo, or the person's initials when there is none or it fails to load. */
export function UserAvatar({ className, email, image, name, size }: Props) {
  const avatarSize = avatarSizes[size]
  // Remembers which photo failed, so a new photo gets a fresh try.
  const [failedImage, setFailedImage] = useState<string>()
  const showsImage = Boolean(image) && image !== failedImage

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-foreground',
        avatarSize.className,
        className
      )}
    >
      {showsImage && image ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={avatarSize.pixel}
          onError={() => setFailedImage(image)}
          // Google refuses profile photos requested with another site's referrer.
          referrerPolicy="no-referrer"
          src={image}
          // Photos are data URLs from sign-up or Google profile pictures.
          unoptimized
          width={avatarSize.pixel}
        />
      ) : (
        getInitials({ email, name })
      )}
    </span>
  )
}
