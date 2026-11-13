'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { useId, useState } from 'react'

interface Props {
  name: string
  onCancel: () => void
  onRename: (name: string) => Promise<string | undefined>
}

/** Renames a connection in place. Shows the server's message when it fails. */
export function ConnectionRenameForm({ name, onCancel, onRename }: Props) {
  const [message, setMessage] = useState<string>()
  const [pending, setPending] = useState(false)
  const id = useId()

  /** Sends the new name and keeps the form open when the server refuses it. */
  async function handleSubmit(formData: FormData): Promise<void> {
    setPending(true)

    try {
      setMessage(await onRename(String(formData.get('name') ?? '')))
    } finally {
      setPending(false)
    }
  }

  return (
    <form
      action={(formData) => handleSubmit(formData)}
      className="flex flex-col gap-3"
    >
      <Field className="max-w-sm">
        <FieldLabel
          className="font-medium text-muted-foreground"
          htmlFor={`${id}-name`}
        >
          Name
        </FieldLabel>
        <InputGroup className="h-11">
          <InputGroupInput
            defaultValue={name}
            disabled={pending}
            id={`${id}-name`}
            maxLength={40}
            name="name"
            required
          />
        </InputGroup>
      </Field>
      {message ? (
        <p className="text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <div className="flex items-center gap-1">
        <Button
          className="h-11 rounded-full px-5 text-base"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Renaming…' : 'Rename'}
        </Button>
        <Button
          className="h-11 rounded-full px-3 text-base"
          disabled={pending}
          onClick={onCancel}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
