import { connect } from 'node:net'
import { Resend } from 'resend'

interface AuthEmail {
  html: string
  subject: string
  text: string
  to: string
}

interface SmtpResponse {
  code: number
}

const MAILPIT_HOST = '127.0.0.1'
const MAILPIT_PORT = 1025

/**
 * Sends a verification or password-reset email.
 * Development delivers through Mailpit SMTP. Production uses Resend.
 */
export async function sendAuthEmail(email: AuthEmail): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    await sendWithResend(email)
    return
  }

  await sendWithMailpit(email)
}

/** Sends one authentication email through Resend. */
async function sendWithResend(email: AuthEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('Email delivery is not configured.')
  }

  const resend = new Resend(apiKey)
  const result = await resend.emails.send({
    from,
    html: email.html,
    subject: email.subject,
    text: email.text,
    to: email.to,
  })

  if (result.error) {
    throw new Error('Email delivery failed.')
  }
}

/** Sends one authentication email to the local Mailpit SMTP server. */
async function sendWithMailpit(email: AuthEmail): Promise<void> {
  const from = process.env.EMAIL_FROM

  if (!from) {
    throw new Error('Email delivery is not configured.')
  }

  const payload = [
    `From: ${from}`,
    `To: ${email.to}`,
    `Subject: ${email.subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    email.html,
  ].join('\r\n')

  await smtpSend({
    data: payload,
    from: extractEmailAddress(from),
    host: MAILPIT_HOST,
    port: MAILPIT_PORT,
    to: email.to,
  })
}

interface SmtpSendInput {
  data: string
  from: string
  host: string
  port: number
  to: string
}

/** Speaks a short unauthenticated SMTP session, which is all Mailpit requires. */
function smtpSend(input: SmtpSendInput): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = connect(input.port, input.host)
    const commands = [
      `EHLO localhost`,
      `MAIL FROM:<${input.from}>`,
      `RCPT TO:<${input.to}>`,
      'DATA',
      `${input.data}\r\n.`,
      'QUIT',
    ]
    let index = 0

    socket.setTimeout(5_000)
    socket.on('timeout', function onTimeout() {
      socket.destroy()
      reject(new Error('Email delivery timed out.'))
    })
    socket.on('error', function onError() {
      reject(new Error('Email delivery failed.'))
    })
    socket.on('data', function onData(chunk: Buffer) {
      const response = readSmtpResponse(chunk.toString('utf8'))

      if (!response) {
        return
      }

      if (response.code >= 400) {
        socket.destroy()
        reject(new Error('Email delivery failed.'))
        return
      }

      const command = commands[index]

      if (!command) {
        socket.end()
        resolve()
        return
      }

      index += 1
      socket.write(`${command}\r\n`)
    })
  })
}

/** Returns the first complete SMTP status line in a server chunk. */
function readSmtpResponse(value: string): SmtpResponse | undefined {
  const line = value.split(/\r?\n/u).find((entry) => /^\d{3} /u.test(entry))

  if (!line) {
    return undefined
  }

  return { code: Number(line.slice(0, 3)) }
}

/** Reads the mailbox from either `name <addr>` or a bare address. */
function extractEmailAddress(value: string): string {
  const wrapped = value.match(/<([^>]+)>/u)

  return (wrapped?.[1] ?? value).trim()
}
