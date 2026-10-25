'use client'

import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { useState } from 'react'

import { isAlpacaCredentialError } from '@/lib/api/error'
import { showErrorToast } from '@/lib/app-toast'

interface Props {
  children: React.ReactNode
}

let lastCredentialToastAt = 0

/** Shows one credential toast even when several queries fail together. */
function notifyCredentialError(error: unknown): void {
  if (!isAlpacaCredentialError(error)) {
    return
  }

  const now = Date.now()

  if (now - lastCredentialToastAt < 10_000) {
    return
  }

  lastCredentialToastAt = now
  showErrorToast({
    description: error.message,
    title:
      error.code === 'ALPACA_CREDENTIALS_INVALID'
        ? 'Alpaca rejected these keys'
        : 'Alpaca keys needed',
  })
}

/** Provides one TanStack Query client to the browser application. */
export function QueryProvider({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            onError: notifyCredentialError,
          },
          queries: {
            retry: (failureCount, error) => {
              if (isAlpacaCredentialError(error)) {
                return false
              }

              return failureCount < 1
            },
            staleTime: 30_000,
          },
        },
        queryCache: new QueryCache({
          onError: notifyCredentialError,
        }),
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
