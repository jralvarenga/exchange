import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'drizzle-kit'

const configDirectory = dirname(fileURLToPath(import.meta.url))

/**
 * Reads DATABASE_URL from the process, packages/db/.env, or apps/web/.env.local.
 * Fail instead of guessing a database.
 */
function loadDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const files = [
    resolve(configDirectory, '.env'),
    resolve(configDirectory, '../../apps/web/.env.local'),
  ]

  for (const file of files) {
    const url = readDatabaseUrlFromFile(file)

    if (url) {
      return url
    }
  }

  throw new Error(
    'DATABASE_URL is required. Set it in the environment, packages/db/.env, or apps/web/.env.local.'
  )
}

/** Parses a KEY=VALUE env file and returns DATABASE_URL when present. */
function readDatabaseUrlFromFile(file: string): string | undefined {
  if (!existsSync(file)) {
    return undefined
  }

  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separator = trimmed.indexOf('=')

    if (separator <= 0) {
      continue
    }

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (key === 'DATABASE_URL' && value.length > 0) {
      return value
    }
  }

  return undefined
}

export default defineConfig({
  casing: 'snake_case',
  dbCredentials: {
    url: loadDatabaseUrl(),
  },
  dialect: 'postgresql',
  out: './src/migrations',
  schema: './src/schema',
})
