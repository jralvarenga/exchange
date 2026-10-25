'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Eye, EyeOff } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'

import { saveAlpacaCredentialAction } from '@/app/(dashboard)/settings/actions'
import type { MaskedAlpacaCredential } from '@/lib/alpaca/credentials'

interface Props {
  credential?: MaskedAlpacaCredential
  environment: 'live' | 'paper'
  onRemove: () => Promise<void>
  onTest: () => Promise<void>
}

/** Shows one environment's masked Alpaca key and the actions that change it. */
export function CredentialCard({
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

  async function handleTest(): Promise<void> {
    setBusy(true)

    try {
      await onTest()
    } finally {
      setBusy(false)
    }
  }

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
    <Card>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {shown ? (
          <dl className="grid gap-2">
            <div>
              <dt className="text-muted-foreground">Key ID</dt>
              <dd>{shown.keyIdMasked}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{statusLabel(shown.status)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last verified</dt>
              <dd>
                {shown.lastVerifiedAt
                  ? new Date(shown.lastVerifiedAt).toLocaleString('en-US')
                  : 'Not verified yet'}
              </dd>
            </div>
          </dl>
        ) : (
          <p>No {label.toLowerCase()} keys saved.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setEditing((current) => !current)}
          >
            {shown ? 'Replace' : 'Add'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!shown || busy}
            onClick={() => {
              void handleTest()
            }}
          >
            Test
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!shown || busy}
            onClick={() => setConfirmingRemove(true)}
          >
            Remove
          </Button>
        </div>
        {editing ? (
          <form
            action={action}
            autoComplete="off"
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="environment" value={environment} />
            <Field>
              <FieldLabel htmlFor={`${environment}-key-id`}>Key ID</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={`${environment}-key-id`}
                  name="keyId"
                  autoComplete="off"
                  required
                  disabled={pending}
                />
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor={`${environment}-secret`}>Secret</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={`${environment}-secret`}
                  name="secret"
                  type={showsSecret ? 'text' : 'password'}
                  autoComplete="off"
                  required
                  disabled={pending}
                />
                <InputGroupAddon align="inline-end" className="pr-2">
                  <InputGroupButton
                    type="button"
                    size="icon-sm"
                    aria-label={showsSecret ? 'Hide secret' : 'Show secret'}
                    aria-pressed={showsSecret}
                    onClick={() => setShowsSecret((current) => !current)}
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
              <p role="alert" className="text-destructive">
                {state.message}
              </p>
            ) : null}
            <Button type="submit" disabled={pending}>
              Save {label.toLowerCase()} keys
            </Button>
          </form>
        ) : null}
      </CardContent>
      <Dialog open={confirmingRemove} onOpenChange={setConfirmingRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {label.toLowerCase()} keys?</DialogTitle>
            <DialogDescription>
              Exchange will stop using this {label.toLowerCase()} account until
              you add keys again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => {
                void handleRemove()
              }}
            >
              Remove keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

/** Describes a credential status in words, not color alone. */
function statusLabel(status: MaskedAlpacaCredential['status']): string {
  if (status === 'valid') {
    return 'Valid'
  }

  if (status === 'invalid') {
    return 'Invalid'
  }

  return 'Unverified'
}
