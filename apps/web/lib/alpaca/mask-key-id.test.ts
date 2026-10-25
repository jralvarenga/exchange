import { describe, expect, test } from 'bun:test'

import { maskKeyId } from '@/lib/alpaca/mask-key-id'

describe('maskKeyId', () => {
  test('keeps two leading characters and the last four', () => {
    expect(maskKeyId('PKTESTAB12')).toBe('PK••••AB12')
  })
})
