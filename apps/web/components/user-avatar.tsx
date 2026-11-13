import { cn } from '@workspace/ui/lib/utils'
import Image from 'next/image'

import { getInitials } from '@/lib/utils'

interface Props {
  className?: string
  email: string
  image: string | null
  name: string
  /** Rendered pixel size, used for the image's intrinsic size. */
  size: number
}

/** A round profile photo, or the person's initials when they have none. */
export function UserAvatar({ className, email, image, name, size }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-foreground',
        className
      )}
    >
      {image ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={size}
          // Photos are data URLs from sign-up or Google profile pictures.
          unoptimized
          src={image}
          width={size}
        />
      ) : (
        getInitials({ email, name })
      )}
    </span>
  )
}
