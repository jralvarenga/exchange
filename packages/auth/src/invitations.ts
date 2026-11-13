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
