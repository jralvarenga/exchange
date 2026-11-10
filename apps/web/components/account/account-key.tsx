'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { cn } from '@workspace/ui/lib/utils'
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
  onRemove: () => Promise<void>
  onTest: () => Promise<void>
}

const pillClassName = 'h-11 rounded-full px-5 text-base'

/** One environment's masked Alpaca key, its status, and the actions that change it. */
export function AccountKey({
  active,
  credential,
  environment,
  onRemove,
  onTest,
}: Props) {
  const [state, action, pending] = useActionState(
    saveAlpacaCredentialAction,
    {}
  )
  const [editing, setEditing] = useState(!credential)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [showsSecret, setShowsSecret] = useState(false)
  const [busy, setBusy] = useState(false)
  const label = environment === 'live' ? 'Live' : 'Paper'
  const titleId = `${environment}-key-title`
  // The server prop is refreshed after every action. The action state would
  // keep showing a key after it was removed or retested.
  const shown = credential

  useEffect(() => {
    if (state.credential) {
      setEditing(false)
      setShowsSecret(false)
    }
  }, [state.credential])

  useEffect(() => {
    if (!editing) {
      setShowsSecret(false)
    }
  }, [editing])

  /** Asks Alpaca to accept the stored keys again. */
  async function handleTest(): Promise<void> {
    setBusy(true)

    try {
      await onTest()
    } finally {
      setBusy(false)
    }
  }

  /** Deletes the stored keys and opens the form to add new ones. */
  async function handleRemove(): Promise<void> {
    setBusy(true)

    try {
      await onRemove()
      setConfirmingRemove(false)
      setEditing(true)
      setShowsSecret(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article aria-labelledby={titleId} className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h3 className="font-bold text-xl tracking-tight" id={titleId}>
            {label}
          </h3>
          <p className="text-muted-foreground">
            {active
              ? 'In use'
              : environment === 'live'
                ? 'Real money'
                : 'Simulated money'}
          </p>
        </div>
        <StatusPill status={getCredentialStatusInfo(shown?.status)} />
      </div>
      {shown ? (
        <dl className="flex flex-col divide-y divide-border border-border border-y">
          <div className="flex min-h-14 items-center justify-between gap-4 py-3">
            <dt className="font-medium text-muted-foreground">Key ID</dt>
            <dd className="font-mono">{shown.keyIdMasked}</dd>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-4 py-3">
            <dt className="font-medium text-muted-foreground">Last verified</dt>
            <dd className="text-right font-mono">
              {shown.lastVerifiedAt
                ? formatVerifiedAt(shown.lastVerifiedAt)
                : 'Not verified yet'}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="border-border border-y py-4 text-muted-foreground">
          No {environment} keys saved. Create a key pair in the Alpaca dashboard
          and paste it below.
        </p>
      )}
      {shown?.status === 'invalid' ? (
        <p className="text-danger">
          Alpaca rejected these keys. Test them again or replace them with a new
          pair.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {shown ? (
          <Button
            aria-expanded={editing}
            className={pillClassName}
            onClick={() => setEditing((current) => !current)}
            type="button"
            variant="outline"
          >
            {editing ? 'Cancel' : 'Replace keys'}
          </Button>
        ) : null}
        {shown ? (
          <Button
            className={pillClassName}
            disabled={busy}
            onClick={() => {
              void handleTest()
            }}
            type="button"
            variant="ghost"
          >
            {busy && !confirmingRemove ? 'Testing…' : 'Test'}
          </Button>
        ) : null}
        {shown ? (
          <Button
            className={cn(pillClassName, 'ml-auto')}
            disabled={busy}
            onClick={() => setConfirmingRemove(true)}
            type="button"
            variant="destructive"
          >
            Remove
          </Button>
        ) : null}
      </div>
      {editing ? (
        <form
          action={action}
          autoComplete="off"
          className="flex flex-col gap-4 pt-2"
        >
          <input name="environment" type="hidden" value={environment} />
          <Field>
            <FieldLabel htmlFor={`${environment}-key-id`}>Key ID</FieldLabel>
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
            <FieldLabel htmlFor={`${environment}-secret`}>Secret</FieldLabel>
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
          {state.message ? (
            <p className="text-destructive" role="alert">
              {state.message}
            </p>
          ) : null}
          <Button
            className={cn(pillClassName, 'self-start')}
            disabled={pending}
            type="submit"
          >
            {pending ? 'Checking with Alpaca…' : `Save ${environment} keys`}
          </Button>
        </form>
      ) : null}
      <RemoveKeyDialog
        busy={busy}
        environment={environment}
        onConfirm={() => {
          void handleRemove()
        }}
        onOpenChange={setConfirmingRemove}
        open={confirmingRemove}
      />
    </article>
  )
}

/** Formats a verification timestamp in UTC so server and client match. */
function formatVerifiedAt(value: string): string {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  })
}
