import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { config as dotenvConfig } from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { hash } from 'bcryptjs'

import { formatPasswordHashForDotenv } from './utils'

let tempDir: string
const ORIGINAL_ENV = process.env.DASHBOARD_PASSWORD_HASH

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'env-roundtrip-'))
})

afterEach(() => {
  process.env.DASHBOARD_PASSWORD_HASH = ORIGINAL_ENV
  rmSync(tempDir, { recursive: true, force: true })
})

describe('Next.js env loader round-trip', () => {
  test('unescapes escaped bcrypt hash from .env.local', async () => {
    const originalHash = await hash('correct horse battery', 12)
    const escaped = formatPasswordHashForDotenv(originalHash)
    const envPath = join(tempDir, '.env.local')

    writeFileSync(envPath, `DASHBOARD_PASSWORD_HASH=${escaped}\n`, 'utf8')

    // Simulate Next.js loading env files (dev mode loads .env.local)
    // Load using the same parsing/expansion rules Next.js uses
    const parsed = dotenvConfig({ path: envPath, override: true })
    dotenvExpand.expand(parsed)

    expect(process.env.DASHBOARD_PASSWORD_HASH).toBe(originalHash)
  })
})

