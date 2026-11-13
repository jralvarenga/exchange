'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { CredentialsPrompt } from '@/components/credentials/credentials-prompt'
import { isAlpacaCredentialError } from '@/lib/api/error'
import type { ShellConnection } from '@/lib/navigation'

interface Props {
  active: ShellConnection | undefined
  canManage: boolean
  children: React.ReactNode
  connectionVersion: string
  connections: ShellConnection[]
  ready: boolean
}

/** Replaces portfolio pages when the active connection is missing or rejected. */
export function CredentialsGate({
  active,
  canManage,
  children,
  connectionVersion,
  connections,
  ready,
}: Props) {
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const [failed, setFailed] = useState(false)
  const [seenVersion, setSeenVersion] = useState(connectionVersion)

  // Saving, testing, or switching a connection or workspace changes the
  // version. Drop cached account data before children render, then let the
  // server status decide.
  const versionChanged = seenVersion !== connectionVersion

  if (versionChanged) {
    queryClient.removeQueries()
    setSeenVersion(connectionVersion)
    setFailed(false)
  }

  // The account page holds the connection form, so it must stay usable without them.
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

  if (showsPrompt) {
    return (
      <CredentialsPrompt
        active={active}
        canManage={canManage}
        connections={connections}
        rejected={failed || active?.status === 'invalid'}
      />
    )
  }

  if (versionChanged) {
    return null
  }

  return children
}
