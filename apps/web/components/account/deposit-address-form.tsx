'use client'

import { Button } from '@workspace/ui/components/button'
import {
  InputGroup,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { useActionState, useEffect, useState } from 'react'

import {
  removeDepositAddressAction,
  saveDepositAddressAction,
} from '@/app/(dashboard)/account/actions'
import { showErrorToast, showSuccessToast } from '@/lib/app-toast'
import type { DepositSlot } from '@/lib/wallet/deposit-addresses'

interface Props {
  address?: string
  slot: DepositSlot
}

/** Edits the user's deposit address for one network and stablecoin. */
export function DepositAddressForm({ address, slot }: Props) {
  const [state, action, pending] = useActionState(saveDepositAddressAction, {})
  const [removing, setRemoving] = useState(false)
  const [removeMessage, setRemoveMessage] = useState<string>()
  const [clearedSaveMessage, setClearedSaveMessage] = useState(false)
  const inputId = `deposit-${slot.chain}-${slot.asset}`
  const message =
    removeMessage ?? (clearedSaveMessage ? undefined : state.message)
  const name = `${slot.asset} on ${slot.chainLabel}`

  useEffect(() => {
    if (state.saved) {
      showSuccessToast({ title: `${name} address saved` })
    }
  }, [state, name])

  /** Deletes the saved address and names the outcome. */
  async function handleRemove(): Promise<void> {
    setRemoving(true)
    setClearedSaveMessage(true)

    try {
      const result = await removeDepositAddressAction(slot)
      setRemoveMessage(result.message)

      if (!result.message) {
        showSuccessToast({ title: `${name} address removed` })
      }
    } catch {
      setRemoveMessage('That address could not be removed.')
      showErrorToast({ title: 'Address not removed' })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <li className="py-5">
      <form
        action={(formData) => {
          setRemoveMessage(undefined)
          setClearedSaveMessage(false)
          action(formData)
        }}
        className="flex flex-col gap-3"
      >
        <input name="chain" type="hidden" value={slot.chain} />
        <input name="asset" type="hidden" value={slot.asset} />
        <div className="flex items-baseline justify-between gap-3">
          <label className="font-medium" htmlFor={inputId}>
            {name}
          </label>
          <span className="text-muted-foreground">{slot.tokenStandard}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <InputGroup className="min-w-0 flex-1">
            <InputGroupInput
              aria-describedby={message ? `${inputId}-message` : undefined}
              aria-invalid={state.message ? true : undefined}
              autoComplete="off"
              className="font-mono"
              defaultValue={address}
              disabled={pending || removing}
              id={inputId}
              // Remount after a save or removal so the field shows the stored value.
              key={address ?? 'empty'}
              name="address"
              placeholder={slot.chain === 'ethereum' ? '0x…' : 'Solana address'}
              required
              spellCheck={false}
            />
          </InputGroup>
          <div className="flex gap-2">
            <Button
              disabled={pending || removing}
              type="submit"
              variant={address ? 'outline' : 'default'}
            >
              {pending ? 'Saving…' : address ? 'Update' : 'Save'}
            </Button>
            {address ? (
              <Button
                aria-label={`Remove ${name} address`}
                disabled={pending || removing}
                onClick={() => {
                  void handleRemove()
                }}
                type="button"
                variant="ghost"
              >
                {removing ? 'Removing…' : 'Remove'}
              </Button>
            ) : null}
          </div>
        </div>
        {message ? (
          <p
            className="text-destructive"
            id={`${inputId}-message`}
            role="alert"
          >
            {message}
          </p>
        ) : null}
      </form>
    </li>
  )
}
