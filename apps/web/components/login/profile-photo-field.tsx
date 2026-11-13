'use client'

import { Button } from '@workspace/ui/components/button'
import { Camera } from 'lucide-react'
import Image from 'next/image'
import { useId, useRef, useState } from 'react'

import { ProfilePhotoError, toProfilePhoto } from '@/lib/profile/photo'

interface Props {
  disabled?: boolean
  onChange: (photo: string | undefined) => void
  value: string | undefined
}

/** Optional round profile photo picker with a live preview. */
export function ProfilePhotoField({
  disabled = false,
  onChange,
  value,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string>()
  const [reading, setReading] = useState(false)
  const id = useId()

  /** Resizes the picked file and hands the data URL to the form. */
  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) {
      return
    }

    setReading(true)
    setMessage(undefined)

    try {
      onChange(await toProfilePhoto(file))
    } catch (error) {
      setMessage(
        error instanceof ProfilePhotoError
          ? error.message
          : 'That image could not be read.'
      )
    } finally {
      setReading(false)

      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <button
          aria-describedby={message ? `${id}-error` : undefined}
          aria-label={value ? 'Change profile photo' : 'Add a profile photo'}
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-50"
          disabled={disabled || reading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {value ? (
            <Image
              alt=""
              className="size-full object-cover"
              height={64}
              src={value}
              unoptimized
              width={64}
            />
          ) : (
            <Camera aria-hidden="true" className="size-6" />
          )}
        </button>
        <div className="flex flex-col">
          <span className="font-medium">Profile photo</span>
          <span className="text-muted-foreground">
            {reading ? 'Preparing…' : 'Optional. Shown to your workspace.'}
          </span>
        </div>
        {value ? (
          <Button
            className="ml-auto"
            disabled={disabled || reading}
            onClick={() => onChange(undefined)}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        ) : null}
      </div>
      <input
        accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
        className="sr-only"
        disabled={disabled || reading}
        id={id}
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
        }}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      {message ? (
        <p className="text-destructive" id={`${id}-error`} role="alert">
          {message}
        </p>
      ) : null}
    </div>
  )
}
