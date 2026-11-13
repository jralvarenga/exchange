'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { useActionState, useEffect, useId, useRef, useState } from 'react'

import { inviteMemberAction } from '@/app/(dashboard)/account/workspace-actions'
import { PillGroup } from '@/components/pill-group'

interface Props {
  onInvited: () => void
  /** The workspace this page shows, so a switch in another tab is caught. */
  workspaceId: string
}

const roleOptions = [
  { label: 'Member', value: 'member' },
  { label: 'Owner', value: 'owner' },
] as const

/** Emails a one-week invitation to join the workspace as a member or owner. */
export function InviteMemberForm({ onInvited, workspaceId }: Props) {
  const [state, action, pending] = useActionState(inviteMemberAction, {})
  const [role, setRole] = useState<'member' | 'owner'>('member')
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
          <FieldLabel
            className="font-medium text-muted-foreground"
            htmlFor={`${id}-email`}
          >
            Email
          </FieldLabel>
          <InputGroup className="h-11">
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
          <span className="font-medium text-muted-foreground">Role</span>
          <PillGroup
            label="Role"
            onChange={setRole}
            options={[...roleOptions]}
            value={role}
          />
        </div>
      </div>
      <p className="text-muted-foreground">
        {role === 'owner'
          ? 'Owners trade live and manage connections and members.'
          : 'Members see every connection and trade on paper.'}
      </p>
      {state.message ? (
        <p className="text-destructive" role="alert">
          {state.message}
        </p>
      ) : null}
      <div className="flex">
        <Button
          className="h-11 rounded-full px-5 text-base"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Sending…' : 'Send invitation'}
        </Button>
      </div>
    </form>
  )
}
