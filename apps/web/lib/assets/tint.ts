/** Pixels must be at least this opaque to count toward the tint. */
const minimumAlpha = 128
/** Greys, whites, and near-blacks fall under these limits and are skipped. */
const minimumSaturation = 0.25
const minimumBrightness = 0.2

/**
 * Returns the dominant vivid color of RGBA pixel data as `rgb(r g b)`,
 * averaging pixels weighted by saturation. Returns null for a grey or empty logo.
 */
export function pickTint(pixels: Uint8ClampedArray): string | null {
  let red = 0
  let green = 0
  let blue = 0
  let weight = 0

  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const r = pixels[index] ?? 0
    const g = pixels[index + 1] ?? 0
    const b = pixels[index + 2] ?? 0
    const alpha = pixels[index + 3] ?? 0
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const saturation = max === 0 ? 0 : (max - min) / max

    if (
      alpha < minimumAlpha ||
      saturation < minimumSaturation ||
      max / 255 < minimumBrightness
    ) {
      continue
    }

    red += r * saturation
    green += g * saturation
    blue += b * saturation
    weight += saturation
  }

  if (weight === 0) {
    return null
  }

  return `rgb(${Math.round(red / weight)} ${Math.round(green / weight)} ${Math.round(blue / weight)})`
}
