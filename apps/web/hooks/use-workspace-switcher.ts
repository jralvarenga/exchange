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

interface SwitchWorkspaceOptions {
  /** Opens this path afterwards instead of refreshing the current page. */
  navigateTo?: string
}

interface UseWorkspaceSwitcherResult {
  pending: boolean
  switchConnection: (connection: SwitchTarget) => Promise<void>
  switchWorkspace: (
    workspace: SwitchTarget,
    options?: SwitchWorkspaceOptions
  ) => Promise<void>
}

/** Switches the active workspace or connection and reloads server data. */
export function useWorkspaceSwitcher(): UseWorkspaceSwitcherResult {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  /** Runs one switch, names the outcome in a toast, then refreshes or navigates. */
  async function run(
    task: () => Promise<{ message?: string }>,
    success: string,
    navigateTo?: string
  ): Promise<void> {
    setPending(true)

    try {
      const result = await task()

      if (result.message) {
        showErrorToast({ description: result.message, title: 'Not switched' })
        return
      }

      showSuccessToast({ title: success })

      if (navigateTo) {
        router.push(navigateTo)
      } else {
        router.refresh()
      }
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
    switchWorkspace: (workspace, options) =>
      run(
        () => switchWorkspaceAction(workspace.id),
        `Opened ${workspace.name}`,
        options?.navigateTo
      ),
  }
}
