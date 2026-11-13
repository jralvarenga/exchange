'use client'

import { Button } from '@workspace/ui/components/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import {
  removeConnectionAction,
  renameConnectionAction,
  setDefaultConnectionAction,
  switchConnectionAction,
  testConnectionAction,
} from '@/app/(dashboard)/account/actions'
import { ConnectionForm } from '@/components/account/connection-form'
import { ConnectionRow } from '@/components/account/connection-row'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import type { MaskedConnection } from '@/lib/alpaca/connections'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'

interface Props {
  activeConnectionId: string | null
  canManage: boolean
  canTest: boolean
  connections: MaskedConnection[]
  defaultConnectionId: string | null
}

/** The workspace's named Alpaca connections and which one this member trades with. */
export function AccountConnections({
  activeConnectionId,
  canManage,
  canTest,
  connections,
  defaultConnectionId,
}: Props) {
  const router = useRouter()
  const [adding, setAdding] = useState(connections.length === 0 && canManage)

  /** Toasts a server result and refreshes server props on success. */
  const settle = useCallback(
    function settle(result: { message?: string }, success: string): boolean {
      if (result.message) {
        showErrorToast({ description: result.message, title: 'Not changed' })
        router.refresh()

        return false
      }

      showSuccessToast({ title: success })
      router.refresh()

      return true
    },
    [router]
  )

  const handleSaved = useCallback(
    function handleSaved(connection: MaskedConnection): void {
      setAdding(false)
      showSuccessToast({ title: `${connection.name} connected` })
      router.refresh()
    },
    [router]
  )

  return (
    <Section className="max-w-3xl" id="connections" titleId="connections-title">
      <SectionHeader id="connections-title" title="Connections">
        <p className="text-muted-foreground">
          {canManage
            ? 'Each connection is a named Alpaca key pair. Everyone here trades with the default until they pick another.'
            : canTest
              ? 'Each connection is a named Alpaca key pair. Only owners and admins add or change keys.'
              : 'Each connection is a named Alpaca key pair. Pick the one to look at; viewers cannot trade.'}
        </p>
      </SectionHeader>
      {connections.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border border-border border-y">
          {connections.map((connection) => (
            <ConnectionRow
              active={connection.id === activeConnectionId}
              canManage={canManage}
              canTest={canTest}
              connection={connection}
              isDefault={connection.id === defaultConnectionId}
              key={connection.id}
              onMakeDefault={async () => {
                settle(
                  await setDefaultConnectionAction(connection.id),
                  `${connection.name} is the default`
                )
              }}
              onRemove={async () =>
                settle(
                  await removeConnectionAction(connection.id),
                  `${connection.name} removed`
                )
              }
              onRename={async (name) => {
                const result = await renameConnectionAction(connection.id, name)

                if (!result.message) {
                  showSuccessToast({ title: 'Connection renamed' })
                  router.refresh()
                }

                return result.message
              }}
              onSaved={handleSaved}
              onTest={async () => {
                settle(
                  await testConnectionAction(connection.id),
                  `${connection.name} connected`
                )
              }}
              onUse={async () => {
                settle(
                  await switchConnectionAction(connection.id),
                  `Using ${connection.name}`
                )
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="border-border border-y py-8 text-muted-foreground">
          {canManage
            ? 'No connections yet. Add a paper key pair to start; one is enough.'
            : 'No connections yet. Ask a workspace owner to add one.'}
        </p>
      )}
      {canManage && adding ? (
        <ConnectionForm
          onCancel={connections.length > 0 ? () => setAdding(false) : undefined}
          onSaved={handleSaved}
        />
      ) : null}
      {canManage && !adding ? (
        <div className="-ml-2.5 flex">
          <Button onClick={() => setAdding(true)} type="button" variant="ghost">
            <Plus aria-hidden="true" />
            Add connection
          </Button>
        </div>
      ) : null}
    </Section>
  )
}
