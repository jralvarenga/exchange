'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { CredentialsPrompt } from '@/components/credentials/credentials-prompt'
import type { MaskedAlpacaCredential } from '@/lib/alpaca/credentials'
import { isAlpacaCredentialError } from '@/lib/api/error'

interface Props {
  children: React.ReactNode
  credentialVersion: string
  credentials: Pick<MaskedAlpacaCredential, 'environment' | 'status'>[]
  environment: 'live' | 'paper'
  ready: boolean
}

/** Replaces portfolio pages when the active Alpaca keys are missing or rejected. */
export function CredentialsGate({
  children,
  credentialVersion,
  credentials,
  environment,
  ready,
}: Props) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [failed, setFailed] = useState(false)
  const [seenVersion, setSeenVersion] = useState(credentialVersion)

  // Saving, testing, or switching keys changes the version. Drop cached
  // account data before children render, then let the server status decide.
  const versionChanged = seenVersion !== credentialVersion

  if (versionChanged) {
    queryClient.removeQueries()
    setSeenVersion(credentialVersion)
    setFailed(false)
  }

  // The account page holds the keys form, so it must stay usable without them.
  const showsPrompt =
    pathname !== '/account' &&
    !pathname.startsWith('/account/') &&
    (!ready || failed)

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

  const active = credentials.find(
    (credential) => credential.environment === environment
  )
  const rejected = failed || active?.status === 'invalid'

  if (showsPrompt) {
    return (
      <CredentialsPrompt
        credentials={credentials}
        environment={environment}
        rejected={rejected}
      />
    )
  }

  if (versionChanged) {
    return null
  }

  return children
}
