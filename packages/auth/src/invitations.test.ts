import { describe, expect, test } from 'bun:test'

import { invitationEmail } from './invitations'

describe('invitationEmail', () => {
  test('keeps CR/LF out of the SMTP subject', () => {
    const email = invitationEmail({
      inviterName: 'Ada',
      url: 'https://example.com/invite/token',
      workspaceName: 'Desk\r\nBcc: attacker@example.com',
    })

    expect(email.subject).toBe('Join Desk Bcc: attacker@example.com on Treid')
    expect(email.subject).not.toMatch(/[\r\n]/u)
  })
})
