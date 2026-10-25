'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  removeAlpacaCredentialAction,
  setActiveAlpacaEnvironmentAction,
  testAlpacaCredentialAction,
} from '@/app/(dashboard)/settings/actions'
import { CredentialCard } from '@/components/settings/credential-card'
import type { MaskedAlpacaCredential } from '@/lib/alpaca/credentials'

interface Props {
  activeEnvironment: 'live' | 'paper'
  credentials: MaskedAlpacaCredential[]
}

/** Paper and live Alpaca key cards, plus the active-account switch. */
export function SettingsPanel({ activeEnvironment, credentials }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState<string>()
  const [confirmingLive, setConfirmingLive] = useState(false)
  const paper = credentials.find(
    (credential) => credential.environment === 'paper'
  )
  const live = credentials.find(
    (credential) => credential.environment === 'live'
  )

  async function activate(environment: 'live' | 'paper'): Promise<void> {
    const result = await setActiveAlpacaEnvironmentAction(environment)
    setMessage(result.message)
    router.refresh()
  }

  async function test(environment: 'live' | 'paper'): Promise<void> {
    const result = await testAlpacaCredentialAction(environment)
    setMessage(result.message)
    router.refresh()
  }

  async function remove(environment: 'live' | 'paper'): Promise<void> {
    try {
      const result = await removeAlpacaCredentialAction(environment)
      setMessage(result.message)
      router.refresh()
    } catch {
      setMessage('Those keys could not be removed.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-wrap gap-2 border-0 p-0">
        <legend className="sr-only">Active Alpaca account</legend>
        <Button
          type="button"
          variant={activeEnvironment === 'paper' ? 'default' : 'outline'}
          disabled={paper?.status !== 'valid'}
          aria-pressed={activeEnvironment === 'paper'}
          onClick={() => {
            void activate('paper')
          }}
        >
          Use paper
        </Button>
        <Button
          type="button"
          variant={activeEnvironment === 'live' ? 'default' : 'outline'}
          disabled={live?.status !== 'valid'}
          aria-pressed={activeEnvironment === 'live'}
          onClick={() => setConfirmingLive(true)}
        >
          Use live
        </Button>
      </fieldset>
      <p className="text-muted-foreground text-sm">
        Add keys for the account you want to trade. New accounts start on paper.
        Switch to live only after saving valid live keys.
      </p>
      {message ? (
        <p role="alert" className="text-destructive">
          {message}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <CredentialCard
          environment="paper"
          credential={paper}
          onRemove={() => remove('paper')}
          onTest={() => test('paper')}
        />
        <CredentialCard
          environment="live"
          credential={live}
          onRemove={() => remove('live')}
          onTest={() => test('live')}
        />
      </div>
      <Dialog open={confirmingLive} onOpenChange={setConfirmingLive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch to the live account?</DialogTitle>
            <DialogDescription>
              Orders and balances will use real money on the live Alpaca
              account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setConfirmingLive(false)
                void activate('live')
              }}
            >
              Use live account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
