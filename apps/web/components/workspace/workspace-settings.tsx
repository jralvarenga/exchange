'use client'

import type { WorkspaceRole } from '@workspace/db/queries/workspaces'
import { Button } from '@workspace/ui/components/button'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  removeMemberAction,
  renameWorkspaceAction,
  revokeInvitationAction,
  updateMemberRoleAction,
} from '@/app/(dashboard)/account/workspace-actions'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { SectionHeader } from '@/components/section-header'
import { InvitationRow } from '@/components/workspace/invitation-row'
import { InviteMemberForm } from '@/components/workspace/invite-member-form'
import { MemberRow } from '@/components/workspace/member-row'
import { WorkspaceNameForm } from '@/components/workspace/workspace-name-form'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'
import { workspaceRoleNoun } from '@/lib/workspaces/roles'
import type {
  PendingInvitation,
  WorkspaceMember,
} from '@/models/workspace/members'

interface Props {
  canDelete: boolean
  canLeave: boolean
  canManage: boolean
  currentUserId: string
  invitations: PendingInvitation[]
  members: WorkspaceMember[]
  name: string
  /** The signed-in person's role, which limits the roles they can give. */
  role: WorkspaceRole
  workspaceId: string
}

type Panel = 'create' | 'invite' | 'none' | 'rename'

const actionClassName = 'h-11 rounded-full px-3 text-base'

/** The active workspace: its name, members, invitations, and creating or leaving workspaces. */
export function WorkspaceSettings({
  canDelete,
  canLeave,
  canManage,
  currentUserId,
  invitations,
  members,
  name,
  role: actorRole,
  workspaceId,
}: Props) {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>('none')
  const [confirmingLeave, setConfirmingLeave] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  /** Toasts a server result and refreshes server props on success. */
  const settle = useCallback(
    function settle(result: { message?: string }, success: string): boolean {
      if (result.message) {
        showErrorToast({ description: result.message, title: 'Not changed' })

        return false
      }

      showSuccessToast({ title: success })
      router.refresh()

      return true
    },
    [router]
  )

  const closePanel = useCallback(function closePanel(): void {
    setPanel('none')
  }, [])

  const handleRenamed = useCallback(
    function handleRenamed(): void {
      setPanel('none')
      showSuccessToast({ title: 'Workspace renamed' })
      router.refresh()
    },
    [router]
  )

  const handleCreated = useCallback(
    function handleCreated(): void {
      setPanel('none')
      showSuccessToast({ title: 'Workspace created' })
      router.refresh()
    },
    [router]
  )

  const handleInvited = useCallback(
    function handleInvited(): void {
      showSuccessToast({ title: 'Invitation sent' })
      router.refresh()
    },
    [router]
  )

  /** Leaves the workspace; the dashboard reloads in another one. */
  async function handleLeave(): Promise<void> {
    setLeaving(true)

    try {
      if (settle(await leaveWorkspaceAction(workspaceId), `Left ${name}`)) {
        setConfirmingLeave(false)
      }
    } finally {
      setLeaving(false)
    }
  }

  /** Deletes the workspace; the dashboard reloads in another one. */
  async function handleDelete(): Promise<void> {
    setDeleting(true)

    try {
      if (settle(await deleteWorkspaceAction(workspaceId), `Deleted ${name}`)) {
        setConfirmingDelete(false)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section
      aria-labelledby="workspace-title"
      className="flex max-w-3xl scroll-mt-28 flex-col gap-4"
      id="workspace"
    >
      <SectionHeader id="workspace-title" title="Workspace">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{name}</span> ·{' '}
          {members.length === 1 ? 'Only you' : `${members.length} members`}
        </p>
      </SectionHeader>

      {panel === 'rename' ? (
        <WorkspaceNameForm
          action={renameWorkspaceAction}
          defaultName={name}
          label="Workspace name"
          onCancel={closePanel}
          onSaved={handleRenamed}
          pendingLabel="Renaming…"
          submitLabel="Rename workspace"
          workspaceId={workspaceId}
        />
      ) : null}

      <ul className="flex flex-col divide-y divide-border border-border border-y">
        {members.map((member) => (
          <MemberRow
            actorRole={actorRole}
            canManage={canManage}
            isSelf={member.userId === currentUserId}
            key={member.userId}
            member={member}
            onChangeRole={async (role) => {
              settle(
                await updateMemberRoleAction(workspaceId, member.userId, role),
                `${member.name || member.email} is now ${workspaceRoleNoun(role)}`
              )
            }}
            onRemove={async () =>
              settle(
                await removeMemberAction(workspaceId, member.userId),
                `${member.name || member.email} removed`
              )
            }
          />
        ))}
      </ul>

      {canManage && invitations.length > 0 ? (
        <div className="flex flex-col gap-2 pt-4">
          <h3 className="font-bold text-lg">Pending invitations</h3>
          <ul className="flex flex-col divide-y divide-border border-border border-y">
            {invitations.map((invitation) => (
              <InvitationRow
                invitation={invitation}
                key={invitation.id}
                onRevoke={async () =>
                  settle(
                    await revokeInvitationAction(workspaceId, invitation.id),
                    'Invitation canceled'
                  )
                }
              />
            ))}
          </ul>
        </div>
      ) : null}

      {panel === 'invite' ? (
        <InviteMemberForm
          actorRole={actorRole}
          onInvited={handleInvited}
          workspaceId={workspaceId}
        />
      ) : null}

      {panel === 'create' ? (
        <WorkspaceNameForm
          action={createWorkspaceAction}
          label="New workspace name"
          onCancel={closePanel}
          onSaved={handleCreated}
          pendingLabel="Creating…"
          submitLabel="Create and switch"
        />
      ) : null}

      <div className="-ml-3 flex flex-wrap items-center gap-1">
        {canManage && panel !== 'invite' ? (
          <Button
            className={actionClassName}
            onClick={() => setPanel('invite')}
            type="button"
            variant="ghost"
          >
            <Plus aria-hidden="true" />
            Invite member
          </Button>
        ) : null}
        {canManage && panel !== 'rename' ? (
          <Button
            className={actionClassName}
            onClick={() => setPanel('rename')}
            type="button"
            variant="ghost"
          >
            Rename
          </Button>
        ) : null}
        {panel !== 'create' ? (
          <Button
            className={actionClassName}
            onClick={() => setPanel('create')}
            type="button"
            variant="ghost"
          >
            New workspace
          </Button>
        ) : null}
        {canLeave ? (
          <Button
            className={`${actionClassName} text-danger hover:text-danger`}
            onClick={() => setConfirmingLeave(true)}
            type="button"
            variant="ghost"
          >
            Leave
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            className={`${actionClassName} text-danger hover:text-danger`}
            onClick={() => setConfirmingDelete(true)}
            type="button"
            variant="ghost"
          >
            Delete workspace
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        busy={leaving}
        busyLabel="Leaving…"
        confirmLabel="Leave workspace"
        description="You lose access to its connections and history. An owner or admin can invite you again."
        keepLabel="Stay"
        onConfirm={() => {
          void handleLeave()
        }}
        onOpenChange={setConfirmingLeave}
        open={confirmingLeave}
        title={`Leave ${name}?`}
        tone="destructive"
      />
      <ConfirmDialog
        busy={deleting}
        busyLabel="Deleting…"
        confirmLabel="Delete workspace"
        description="Its connections, members, invitations and history are deleted for everyone. This cannot be undone."
        keepLabel="Keep workspace"
        onConfirm={() => {
          void handleDelete()
        }}
        onOpenChange={setConfirmingDelete}
        open={confirmingDelete}
        title={`Delete ${name}?`}
        tone="destructive"
      />
    </section>
  )
}
