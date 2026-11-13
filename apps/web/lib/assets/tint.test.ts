import { describe, expect, test } from 'bun:test'

import { getAssetLogoSymbol } from '@/lib/assets/logo'
import { pickTint } from '@/lib/assets/tint'

/** Builds RGBA pixel data from a list of `[r, g, b, a]` pixels. */
function pixels(values: number[][]): Uint8ClampedArray {
  return new Uint8ClampedArray(values.flat())
}

describe('asset tint', () => {
  test('averages vivid pixels and ignores white, grey, and transparent ones', () => {
    expect(
      pickTint(
        pixels([
          [0, 100, 255, 255],
          [255, 255, 255, 255],
          [128, 128, 128, 255],
          [255, 0, 0, 0],
        ])
      )
    ).toBe('rgb(0 100 255)')
  })

  test('returns null for a logo without color', () => {
    expect(
      pickTint(
        pixels([
          [0, 0, 0, 255],
          [240, 240, 240, 255],
        ])
      )
    ).toBeNull()
  })

  test('files crypto logos under the base currency', () => {
    expect(
      getAssetLogoSymbol({ assetClass: 'crypto', symbol: 'BTC/USD' })
    ).toBe('BTC')
    expect(
      getAssetLogoSymbol({ assetClass: 'us_equity', symbol: 'META' })
    ).toBe('META')
  })
})
