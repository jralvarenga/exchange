'use client'

import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { switchWorkspaceAction } from '@/app/(dashboard)/account/workspace-actions'
import { WorkspaceMark } from '@/components/workspace/workspace-mark'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'
import { workspaceRoleLabel } from '@/lib/workspaces/roles'
import type { WorkspaceSummary } from '@/models/workspace/members'

interface Props {
  workspace: WorkspaceSummary
}

/** One workspace: name, your role, its size, and a way to open or manage it. */
export function WorkspaceListRow({ workspace }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  /** Makes this workspace the active one and opens the dashboard in it. */
  async function handleOpen(): Promise<void> {
    setPending(true)

    try {
      const result = await switchWorkspaceAction(workspace.id)

      if (result.message) {
        showErrorToast({ description: result.message, title: 'Not opened' })
        return
      }

      showSuccessToast({ title: `Opened ${workspace.name}` })
      router.push('/')
    } finally {
      setPending(false)
    }
  }

  return (
    <li className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-center gap-4">
        <WorkspaceMark className="size-11" name={workspace.name} />
        <div className="flex min-w-0 flex-col">
          <p className="flex items-center gap-2 font-bold text-lg">
            <span className="truncate">{workspace.name}</span>
            {workspace.isCurrent ? (
              <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                Current
              </span>
            ) : null}
          </p>
          <p className="text-muted-foreground tabular-nums">
            {workspaceRoleLabel(workspace.role)} ·{' '}
            {countLabel(workspace.memberCount, 'member')} ·{' '}
            {countLabel(workspace.connectionCount, 'connection')}
          </p>
        </div>
      </div>
      {workspace.isCurrent ? (
        <Button
          className="shrink-0"
          nativeButton={false}
          render={<Link href="/account#workspace" />}
          variant="ghost"
        >
          Manage
        </Button>
      ) : (
        <Button
          className="shrink-0"
          disabled={pending}
          onClick={() => {
            void handleOpen()
          }}
          type="button"
          variant="secondary"
        >
          {pending ? 'Opening…' : 'Open'}
        </Button>
      )}
    </li>
  )
}

/** Writes "1 member" or "3 members". */
function countLabel(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? '' : 's'}`
}
