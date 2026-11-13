import { organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { workspaceAccess, workspaceAccessRoles } from './access'

const organizationOptions = { ac: workspaceAccess, roles: workspaceAccessRoles }
type WorkspaceAuthClient = ReturnType<
  typeof createAuthClient<{
    plugins: [ReturnType<typeof organizationClient<typeof organizationOptions>>]
  }>
>

/** Browser client for authentication and workspace organization operations. */
export const authClient: WorkspaceAuthClient = createAuthClient({
  plugins: [organizationClient(organizationOptions)],
})
