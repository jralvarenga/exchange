import { mock } from 'bun:test'

mock.module('server-only', () => ({}))

const { decryptSecret, encryptSecret, parseEncryptionKeys } = await import(
  './secret-box'
)

import { describe, expect, test } from 'bun:test'
import { randomBytes } from 'node:crypto'

function keys(ids: string[]) {
  return ids.map((id) => ({
    id,
    key: randomBytes(32),
  }))
}

describe('secret box', () => {
  test('round-trips a secret for the same AAD', () => {
    const encryptionKeys = keys(['k1'])
    const payload = encryptSecret({
      aad: 'user-1:paper:secret',
      keys: encryptionKeys,
      plaintext: 'alpaca-secret',
    })

    expect(
      decryptSecret({
        aad: 'user-1:paper:secret',
        keys: encryptionKeys,
        payload,
      })
    ).toBe('alpaca-secret')
  })

  test('rejects a tampered ciphertext', () => {
    const encryptionKeys = keys(['k1'])
    const payload = encryptSecret({
      aad: 'user-1:paper:secret',
      keys: encryptionKeys,
      plaintext: 'alpaca-secret',
    })
    const parts = payload.split(':')
    parts[4] = Buffer.from('tampered').toString('base64url')

    expect(() =>
      decryptSecret({
        aad: 'user-1:paper:secret',
        keys: encryptionKeys,
        payload: parts.join(':'),
      })
    ).toThrow('Unable to decrypt credential.')
  })

  test('rejects a ciphertext opened with different AAD', () => {
    const encryptionKeys = keys(['k1'])
    const payload = encryptSecret({
      aad: 'user-1:paper:secret',
      keys: encryptionKeys,
      plaintext: 'alpaca-secret',
    })

    expect(() =>
      decryptSecret({
        aad: 'user-2:paper:secret',
        keys: encryptionKeys,
        payload,
      })
    ).toThrow('Unable to decrypt credential.')
  })

  test('decrypts older data after a new key is added in front', () => {
    const original = keys(['k1'])
    const payload = encryptSecret({
      aad: 'user-1:live:keyId',
      keys: original,
      plaintext: 'PKTESTKEY12',
    })
    const rotated = [...keys(['k2']), ...original]
    const parsed = parseEncryptionKeys(
      rotated
        .map((key) => `${key.id}:${key.key.toString('base64url')}`)
        .join(',')
    )

    expect(
      decryptSecret({
        aad: 'user-1:live:keyId',
        keys: parsed,
        payload,
      })
    ).toBe('PKTESTKEY12')
    expect(
      encryptSecret({
        aad: 'user-1:live:keyId',
        keys: parsed,
        plaintext: 'next',
      }).startsWith('v1:k2:')
    ).toBe(true)
  })
})
