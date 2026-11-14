'use client'

import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

import { WorkspaceMark } from '@/components/workspace/workspace-mark'
import { useWorkspaceSwitcher } from '@/hooks/use-workspace-switcher'
import { getAccountSectionHref } from '@/lib/account/sections'
import { workspaceRoleLabel } from '@/lib/workspaces/roles'
import type { WorkspaceSummary } from '@/models/workspace/members'

interface Props {
  workspace: WorkspaceSummary
}

/** One workspace: name, your role, its size, and a way to open or manage it. */
export function WorkspaceListRow({ workspace }: Props) {
  const switcher = useWorkspaceSwitcher()

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
          render={<Link href={getAccountSectionHref('workspace')} />}
          variant="ghost"
        >
          Manage
        </Button>
      ) : (
        <Button
          className="shrink-0"
          disabled={switcher.pending}
          onClick={() => {
            void switcher.switchWorkspace(workspace, { navigateTo: '/' })
          }}
          type="button"
          variant="secondary"
        >
          {switcher.pending ? 'Opening…' : 'Open'}
        </Button>
      )}
    </li>
  )
}

/** Writes "1 member" or "3 members". */
function countLabel(value: number, noun: string): string {
  return `${value} ${noun}${value === 1 ? '' : 's'}`
}
