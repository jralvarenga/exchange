'use client'

import type { WorkspaceRole } from '@workspace/db/queries/workspaces'
import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { useState } from 'react'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { UserAvatar } from '@/components/user-avatar'
import { canRemoveMember } from '@/lib/workspaces/permissions'
import {
  assignableRoleOptions,
  workspaceRoleLabel,
} from '@/lib/workspaces/roles'
import type { WorkspaceMember } from '@/models/workspace/members'

interface Props {
  /** The signed-in person's role, which limits what they can do to this member. */
  actorRole: WorkspaceRole
  canManage: boolean
  isSelf: boolean
  member: WorkspaceMember
  onChangeRole: (role: WorkspaceRole) => Promise<void>
  onRemove: () => Promise<boolean>
}

const actionClassName = 'h-11 rounded-full px-3 text-base'

/** A workspace member with their role and, for owners, a role picker and removal. */
export function MemberRow({
  actorRole,
  canManage,
  isSelf,
  member,
  onChangeRole,
  onRemove,
}: Props) {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const label = member.name || member.email
  const roleOptions = assignableRoleOptions({
    actor: actorRole,
    from: member.role,
  })
  const editable =
    canManage &&
    !isSelf &&
    canRemoveMember({ actor: actorRole, target: member.role })

  /** Runs one member action and keeps the buttons disabled while it is in flight. */
  async function run(task: () => Promise<unknown>): Promise<void> {
    setBusy(true)

    try {
      await task()
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <UserAvatar
          className="size-11"
          email={member.email}
          image={member.image}
          name={member.name}
          size={44}
        />
        <div className="flex min-w-0 flex-col">
          <p className="flex items-center gap-2 font-bold text-lg">
            <span className="truncate">{label}</span>
            {isSelf ? (
              <span className="rounded-full bg-muted px-2 font-medium text-base text-muted-foreground">
                You
              </span>
            ) : null}
          </p>
          <p className="truncate text-muted-foreground">
            {workspaceRoleLabel(member.role)}
            {member.name ? ` · ${member.email}` : null}
          </p>
        </div>
      </div>
      {editable ? (
        <div className="-ml-3 flex shrink-0 items-center gap-1 sm:ml-0">
          <Select
            disabled={busy}
            items={roleOptions}
            onValueChange={(next) => {
              if (next !== null && next !== member.role) {
                void run(() => onChangeRole(next))
              }
            }}
            value={member.role}
          >
            <SelectTrigger
              aria-label={`Role of ${label}`}
              className="h-11 rounded-full px-4 text-base"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className={`${actionClassName} text-danger hover:text-danger`}
            disabled={busy}
            onClick={() => setConfirming(true)}
            type="button"
            variant="ghost"
          >
            Remove
          </Button>
        </div>
      ) : null}
      <ConfirmDialog
        busy={busy}
        busyLabel="Removing…"
        confirmLabel="Remove member"
        description="They lose access to this workspace. Connections they added stay here."
        keepLabel="Keep member"
        onConfirm={() => {
          void run(async () => {
            if (await onRemove()) {
              setConfirming(false)
            }
          })
        }}
        onOpenChange={setConfirming}
        open={confirming}
        title={`Remove ${label}?`}
        tone="destructive"
      />
    </li>
  )
}
