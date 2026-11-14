import { mock } from 'bun:test'

mock.module('server-only', () => ({}))

const {
  decryptCredential,
  decryptSecret,
  encryptCredential,
  encryptSecret,
  needsRewrap,
  parseEncryptionKeys,
} = await import('./secret-box')

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
      }).startsWith('v2:k2:')
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

  test('a credential moved to another workspace fails to decrypt', () => {
    const encryptionKeys = keys(['k1'])
    const binding = {
      connectionId: 'conn-1',
      environment: 'live',
      field: 'secret' as const,
      workspaceId: 'ws-victim',
    }
    const payload = encryptCredential({
      binding,
      keys: encryptionKeys,
      plaintext: 'alpaca-secret',
    })

    expect(payload.startsWith('v2:k1:')).toBe(true)
    expect(decryptCredential({ binding, keys: encryptionKeys, payload })).toBe(
      'alpaca-secret'
    )
    expect(() =>
      decryptCredential({
        binding: { ...binding, workspaceId: 'ws-attacker' },
        keys: encryptionKeys,
        payload,
      })
    ).toThrow('Unable to decrypt credential.')
    expect(() =>
      decryptCredential({
        binding: { ...binding, field: 'keyId' },
        keys: encryptionKeys,
        payload,
      })
    ).toThrow('Unable to decrypt credential.')
  })

  test('still reads a v1 credential and flags it for rewrap', () => {
    const encryptionKeys = keys(['k1'])
    const binding = {
      connectionId: 'conn-1',
      environment: 'paper',
      field: 'keyId' as const,
      workspaceId: 'ws-1',
    }
    // The historical v1 AAD, spelled out so a change to credentialAad shows up.
    const payload = encryptSecret({
      aad: `connection:${binding.connectionId}:${binding.environment}:${binding.field}`,
      keys: encryptionKeys,
      plaintext: 'PKLEGACY1234',
      version: 'v1',
    })

    expect(decryptCredential({ binding, keys: encryptionKeys, payload })).toBe(
      'PKLEGACY1234'
    )
    expect(needsRewrap({ keys: encryptionKeys, payload })).toBe(true)
    expect(
      needsRewrap({
        keys: encryptionKeys,
        payload: encryptCredential({
          binding,
          keys: encryptionKeys,
          plaintext: 'PKLEGACY1234',
        }),
      })
    ).toBe(false)
  })

  test('flags a credential encrypted with a retired key for rewrap', () => {
    const old = keys(['k1'])
    const binding = {
      connectionId: 'conn-1',
      environment: 'paper',
      field: 'secret' as const,
      workspaceId: 'ws-1',
    }
    const payload = encryptCredential({ binding, keys: old, plaintext: 's' })

    expect(needsRewrap({ keys: [...keys(['k2']), ...old], payload })).toBe(true)
  })

  test('rejects an unknown box version', () => {
    const encryptionKeys = keys(['k1'])
    const payload = encryptSecret({
      aad: 'a',
      keys: encryptionKeys,
      plaintext: 's',
    }).replace(/^v2:/u, 'v9:')

    expect(() =>
      decryptSecret({ aad: 'a', keys: encryptionKeys, payload })
    ).toThrow('Unable to decrypt credential.')
  })
})
