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

  test('round-trips empty plaintext', () => {
    const encryptionKeys = keys(['k1'])
    const payload = encryptSecret({
      aad: 'user-1:paper:secret',
      keys: encryptionKeys,
      plaintext: '',
    })

    expect(
      decryptSecret({
        aad: 'user-1:paper:secret',
        keys: encryptionKeys,
        payload,
      })
    ).toBe('')
  })

  test('rejects a truncated authentication tag', () => {
    const encryptionKeys = keys(['k1'])
    const payload = encryptSecret({
      aad: 'user-1:paper:secret',
      keys: encryptionKeys,
      plaintext: 'alpaca-secret',
    })
    const parts = payload.split(':')
    parts[3] = Buffer.from('short').toString('base64url')

    expect(() =>
      decryptSecret({
        aad: 'user-1:paper:secret',
        keys: encryptionKeys,
        payload: parts.join(':'),
      })
    ).toThrow('Unable to decrypt credential.')
  })

  test('rejects duplicate encryption key ids', () => {
    const original = keys(['k1'])
    const duplicate = keys(['k1'])

    expect(() =>
      parseEncryptionKeys(
        [...duplicate, ...original]
          .map((key) => `${key.id}:${key.key.toString('base64url')}`)
          .join(',')
      )
    ).toThrow('CREDENTIALS_ENCRYPTION_KEYS contains duplicate key ids.')
  })

  test('rejects a key with invalid base64 characters', () => {
    expect(() => parseEncryptionKeys('k1:not-valid-base64!!!!')).toThrow(
      'CREDENTIALS_ENCRYPTION_KEYS entry is invalid.'
    )
  })
})
