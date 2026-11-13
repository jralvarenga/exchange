/** A workspace member as the account page shows them. */
export type WorkspaceMember = {
  email: string
  image: string | null
  name: string
  role: 'member' | 'owner'
  userId: string
}

/** An invitation that was sent and not accepted yet. */
export type PendingInvitation = {
  email: string
  expiresAt: string
  id: string
  role: 'member' | 'owner'
}
