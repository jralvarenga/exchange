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
  const workspaceName = headerSafe(input.workspaceName)
  const inviterName = headerSafe(input.inviterName)
  const summary = `${inviterName} invited you to the ${workspaceName} workspace on Treid.`

  return {
    html: `<p>${escapeHtml(summary)}</p><p><a href="${escapeHtml(input.url)}">Join the workspace</a></p><p>The link works for 7 days.</p>`,
    subject: `Join ${workspaceName} on Treid`,
    text: `${summary}\nJoin the workspace: ${input.url}\nThe link works for 7 days.`,
  }
}

/** Strips CR/LF so a workspace name cannot split an SMTP header. */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/gu, ' ').trim()
}

/** Escapes text placed in an HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
