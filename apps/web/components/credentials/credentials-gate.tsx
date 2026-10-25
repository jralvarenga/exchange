'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { CredentialsPrompt } from '@/components/credentials/credentials-prompt'
import { isAlpacaCredentialError } from '@/lib/api/error'

interface Props {
  children: React.ReactNode
  credentialVersion: string
  environment: 'live' | 'paper'
  hasCredential: boolean
  ready: boolean
}

/** Replaces portfolio pages when the active Alpaca keys are missing or rejected. */
export function CredentialsGate({
  children,
  credentialVersion,
  environment,
  hasCredential,
  ready,
}: Props) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [failed, setFailed] = useState(false)
  const [seenVersion, setSeenVersion] = useState(credentialVersion)

  // Saving, testing, or switching keys changes the version. Clear the runtime
  // failure so the server's fresh status decides again.
  if (seenVersion !== credentialVersion) {
    setSeenVersion(credentialVersion)
    setFailed(false)
  }
  const showsPrompt =
    !pathname.startsWith('/settings') &&
    !pathname.startsWith('/funds-wallet') &&
    (!ready || failed)

  useEffect(() => {
    queryClient.removeQueries()
  }, [queryClient])

  useEffect(() => {
    function markFailed(error: unknown): void {
      if (isAlpacaCredentialError(error)) {
        setFailed(true)
      }
    }

    const unsubscribeQueries = queryClient
      .getQueryCache()
      .subscribe((event) => {
        if (event.type === 'updated') {
          markFailed(event.query.state.error)
        }
      })
    const unsubscribeMutations = queryClient
      .getMutationCache()
      .subscribe((event) => {
        if (event.type === 'updated') {
          markFailed(event.mutation.state.error)
        }
      })

    return () => {
      unsubscribeQueries()
      unsubscribeMutations()
    }
  }, [queryClient])

  if (showsPrompt) {
    return (
      <CredentialsPrompt
        environment={environment}
        rejected={hasCredential || failed}
      />
    )
  }

  return children
}
