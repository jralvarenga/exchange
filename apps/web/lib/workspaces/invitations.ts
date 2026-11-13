import 'server-only'

import { createHash } from 'node:crypto'
import {
  findInvitationById,
  findInvitationByTokenHash,
} from '@workspace/db/queries/workspaces'

/** Hashes an invitation token for storage and lookup. */
export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Resolves Better Auth invitation IDs and links sent before the migration. */
export async function findInvitationByLink(
  token: string
): ReturnType<typeof findInvitationById> {
  return (
    (await findInvitationByTokenHash(hashInvitationToken(token))) ??
    findInvitationById(token)
  )
}
