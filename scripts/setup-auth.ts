import { randomBytes } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { hash, truncates } from 'bcryptjs'

import { formatPasswordHashForDotenv } from './utils'

interface HiddenPromptOptions {
  output: HiddenOutput
  prompt: string
  readline: ReturnType<typeof createInterface>
}

const BCRYPT_COST = 12
const MINIMUM_PASSWORD_LENGTH = 12

/** Suppresses terminal echo while a secret is being entered. */
class HiddenOutput extends Writable {
  muted = false

  /** Writes readline output unless secret entry is active. */
  override _write(
    chunk: string | Buffer,
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    if (!this.muted) {
      process.stdout.write(chunk, encoding)
    }

    callback()
  }
}

/** Asks one question without echoing the answer to the terminal. */
async function askHidden(options: HiddenPromptOptions): Promise<string> {
  process.stdout.write(options.prompt)
  options.output.muted = true

  try {
    return await options.readline.question('')
  } finally {
    options.output.muted = false
    process.stdout.write('\n')
  }
}

/** Prompts until a strong password and matching confirmation are provided. */
async function choosePassword(
  readline: ReturnType<typeof createInterface>,
  output: HiddenOutput
): Promise<string> {
  while (true) {
    const password = await askHidden({
      output,
      prompt: 'Choose your dashboard password: ',
      readline,
    })

    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      console.error(
        `Use at least ${MINIMUM_PASSWORD_LENGTH} characters. Please try again.\n`
      )
      continue
    }

    if (truncates(password)) {
      console.error(
        'That password exceeds bcrypt’s 72-byte limit. Please try a shorter one.\n'
      )
      continue
    }

    const confirmation = await askHidden({
      output,
      prompt: 'Enter the same password again: ',
      readline,
    })

    if (password !== confirmation) {
      console.error('The passwords did not match. Please try again.\n')
      continue
    }

    return password
  }
}

/** Generates and prints the two environment values required by dashboard auth. */
async function main(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Run this command in an interactive terminal.')
  }

  const output = new HiddenOutput()
  const readline = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  })

  readline.on('SIGINT', () => {
    output.muted = false
    process.stdout.write('\nCancelled.\n')
    readline.close()
    process.exit(130)
  })

  try {
    console.log(
      'This creates the two secret environment values. Your password will stay hidden.\n'
    )
    const password = await choosePassword(readline, output)
    const passwordHash = await hash(password, BCRYPT_COST)
    const dotenvPasswordHash = formatPasswordHashForDotenv(passwordHash)
    const authSecret = randomBytes(48).toString('base64')

    console.log('\nCopy these two lines into apps/web/.env.local:\n')
    console.log(`DASHBOARD_PASSWORD_HASH=${dotenvPasswordHash}`)
    console.log(`AUTH_SECRET=${authSecret}`)
    console.log(
      '\nKeep the backslashes before each $; Next.js removes them when loading the file.'
    )
    console.log(
      'At login, use the original password you just entered—not either value above.'
    )
  } finally {
    readline.close()
  }
}

main().catch(function handleSetupError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error'

  console.error(`\nCould not generate auth values: ${message}`)
  process.exitCode = 1
})
