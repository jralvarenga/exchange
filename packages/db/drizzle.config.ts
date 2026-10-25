import { defineConfig } from 'drizzle-kit'

// `bun run` loads packages/db/.env. Fail instead of guessing a database.
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Set it in packages/db/.env.')
}

export default defineConfig({
  casing: 'snake_case',
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: 'postgresql',
  out: './src/migrations',
  schema: './src/schema',
})
