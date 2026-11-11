import { describe, expect, test } from 'bun:test'

import { getVisibleActionMessage } from '@/lib/account/action-message'

describe('getVisibleActionMessage', () => {
  test('hides a dismissed save error until a new action result arrives', () => {
    const failed = { message: 'Alpaca rejected these keys.' }

    expect(
      getVisibleActionMessage({ dismissedState: failed, state: failed })
    ).toBeUndefined()
    expect(
      getVisibleActionMessage({
        dismissedState: failed,
        state: { message: 'Alpaca rejected these keys.' },
      })
    ).toBe('Alpaca rejected these keys.')
  })

  test('shows the first save error before anything is dismissed', () => {
    const initial = {}
    const failed = { message: 'Enter the Alpaca key ID and secret.' }

    expect(
      getVisibleActionMessage({ dismissedState: initial, state: failed })
    ).toBe('Enter the Alpaca key ID and secret.')
  })
})
