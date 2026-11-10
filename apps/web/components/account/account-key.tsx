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
import { useActionState, useEffect, useState } from 'react'

import { saveAlpacaCredentialAction } from '@/app/(dashboard)/account/actions'
import { RemoveKeyDialog } from '@/components/account/remove-key-dialog'
import { StatusPill } from '@/components/status-pill'
import { getCredentialStatusInfo } from '@/lib/account/status'
import type { MaskedAlpacaCredential } from '@/lib/alpaca/credentials'

interface Props {
  active: boolean
  credential?: MaskedAlpacaCredential
  environment: 'live' | 'paper'
  onActivate: () => void
  onRemove: () => Promise<void>
  onTest: () => Promise<void>
}

const actionClassName = 'h-11 rounded-full px-3 text-base'

/** One environment's Alpaca key as a list row: status, masked key, actions and the key form. */
export function AccountKey({
  active,
  credential,
  environment,
  onActivate,
  onRemove,
  onTest,
}: Props) {
  const [state, action, pending] = useActionState(
    saveAlpacaCredentialAction,
    {}
  )
  // Only the account in use opens its form by default, so a new user sees one.
  const [editing, setEditing] = useState(!credential && active)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [showsSecret, setShowsSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [removing, setRemoving] = useState(false)
  const label = environment === 'live' ? 'Live' : 'Paper'
  const titleId = `${environment}-key-title`
  // The server prop is refreshed after every action. The action state would
  // keep showing a key after it was removed or retested.
  const shown = credential

  useEffect(() => {
    if (state.credential) {
      setEditing(false)
    }
  }, [state.credential])

  useEffect(() => {
    if (!editing) {
      setShowsSecret(false)
    }
  }, [editing])

  /** Asks Alpaca to accept the stored keys again. */
  async function handleTest(): Promise<void> {
    setTesting(true)

    try {
      await onTest()
    } finally {
      setTesting(false)
    }
  }

  /** Deletes the stored keys and opens the form to add new ones. */
  async function handleRemove(): Promise<void> {
    setRemoving(true)

    try {
      await onRemove()
      setConfirmingRemove(false)
      setEditing(true)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <li aria-labelledby={titleId} className="flex flex-col gap-3 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3
            className="flex items-center gap-2 font-bold text-lg"
            id={titleId}
          >
            {label}
            {active ? (
              <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                In use
              </span>
            ) : null}
          </h3>
          <p className="text-muted-foreground">
            {shown ? (
              <>
                <span className="font-mono text-foreground">
                  {shown.keyIdMasked}
                </span>
                {' · '}
                {shown.lastVerifiedAt
                  ? `Checked ${formatVerifiedAt(shown.lastVerifiedAt)}`
                  : 'Not checked yet'}
              </>
            ) : environment === 'live' ? (
              'Trades with real money.'
            ) : (
              'Practice with simulated money.'
            )}
          </p>
        </div>
        <StatusPill status={getCredentialStatusInfo(shown?.status)} />
      </div>

      {!shown && !editing ? (
        <div className="-ml-3 flex">
          <Button
            className={actionClassName}
            onClick={() => setEditing(true)}
            type="button"
            variant="ghost"
          >
            Add {environment} keys
          </Button>
        </div>
      ) : null}

      {shown && !editing ? (
        <div className="-ml-3 flex flex-wrap items-center gap-1">
          {!active && shown.status === 'valid' ? (
            <Button
              className={actionClassName}
              onClick={onActivate}
              type="button"
              variant="ghost"
            >
              Use {environment}
            </Button>
          ) : null}
          <Button
            className={actionClassName}
            onClick={() => setEditing(true)}
            type="button"
            variant="ghost"
          >
            Replace
          </Button>
          <Button
            className={actionClassName}
            disabled={testing}
            onClick={() => {
              void handleTest()
            }}
            type="button"
            variant="ghost"
          >
            {testing ? 'Testing…' : 'Test'}
          </Button>
          <Button
            className={`${actionClassName} text-danger hover:text-danger`}
            disabled={removing}
            onClick={() => setConfirmingRemove(true)}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        </div>
      ) : null}

      {editing ? (
        <form
          action={action}
          autoComplete="off"
          className="flex flex-col gap-3 pt-1"
        >
          <input name="environment" type="hidden" value={environment} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel
                className="font-medium text-muted-foreground"
                htmlFor={`${environment}-key-id`}
              >
                Key ID
              </FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  autoComplete="off"
                  className="font-mono"
                  disabled={pending}
                  id={`${environment}-key-id`}
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
                htmlFor={`${environment}-secret`}
              >
                Secret
              </FieldLabel>
              <InputGroup className="h-11">
                <InputGroupInput
                  autoComplete="off"
                  className="font-mono"
                  disabled={pending}
                  id={`${environment}-secret`}
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
          <div className="flex items-center gap-1 pt-1">
            <Button
              className="h-11 rounded-full px-5 text-base"
              disabled={pending}
              type="submit"
            >
              {pending ? 'Checking with Alpaca…' : `Save ${environment} keys`}
            </Button>
            {shown || !active ? (
              <Button
                className={actionClassName}
                disabled={pending}
                onClick={() => setEditing(false)}
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      <RemoveKeyDialog
        busy={removing}
        environment={environment}
        onConfirm={() => {
          void handleRemove()
        }}
        onOpenChange={setConfirmingRemove}
        open={confirmingRemove}
      />
    </li>
  )
}

const verifiedAtFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** Formats a verification timestamp as "Nov 10" in UTC so server and client match. */
function formatVerifiedAt(value: string): string {
  return verifiedAtFormatter.format(new Date(value))
}
