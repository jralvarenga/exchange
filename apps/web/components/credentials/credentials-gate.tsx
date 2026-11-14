'use client'

import { useQueryClient } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

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
  const clearedVersion = useRef(connectionVersion)

  // Saving, testing, or switching a connection or workspace changes the
  // version. Drop cached account data before children render, then let the
  // server status decide.
  const versionChanged = seenVersion !== connectionVersion

  // The switch renders in a transition. When a child suspends on its refetch,
  // React throws that render away, state set during it included, and renders
  // again once the data arrives. Clearing on every attempt would cancel that
  // fetch and suspend again forever, so a ref (which survives discarded
  // renders) makes the clear run once per version.
  if (clearedVersion.current !== connectionVersion) {
    clearedVersion.current = connectionVersion
    queryClient.removeQueries()
  }

  if (versionChanged) {
    setSeenVersion(connectionVersion)
    setFailed(false)
  }

  // Some pages must stay usable without them; see isUngatedPath.
  const showsPrompt = !isUngatedPath(pathname) && (!ready || failed)

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

/**
 * Pages that must work without a valid connection: Account holds the
 * connection form, and Workspaces lets people switch to or create a workspace
 * that has one.
 */
function isUngatedPath(pathname: string): boolean {
  return ['/account', '/workspaces'].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}
