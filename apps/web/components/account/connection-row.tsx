'use client'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { useState } from 'react'

import { ConnectionForm } from '@/components/account/connection-form'
import { ConnectionRenameForm } from '@/components/account/connection-rename-form'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { StatusPill } from '@/components/status-pill'
import { getCredentialStatusInfo } from '@/lib/account/status'
import type { MaskedConnection } from '@/lib/alpaca/connections'

interface Props {
  active: boolean
  canManage: boolean
  connection: MaskedConnection
  isDefault: boolean
  onMakeDefault: () => Promise<void>
  onRemove: () => Promise<boolean>
  onRename: (name: string) => Promise<string | undefined>
  onSaved: (connection: MaskedConnection) => void
  onTest: () => Promise<void>
  onUse: () => Promise<void>
}

type Mode = 'idle' | 'rename' | 'replace'

const actionClassName = 'h-11 rounded-full px-3 text-base'

/** One named connection: environment, masked key, status, and what this member can do with it. */
export function ConnectionRow({
  active,
  canManage,
  connection,
  isDefault,
  onMakeDefault,
  onRemove,
  onRename,
  onSaved,
  onTest,
  onUse,
}: Props) {
  const [mode, setMode] = useState<Mode>('idle')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<'live' | 'remove'>()
  const titleId = `connection-${connection.id}-title`
  const valid = connection.status === 'valid'

  /** Runs one row action and keeps the buttons disabled while it is in flight. */
  async function run(task: () => Promise<unknown>): Promise<void> {
    setBusy(true)

    try {
      await task()
    } finally {
      setBusy(false)
    }
  }

  /** Switches to this connection, asking first when it moves real money. */
  function handleUse(): void {
    if (connection.environment === 'live') {
      setConfirming('live')
      return
    }

    void run(onUse)
  }

  return (
    <li aria-labelledby={titleId} className="flex flex-col gap-3 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3
            className="flex flex-wrap items-center gap-2 font-bold text-lg"
            id={titleId}
          >
            <span className="truncate">{connection.name}</span>
            <span
              className={cn(
                'rounded-full px-2 font-medium text-base',
                connection.environment === 'live'
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {connection.environment === 'live' ? 'Live' : 'Paper'}
            </span>
            {active ? (
              <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                In use
              </span>
            ) : null}
            {isDefault ? (
              <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                Default
              </span>
            ) : null}
          </h3>
          <p className="text-muted-foreground">
            <span className="font-mono text-foreground">
              {connection.keyIdMasked}
            </span>
            {' · '}
            {connection.lastVerifiedAt
              ? formatVerifiedAt(connection.lastVerifiedAt)
              : 'Not checked yet'}
          </p>
        </div>
        <StatusPill status={getCredentialStatusInfo(connection.status)} />
      </div>

      {mode === 'idle' ? (
        <div className="-ml-3 flex flex-wrap items-center gap-1">
          {!active && valid ? (
            <Button
              className={actionClassName}
              disabled={busy}
              onClick={handleUse}
              type="button"
              variant="ghost"
            >
              Use
            </Button>
          ) : null}
          {canManage && !isDefault && valid ? (
            <Button
              className={actionClassName}
              disabled={busy}
              onClick={() => {
                void run(onMakeDefault)
              }}
              type="button"
              variant="ghost"
            >
              Make default
            </Button>
          ) : null}
          <Button
            className={actionClassName}
            disabled={busy}
            onClick={() => {
              void run(onTest)
            }}
            type="button"
            variant="ghost"
          >
            Test
          </Button>
          {canManage ? (
            <>
              <Button
                className={actionClassName}
                disabled={busy}
                onClick={() => setMode('rename')}
                type="button"
                variant="ghost"
              >
                Rename
              </Button>
              <Button
                className={actionClassName}
                disabled={busy}
                onClick={() => setMode('replace')}
                type="button"
                variant="ghost"
              >
                Replace keys
              </Button>
              <Button
                className={`${actionClassName} text-danger hover:text-danger`}
                disabled={busy}
                onClick={() => setConfirming('remove')}
                type="button"
                variant="ghost"
              >
                Remove
              </Button>
            </>
          ) : null}
        </div>
      ) : null}

      {mode === 'rename' ? (
        <ConnectionRenameForm
          name={connection.name}
          onCancel={() => setMode('idle')}
          onRename={async (name) => {
            const message = await onRename(name)

            if (!message) {
              setMode('idle')
            }

            return message
          }}
        />
      ) : null}

      {mode === 'replace' ? (
        <ConnectionForm
          connection={connection}
          onCancel={() => setMode('idle')}
          onSaved={(saved) => {
            setMode('idle')
            onSaved(saved)
          }}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Use live connection"
        description={`Orders and balances will use real money on ${connection.name}.`}
        keepLabel="Stay here"
        onConfirm={() => {
          setConfirming(undefined)
          void run(onUse)
        }}
        onOpenChange={(open) => setConfirming(open ? 'live' : undefined)}
        open={confirming === 'live'}
        title={`Trade with ${connection.name}?`}
      />
      <ConfirmDialog
        busy={busy}
        busyLabel="Removing…"
        confirmLabel="Remove connection"
        description={
          isDefault
            ? 'Everyone in this workspace stops using these keys, and another connection becomes the default. Nothing changes in Alpaca.'
            : 'Everyone in this workspace stops using these keys. Nothing changes in Alpaca.'
        }
        keepLabel="Keep connection"
        onConfirm={() => {
          void run(async () => {
            if (await onRemove()) {
              setConfirming(undefined)
            }
          })
        }}
        onOpenChange={(open) => setConfirming(open ? 'remove' : undefined)}
        open={confirming === 'remove'}
        title={`Remove ${connection.name}?`}
        tone="destructive"
      />
    </li>
  )
}

const verifiedAtFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** Formats a verification timestamp as "Checked Nov 10" in UTC so both sides match. */
function formatVerifiedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Checked'
  }

  return `Checked ${verifiedAtFormatter.format(date)}`
}
