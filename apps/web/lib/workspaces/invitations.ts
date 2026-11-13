import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

/** Invitations stop working after a week. */
export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000

/** Creates a random invitation token. Only its hash is stored. */
export function createInvitationToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Hashes an invitation token for storage and lookup. */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

interface InvitationEmailInput {
  inviterName: string
  url: string
  workspaceName: string
}

interface InvitationEmail {
  html: string
  subject: string
  text: string
}

/** Builds the invitation email. Every value is escaped before it reaches HTML. */
export function invitationEmail(input: InvitationEmailInput): InvitationEmail {
  const summary = `${input.inviterName} invited you to the ${input.workspaceName} workspace on Exchange.`

  return {
    html: `<p>${escapeHtml(summary)}</p><p><a href="${escapeHtml(input.url)}">Join the workspace</a></p><p>The link works for 7 days.</p>`,
    subject: `Join ${input.workspaceName} on Exchange`,
    text: `${summary}\nJoin the workspace: ${input.url}\nThe link works for 7 days.`,
  }
}

/** Escapes text placed in an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
