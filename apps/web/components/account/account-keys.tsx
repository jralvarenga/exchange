'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  removeAlpacaCredentialAction,
  setActiveAlpacaEnvironmentAction,
  testAlpacaCredentialAction,
} from '@/app/(dashboard)/account/actions'
import { AccountKey } from '@/components/account/account-key'
import { LiveAccountDialog } from '@/components/account/live-account-dialog'
import { SectionHeader } from '@/components/section-header'
import type { MaskedAlpacaCredential } from '@/lib/alpaca/credentials'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'

interface Props {
  activeEnvironment: 'live' | 'paper'
  credentials: MaskedAlpacaCredential[]
}

/** Paper and live Alpaca keys as one list, including which account Exchange trades with. */
export function AccountKeys({ activeEnvironment, credentials }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [confirmingLive, setConfirmingLive] = useState(false)
  const paper = credentials.find(
    (credential) => credential.environment === 'paper'
  )
  const live = credentials.find(
    (credential) => credential.environment === 'live'
  )

  /** Switches the account used for every Alpaca call. */
  async function activate(environment: 'live' | 'paper'): Promise<void> {
    try {
      const result = await setActiveAlpacaEnvironmentAction(environment)
      setMessage(result.message)

      if (!result.message) {
        showSuccessToast({ title: `Using the ${environment} account` })
      }

      router.refresh()
    } catch {
      setMessage('The active account could not be changed.')
    }
  }

  /** Re-checks the stored keys and names the outcome. */
  async function test(environment: 'live' | 'paper'): Promise<void> {
    try {
      const result = await testAlpacaCredentialAction(environment)
      setMessage(undefined)

      if (result.message) {
        showErrorToast({
          description: result.message,
          title: 'Keys not tested',
        })
      } else {
        showSuccessToast({ title: `${capitalize(environment)} keys connected` })
      }

      router.refresh()
    } catch {
      setMessage('The keys could not be tested.')
      showErrorToast({ title: 'Keys not tested' })
    }
  }

  /** Deletes one environment's keys. Returns whether the stored pair is gone. */
  async function remove(environment: 'live' | 'paper'): Promise<boolean> {
    try {
      const result = await removeAlpacaCredentialAction(environment)
      setMessage(result.message)

      if (result.message) {
        return false
      }

      showSuccessToast({ title: `${capitalize(environment)} keys removed` })
      router.refresh()

      return true
    } catch {
      setMessage('Those keys could not be removed.')

      return false
    }
  }

  return (
    <section
      aria-labelledby="keys-title"
      className="flex max-w-3xl scroll-mt-28 flex-col gap-4"
      id="keys"
    >
      <SectionHeader id="keys-title" title="Alpaca keys">
        <p className="text-muted-foreground">
          One key pair is enough. Switch to live only once its keys are
          connected.
        </p>
      </SectionHeader>
      {message ? (
        <p className="text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border border-border border-y">
        <AccountKey
          active={activeEnvironment === 'paper'}
          credential={paper}
          environment="paper"
          onActivate={() => {
            void activate('paper')
          }}
          onRemove={() => remove('paper')}
          onTest={() => test('paper')}
        />
        <AccountKey
          active={activeEnvironment === 'live'}
          credential={live}
          environment="live"
          onActivate={() => setConfirmingLive(true)}
          onRemove={() => remove('live')}
          onTest={() => test('live')}
        />
      </ul>
      <LiveAccountDialog
        onConfirm={() => {
          setConfirmingLive(false)
          void activate('live')
        }}
        onOpenChange={setConfirmingLive}
        open={confirmingLive}
      />
    </section>
  )
}

/** Uppercases the first letter of an environment name. */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
