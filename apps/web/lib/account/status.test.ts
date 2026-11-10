import { describe, expect, test } from 'bun:test'

import {
  formatMemberSince,
  getPromptCredentialStatus,
} from '@/lib/account/status'

describe('formatMemberSince', () => {
  test('formats a UTC timestamp as a short month and year', () => {
    expect(formatMemberSince({ createdAt: '2024-03-15T12:00:00.000Z' })).toBe(
      'Mar 2024'
    )
  })

  test('returns undefined when the date cannot be parsed', () => {
    expect(formatMemberSince({ createdAt: 'not-a-date' })).toBeUndefined()
    expect(formatMemberSince({ createdAt: '' })).toBeUndefined()
  })
})

describe('getPromptCredentialStatus', () => {
  test('keeps unverified keys when the prompt is in a rejected state', () => {
    expect(
      getPromptCredentialStatus({
        rejected: true,
        status: 'unverified',
      })
    ).toBe('unverified')
  })

  test('marks stored valid keys invalid only after a request failure', () => {
    expect(
      getPromptCredentialStatus({
        rejected: true,
        status: 'valid',
      })
    ).toBe('invalid')
  })

  test('leaves missing or already-invalid keys unchanged', () => {
    expect(
      getPromptCredentialStatus({ rejected: true, status: 'invalid' })
    ).toBe('invalid')
    expect(
      getPromptCredentialStatus({ rejected: true, status: undefined })
    ).toBeUndefined()
    expect(
      getPromptCredentialStatus({ rejected: false, status: 'valid' })
    ).toBe('valid')
  })
})
