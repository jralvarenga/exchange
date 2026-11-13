'use client'

import type { WorkspaceRole } from '@workspace/db/queries/workspaces'
import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { useActionState, useEffect, useId, useRef, useState } from 'react'

import { inviteMemberAction } from '@/app/(dashboard)/account/workspace-actions'
import { PillGroup } from '@/components/pill-group'
import {
  assignableRoleOptions,
  workspaceRoleDescription,
} from '@/lib/workspaces/roles'

interface Props {
  /** The signed-in person's role. Admins cannot invite owners. */
  actorRole: WorkspaceRole
  onInvited: () => void
  /** The workspace this page shows, so a switch in another tab is caught. */
  workspaceId: string
}

/** Emails a one-week invitation to join the workspace with a role the inviter may give. */
export function InviteMemberForm({ actorRole, onInvited, workspaceId }: Props) {
  const [state, action, pending] = useActionState(inviteMemberAction, {})
  const [role, setRole] = useState<WorkspaceRole>('member')
  const formRef = useRef<HTMLFormElement>(null)
  const handledState = useRef(state)
  const id = useId()

  useEffect(() => {
    if (state.saved && handledState.current !== state) {
      handledState.current = state
      formRef.current?.reset()
      onInvited()
    }
  }, [onInvited, state])

  return (
    <form action={action} className="flex flex-col gap-4" ref={formRef}>
      <input name="role" type="hidden" value={role} />
      <input name="workspaceId" type="hidden" value={workspaceId} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${id}-email`}>Email</FieldLabel>
          <InputGroup>
            <InputGroupInput
              autoComplete="off"
              disabled={pending}
              id={`${id}-email`}
              name="email"
              placeholder="name@example.com"
              required
              type="email"
            />
          </InputGroup>
        </Field>
        <div className="flex flex-col gap-2">
          <span>Role</span>
          <PillGroup
            label="Role"
            onChange={setRole}
            options={assignableRoleOptions({ actor: actorRole })}
            value={role}
          />
        </div>
      </div>
      <p className="text-muted-foreground">{workspaceRoleDescription(role)}</p>
      {state.message ? (
        <p className="text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="flex">
        <Button disabled={pending} type="submit">
          {pending ? 'Sending…' : 'Send invitation'}
        </Button>
      </div>
    </form>
  )
}
