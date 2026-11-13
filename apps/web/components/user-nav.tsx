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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { CircleUser, Layers, LogOut, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { UserAvatar } from '@/components/user-avatar'
import { useSignOut } from '@/hooks/use-sign-out'
import { useWorkspaceSwitcher } from '@/hooks/use-workspace-switcher'
import { getCredentialStatusInfo } from '@/lib/account/status'
import type {
  ShellConnection,
  ShellUser,
  ShellWorkspace,
} from '@/lib/navigation'

interface Props {
  user: ShellUser
  workspace: ShellWorkspace
}

/**
 * The signed-in account, with a workspace switcher (a submenu that also links
 * to every workspace and to creating one), the connection switcher and sign-out.
 */
export function UserNav({ user, workspace }: Props) {
  const { pending, signOut } = useSignOut()
  const switcher = useWorkspaceSwitcher()
  const [confirmingLive, setConfirmingLive] = useState<ShellConnection>()

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

    void switcher.switchConnection(connection)
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
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {user.name ? <div>{user.name}</div> : null}
              <div>{user.email}</div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={switcher.pending}>
                <span className="truncate">{workspace.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                <DropdownMenuRadioGroup
                  onValueChange={(value) => selectWorkspace(String(value))}
                  value={workspace.id}
                >
                  <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
                  {workspace.workspaces.map((item) => (
                    <DropdownMenuRadioItem
                      disabled={switcher.pending}
                      key={item.id}
                      value={item.id}
                    >
                      <span className="truncate">{item.name}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/workspaces" />}>
                  <Layers aria-hidden="true" />
                  All workspaces
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/workspaces#new" />}>
                  <Plus aria-hidden="true" />
                  New workspace
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            onValueChange={(value) => selectConnection(String(value))}
            value={workspace.activeConnectionId ?? ''}
          >
            <DropdownMenuLabel>Connection</DropdownMenuLabel>
            {workspace.connections.map((connection) => (
              <DropdownMenuRadioItem
                disabled={switcher.pending || connection.status !== 'valid'}
                key={connection.id}
                value={connection.id}
              >
                <span className="truncate">{connection.name}</span>
                <span className="text-muted-foreground">
                  {connection.status === 'valid'
                    ? connection.environment === 'live'
                      ? 'Live'
                      : 'Paper'
                    : getCredentialStatusInfo(connection.status).label}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {workspace.connections.length === 0 ? (
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
            void switcher.switchConnection(confirmingLive)
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
