'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Eye, EyeOff } from 'lucide-react'
import { useActionState, useEffect, useId, useRef, useState } from 'react'

import {
  addConnectionAction,
  replaceConnectionKeysAction,
} from '@/app/(dashboard)/account/actions'
import { PillGroup } from '@/components/pill-group'
import type { MaskedConnection } from '@/lib/alpaca/connections'

interface Props {
  /** The connection whose keys are replaced. Without it the form adds a new one. */
  connection?: Pick<MaskedConnection, 'environment' | 'id' | 'name'>
  onCancel?: () => void
  onSaved: (connection: MaskedConnection) => void
}

const environmentOptions = [
  { label: 'Paper', value: 'paper' },
  { label: 'Live', value: 'live' },
] as const

/** Adds a named connection, or replaces the key pair of an existing one. */
export function ConnectionForm({ connection, onCancel, onSaved }: Props) {
  const [state, action, pending] = useActionState(
    connection ? replaceConnectionKeysAction : addConnectionAction,
    {}
  )
  const [environment, setEnvironment] = useState<'live' | 'paper'>(
    connection?.environment ?? 'paper'
  )
  const [showsSecret, setShowsSecret] = useState(false)
  const id = useId()
  const handledState = useRef(state)

  // Each save result is reported once, even when the parent re-renders.
  useEffect(() => {
    if (state.connection && handledState.current !== state) {
      handledState.current = state
      onSaved(state.connection)
    }
  }, [onSaved, state])

  return (
    <form action={action} autoComplete="off" className="flex flex-col gap-4">
      {connection ? (
        <input name="connectionId" type="hidden" value={connection.id} />
      ) : (
        <>
          <input name="environment" type="hidden" value={environment} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel
                className="font-medium text-muted-foreground"
                htmlFor={`${id}-name`}
              >
                Name
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  disabled={pending}
                  id={`${id}-name`}
                  maxLength={40}
                  name="name"
                  placeholder={
                    environment === 'live' ? 'Live IRA' : 'Main paper'
                  }
                  required
                />
              </InputGroup>
            </Field>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-muted-foreground">
                Environment
              </span>
              <PillGroup
                label="Environment"
                onChange={setEnvironment}
                options={[...environmentOptions]}
                value={environment}
              />
            </div>
          </div>
        </>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel
            className="font-medium text-muted-foreground"
            htmlFor={`${id}-key-id`}
          >
            Key ID
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              autoComplete="off"
              className="font-mono"
              disabled={pending}
              id={`${id}-key-id`}
              name="keyId"
              placeholder={environment === 'live' ? 'AK…' : 'PK…'}
              required
              spellCheck={false}
            />
          </InputGroup>
        </Field>
        <Field>
          <FieldLabel
            className="font-medium text-muted-foreground"
            htmlFor={`${id}-secret`}
          >
            Secret
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              autoComplete="off"
              className="font-mono"
              disabled={pending}
              id={`${id}-secret`}
              name="secret"
              required
              spellCheck={false}
              type={showsSecret ? 'text' : 'password'}
            />
            <InputGroupAddon align="inline-end" className="pr-2">
              <InputGroupButton
                aria-label={showsSecret ? 'Hide secret' : 'Show secret'}
                aria-pressed={showsSecret}
                onClick={() => setShowsSecret((current) => !current)}
                size="icon-sm"
                type="button"
              >
                {showsSecret ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Field>
      </div>
      {state.message ? (
        <p className="text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="flex items-center gap-1">
        <Button disabled={pending} type="submit">
          {pending
            ? 'Checking with Alpaca…'
            : connection
              ? `Replace ${connection.name} keys`
              : 'Add connection'}
        </Button>
        {onCancel ? (
          <Button
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
