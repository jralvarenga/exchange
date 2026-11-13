'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { CircleUser, Layers, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { ConnectionTag } from '@/components/connection-tag'
import { UserAvatar } from '@/components/user-avatar'
import { WorkspaceMark } from '@/components/workspace/workspace-mark'
import { useSignOut } from '@/hooks/use-sign-out'
import { useWorkspaceSwitcher } from '@/hooks/use-workspace-switcher'
import type {
  ShellConnection,
  ShellUser,
  ShellWorkspace,
} from '@/lib/navigation'
import { canManageWorkspace, tradeLock } from '@/lib/workspaces/permissions'
import { workspaceRoleLabel } from '@/lib/workspaces/roles'

interface Props {
  user: ShellUser
  workspace: ShellWorkspace
}

/**
 * The signed-in account, the workspaces to switch between (with a link to all
 * of them), the connection this member trades with, and sign-out.
 */
export function UserNav({ user, workspace }: Props) {
  const { pending, signOut } = useSignOut()
  const switcher = useWorkspaceSwitcher()
  const [confirmingLive, setConfirmingLive] = useState<ShellConnection>()
  const shownWorkspaces = pickShownWorkspaces(workspace)

  /** Switches connection, asking first when it moves real money. */
  function selectConnection(id: string): void {
    const connection = workspace.connections.find((item) => item.id === id)

    if (!connection || connection.id === workspace.activeConnectionId) {
      return
    }

    if (connection.environment === 'live') {
      setConfirmingLive(connection)
      return
    }

    void switcher.switchConnection(connection, workspace.id)
  }

  /** Opens another workspace the user belongs to. */
  function selectWorkspace(id: string): void {
    const target = workspace.workspaces.find((item) => item.id === id)

    if (target && target.id !== workspace.id) {
      void switcher.switchWorkspace(target)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Account menu"
          className="flex size-12 shrink-0 touch-manipulation items-center justify-center rounded-full outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring"
        >
          <UserAvatar
            className="size-12"
            email={user.email}
            image={user.image}
            name={user.name}
            size={48}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80" sideOffset={8}>
          <div className="flex items-center gap-3 px-3 pt-2 pb-3">
            <UserAvatar
              className="size-11"
              email={user.email}
              image={user.image}
              name={user.name}
              size={44}
            />
            <div className="flex min-w-0 flex-col">
              {user.name ? (
                <p className="truncate font-bold">{user.name}</p>
              ) : null}
              <p className="truncate text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            onValueChange={(value) => selectWorkspace(String(value))}
            value={workspace.id}
          >
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            {shownWorkspaces.map((item) => (
              <DropdownMenuRadioItem
                disabled={switcher.pending}
                key={item.id}
                value={item.id}
              >
                <WorkspaceMark className="size-8 text-base" name={item.name} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.name}</span>
                  {item.id === workspace.id ? (
                    <span className="truncate text-muted-foreground">
                      {workspaceRoleLabel(workspace.role)}
                    </span>
                  ) : null}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuItem render={<Link href="/workspaces" />}>
            <Layers aria-hidden="true" />
            <span className="flex-1">All workspaces</span>
            <span className="text-muted-foreground tabular-nums">
              {workspace.workspaces.length}
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            onValueChange={(value) => selectConnection(String(value))}
            value={workspace.activeConnectionId ?? ''}
          >
            <DropdownMenuLabel>Trading with</DropdownMenuLabel>
            {workspace.connections.map((connection) => (
              <DropdownMenuRadioItem
                disabled={
                  switcher.pending ||
                  connection.status !== 'valid' ||
                  isPaperOnlyLive(workspace.role, connection.environment)
                }
                key={connection.id}
                value={connection.id}
              >
                <span className="min-w-0 flex-1 truncate">
                  {connection.name}
                </span>
                <ConnectionTag
                  environment={connection.environment}
                  status={connection.status}
                />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {workspace.connections.length === 0 &&
          canManageWorkspace(workspace.role) ? (
            <DropdownMenuItem render={<Link href="/account#connections" />}>
              <Plus aria-hidden="true" />
              Add a connection
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem render={<Link href="/account" />}>
              <CircleUser aria-hidden="true" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={pending}
              onClick={() => {
                void signOut()
              }}
            >
              <LogOut aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        confirmLabel="Use live connection"
        description={`Orders and balances will use real money on ${confirmingLive?.name ?? 'this connection'}.`}
        keepLabel="Stay here"
        onConfirm={() => {
          if (confirmingLive) {
            void switcher.switchConnection(confirmingLive, workspace.id)
          }

          setConfirmingLive(undefined)
        }}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingLive(undefined)
          }
        }}
        open={confirmingLive !== undefined}
        title={`Trade with ${confirmingLive?.name ?? 'live money'}?`}
      />
    </>
  )
}

/** How many workspaces the menu lists before "All workspaces" takes over. */
const MENU_WORKSPACE_LIMIT = 4

/** Lists the current workspace first, then the others up to the menu's limit. */
function pickShownWorkspaces(
  workspace: ShellWorkspace
): ShellWorkspace['workspaces'] {
  const current = workspace.workspaces.filter(
    (item) => item.id === workspace.id
  )
  const others = workspace.workspaces.filter((item) => item.id !== workspace.id)

  return [...current, ...others].slice(0, MENU_WORKSPACE_LIMIT)
}

/**
 * Paper members cannot trade on live connections, so the menu does not offer
 * them. This is a UI choice: the server blocks live trading, not viewing.
 */
function isPaperOnlyLive(
  role: ShellWorkspace['role'],
  environment: 'live' | 'paper'
): boolean {
  return tradeLock({ environment, role }) === 'paper_only'
}
