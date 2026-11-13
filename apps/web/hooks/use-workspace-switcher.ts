'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { switchConnectionAction } from '@/app/(dashboard)/account/actions'
import { switchWorkspaceAction } from '@/app/(dashboard)/account/workspace-actions'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'

interface SwitchTarget {
  id: string
  name: string
}

interface UseWorkspaceSwitcherResult {
  pending: boolean
  switchConnection: (connection: SwitchTarget) => Promise<void>
  switchWorkspace: (workspace: SwitchTarget) => Promise<void>
}

/** Switches the active workspace or connection and reloads server data. */
export function useWorkspaceSwitcher(): UseWorkspaceSwitcherResult {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  /** Runs one switch, names the outcome in a toast, and refreshes on success. */
  async function run(
    task: () => Promise<{ message?: string }>,
    success: string
  ): Promise<void> {
    setPending(true)

    try {
      const result = await task()

      if (result.message) {
        showErrorToast({ description: result.message, title: 'Not switched' })
        return
      }

      showSuccessToast({ title: success })
      router.refresh()
    } catch {
      showErrorToast({ title: 'Not switched' })
    } finally {
      setPending(false)
    }
  }

  return {
    pending,
    switchConnection: (connection) =>
      run(
        () => switchConnectionAction(connection.id),
        `Using ${connection.name}`
      ),
    switchWorkspace: (workspace) =>
      run(
        () => switchWorkspaceAction(workspace.id),
        `Opened ${workspace.name}`
      ),
  }
}
