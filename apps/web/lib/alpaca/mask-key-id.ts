/** Hides a key id as two leading characters, bullets, and the last four. */
export function maskKeyId(keyId: string): string {
  return `${keyId.slice(0, 2)}••••${keyId.slice(-4)}`
}
