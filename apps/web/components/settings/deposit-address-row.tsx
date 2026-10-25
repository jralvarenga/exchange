'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldLabel } from '@workspace/ui/components/field'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { useActionState, useState } from 'react'

import {
  removeDepositAddressAction,
  saveDepositAddressAction,
} from '@/app/(dashboard)/settings/actions'
import type { DepositSlot } from '@/lib/wallet/deposit-addresses'

interface Props {
  address?: string
  slot: DepositSlot
}

/** Edits the user's deposit address for one network and stablecoin. */
export function DepositAddressRow({ address, slot }: Props) {
  const [state, action, pending] = useActionState(saveDepositAddressAction, {})
  const [removing, setRemoving] = useState(false)
  const [removeMessage, setRemoveMessage] = useState<string>()
  const inputId = `deposit-${slot.chain}-${slot.asset}`
  const message = removeMessage ?? state.message

  async function handleRemove(): Promise<void> {
    setRemoving(true)
    const result = await removeDepositAddressAction(slot)
    setRemoveMessage(result.message)
    setRemoving(false)
  }

  return (
    <form
      action={(formData) => {
        setRemoveMessage(undefined)
        action(formData)
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="chain" value={slot.chain} />
      <input type="hidden" name="asset" value={slot.asset} />
      <Field>
        <FieldLabel htmlFor={inputId}>
          {slot.asset} on {slot.chainLabel} ({slot.tokenStandard})
        </FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              // Remount after a save or removal so the field shows the stored value.
              key={address ?? 'empty'}
              id={inputId}
              name="address"
              defaultValue={address}
              placeholder={slot.chain === 'ethereum' ? '0x…' : 'Solana address'}
              autoComplete="off"
              spellCheck={false}
              required
              disabled={pending || removing}
              aria-describedby={message ? `${inputId}-message` : undefined}
              aria-invalid={state.message ? true : undefined}
            />
          </InputGroup>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending || removing}>
              Save
            </Button>
            {address ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending || removing}
                onClick={() => {
                  void handleRemove()
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </Field>
      {message ? (
        <p
          id={`${inputId}-message`}
          role="alert"
          className="text-destructive text-sm"
        >
          {message}
        </p>
      ) : null}
    </form>
  )
}
