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
    let buffer = ''
    let settled = false

    function finish(error?: Error): void {
      if (settled) {
        return
      }

      settled = true
      socket.destroy()

      if (error) {
        reject(error)
        return
      }

      resolve()
    }

    socket.setTimeout(5_000)
    socket.on('timeout', function onTimeout() {
      finish(new Error('Email delivery timed out.'))
    })
    socket.on('error', function onError() {
      finish(new Error('Email delivery failed.'))
    })
    socket.on('close', function onClose() {
      if (!settled) {
        finish(new Error('Email delivery failed.'))
      }
    })
    socket.on('data', function onData(chunk: Buffer) {
      buffer += chunk.toString('utf8')

      while (true) {
        const lineEnd = buffer.indexOf('\n')

        if (lineEnd === -1) {
          return
        }

        const line = buffer.slice(0, lineEnd).replace(/\r$/u, '')
        buffer = buffer.slice(lineEnd + 1)
        const response = readSmtpResponse(line)

        if (!response) {
          continue
        }

        if (response.code >= 400) {
          finish(new Error('Email delivery failed.'))
          return
        }

        const command = commands[index]

        if (!command) {
          finish()
          return
        }

        index += 1
        socket.write(`${command}\r\n`)
      }
    })
  })
}

/** Returns a complete SMTP status line, ignoring multiline continuations. */
function readSmtpResponse(line: string): SmtpResponse | undefined {
  if (!/^\d{3}(?: |$)/u.test(line)) {
    return undefined
  }

  return { code: Number(line.slice(0, 3)) }
}

/** Reads the mailbox from either `name <addr>` or a bare address. */
function extractEmailAddress(value: string): string {
  const wrapped = value.match(/<([^>]+)>/u)

  return (wrapped?.[1] ?? value).trim()
}
