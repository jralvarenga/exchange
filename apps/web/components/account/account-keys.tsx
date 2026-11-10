'use client'

import { Button } from '@workspace/ui/components/button'
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

const environments = [
  { label: 'Paper', value: 'paper' },
  { label: 'Live', value: 'live' },
] as const

/** Paper and live Alpaca keys, plus the switch for the account Exchange trades with. */
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
    const result = await setActiveAlpacaEnvironmentAction(environment)
    setMessage(result.message)

    if (!result.message) {
      showSuccessToast({
        title: `Using the ${environment} account`,
      })
    }

    router.refresh()
  }

  /** Re-checks the stored keys and names the outcome. */
  async function test(environment: 'live' | 'paper'): Promise<void> {
    const result = await testAlpacaCredentialAction(environment)
    setMessage(undefined)

    if (result.message) {
      showErrorToast({ description: result.message, title: 'Keys rejected' })
    } else {
      showSuccessToast({ title: `${capitalize(environment)} keys connected` })
    }

    router.refresh()
  }

  /** Deletes one environment's keys. */
  async function remove(environment: 'live' | 'paper'): Promise<void> {
    try {
      const result = await removeAlpacaCredentialAction(environment)
      setMessage(result.message)

      if (!result.message) {
        showSuccessToast({ title: `${capitalize(environment)} keys removed` })
      }

      router.refresh()
    } catch {
      setMessage('Those keys could not be removed.')
    }
  }

  return (
    <section
      aria-labelledby="keys-title"
      className="flex scroll-mt-28 flex-col gap-6"
      id="keys"
    >
      <SectionHeader id="keys-title" title="Alpaca keys">
        <p className="max-w-2xl text-muted-foreground">
          Add keys for the account you want to trade. New accounts start on
          paper; switch to live only after saving valid live keys.
        </p>
      </SectionHeader>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 font-medium">Trading with</legend>
        <div className="flex items-center gap-1">
          {environments.map((environment) => {
            const credential = environment.value === 'live' ? live : paper

            return (
              <Button
                aria-pressed={activeEnvironment === environment.value}
                className="h-11 rounded-full px-4 text-base aria-pressed:bg-foreground aria-pressed:text-background"
                disabled={credential?.status !== 'valid'}
                key={environment.value}
                onClick={() => {
                  if (activeEnvironment === environment.value) {
                    return
                  }

                  if (environment.value === 'live') {
                    setConfirmingLive(true)
                    return
                  }

                  void activate('paper')
                }}
                type="button"
                variant="ghost"
              >
                {environment.label}
              </Button>
            )
          })}
        </div>
      </fieldset>
      {message ? (
        <p className="text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
        <AccountKey
          active={activeEnvironment === 'paper'}
          credential={paper}
          environment="paper"
          onRemove={() => remove('paper')}
          onTest={() => test('paper')}
        />
        <AccountKey
          active={activeEnvironment === 'live'}
          credential={live}
          environment="live"
          onRemove={() => remove('live')}
          onTest={() => test('live')}
        />
      </div>
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
