'use client'

import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

import { ConnectionForm } from '@/components/account/connection-form'
import { OnboardingHeader } from '@/components/onboarding/onboarding-header'
import type { MaskedConnection } from '@/lib/alpaca/connections'
import { showSuccessToast } from '@/lib/app-toast'

interface Props {
  workspaceId: string
  workspaceName: string
}

/** Second onboarding step: add the workspace's first Alpaca key pair, or skip it. */
export function OnboardingConnect({ workspaceId, workspaceName }: Props) {
  const router = useRouter()

  const handleSaved = useCallback(
    function handleSaved(connection: MaskedConnection): void {
      showSuccessToast({ title: `${connection.name} connected` })
      router.push('/')
    },
    [router]
  )

  return (
    <div className="flex flex-col gap-8">
      <OnboardingHeader
        description={`Add a paper or live key pair from your Alpaca dashboard so ${workspaceName} can show balances and trade. Keys are encrypted and never shown again.`}
        step={2}
        title="Connect Alpaca"
        total={2}
      />
      <ConnectionForm onSaved={handleSaved} workspaceId={workspaceId} />
      <Button
        className="self-start"
        nativeButton={false}
        render={<Link href="/" />}
        variant="ghost"
      >
        Skip for now
      </Button>
    </div>
  )
}
