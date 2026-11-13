'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { useActionState, useEffect, useId, useRef } from 'react'

interface WorkspaceFormState {
  message?: string
  saved?: boolean
}

interface Props {
  action: (
    state: WorkspaceFormState,
    formData: FormData
  ) => Promise<WorkspaceFormState>
  defaultName?: string
  label: string
  onCancel?: () => void
  /** Called after a save that stays on this page. */
  onSaved?: () => void
  pendingLabel: string
  submitLabel: string
  /** The workspace being renamed, so a switch in another tab is caught. */
  workspaceId?: string
}

/** One name field with a submit pill, used to create or rename a workspace. */
export function WorkspaceNameForm({
  action,
  defaultName,
  label,
  onCancel,
  onSaved,
  pendingLabel,
  submitLabel,
  workspaceId,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {})
  const handledState = useRef(state)
  const id = useId()

  // Each save result is reported once, even when the parent re-renders.
  useEffect(() => {
    if (state.saved && handledState.current !== state) {
      handledState.current = state
      onSaved?.()
    }
  }, [onSaved, state])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {workspaceId ? (
        <input name="workspaceId" type="hidden" value={workspaceId} />
      ) : null}
      <Field className="max-w-sm">
        <FieldLabel
          className="font-medium text-muted-foreground"
          htmlFor={`${id}-name`}
        >
          {label}
        </FieldLabel>
        <InputGroup className="h-11">
          <InputGroupInput
            defaultValue={defaultName}
            disabled={pending}
            id={`${id}-name`}
            maxLength={40}
            name="name"
            required
          />
        </InputGroup>
      </Field>
      {state.message ? (
        <p className="text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="flex items-center gap-1">
        <Button
          className="h-11 rounded-full px-5 text-base"
          disabled={pending}
          type="submit"
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            className="h-11 rounded-full px-3 text-base"
            disabled={pending}
            onClick={onCancel}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
