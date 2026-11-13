import { db } from '@workspace/db/client'
import { users } from '@workspace/db/schema/auth'
import { workspaceInvitations } from '@workspace/db/schema/workspaces'
import { workspaceRoles } from '@workspace/db/workspace-roles'
import { APIError } from 'better-auth/api'
import { organization } from 'better-auth/plugins'
import { and, eq, lte } from 'drizzle-orm'

import { workspaceAccess, workspaceAccessRoles } from './access'
import { sendAuthEmail } from './email'
import { invitationEmail } from './invitations'
import { resolveAuthBaseURL } from './origins'

/** Maps Better Auth organizations onto the existing workspace tables. */
export function workspaceOrganization() {
  return organization({
    ac: workspaceAccess,
    roles: workspaceAccessRoles,
    invitationExpiresIn: 7 * 24 * 60 * 60,
    requireEmailVerificationOnInvitation: true,
    schema: {
      organization: {
        modelName: 'workspace',
        additionalFields: {
          createdByUserId: { type: 'string', required: false, input: false },
        },
      },
      member: {
        modelName: 'workspaceMember',
        fields: { organizationId: 'workspaceId' },
      },
      invitation: {
        modelName: 'workspaceInvitation',
        fields: { organizationId: 'workspaceId', inviterId: 'invitedByUserId' },
      },
    },
    organizationHooks: {
      beforeCreateOrganization: async function prepareWorkspace({
        organization,
        user,
      }) {
        assertWorkspaceName(organization.name)
        return { data: { ...organization, createdByUserId: user.id } }
      },
      afterCreateOrganization: async function activateCreatedWorkspace({
        organization,
        user,
      }) {
        await activateWorkspace(user.id, organization.id)
      },
      beforeUpdateOrganization: async function validateWorkspaceUpdate({
        organization,
      }) {
        if (organization.name !== undefined)
          assertWorkspaceName(organization.name)
      },
      beforeCreateInvitation: async function prepareInvitation({ invitation }) {
        const email = invitation.email.toLowerCase()
        assertWorkspaceRole(invitation.role)
        // Expired rows are retained as history without occupying the pending slot.
        await db
          .update(workspaceInvitations)
          .set({ status: 'canceled' })
          .where(
            and(
              eq(workspaceInvitations.workspaceId, invitation.organizationId),
              eq(workspaceInvitations.email, email),
              eq(workspaceInvitations.status, 'pending'),
              lte(workspaceInvitations.expiresAt, new Date())
            )
          )
        return { data: { ...invitation, email } }
      },
      beforeAddMember: async function validateMember({ member }) {
        assertWorkspaceRole(member.role)
      },
      beforeUpdateMemberRole: async function validateMemberRole({ newRole }) {
        assertWorkspaceRole(newRole)
      },
      afterAcceptInvitation: async function activateJoinedWorkspace({
        user,
        organization,
      }) {
        await activateWorkspace(user.id, organization.id)
      },
      afterRemoveMember: async function clearRemovedActiveWorkspace({
        user,
        organization,
      }) {
        await db
          .update(users)
          .set({ activeWorkspaceId: null, updatedAt: new Date() })
          .where(
            and(
              eq(users.id, user.id),
              eq(users.activeWorkspaceId, organization.id)
            )
          )
      },
    },
    sendInvitationEmail: async function sendWorkspaceInvitation({
      id,
      email,
      organization,
      inviter,
    }) {
      const baseURL = resolveAuthBaseURL(process.env)
      try {
        if (!baseURL) {
          throw new Error('BETTER_AUTH_URL is required to send invitations.')
        }
        await sendAuthEmail({
          ...invitationEmail({
            inviterName: inviter.user.name || inviter.user.email,
            url: new URL(`/invite/${id}`, baseURL).toString(),
            workspaceName: organization.name,
          }),
          to: email,
        })
      } catch (error) {
        // A retry must not be blocked by an invitation that was never delivered.
        await db
          .update(workspaceInvitations)
          .set({ status: 'canceled' })
          .where(
            and(
              eq(workspaceInvitations.id, id),
              eq(workspaceInvitations.status, 'pending')
            )
          )
        throw error
      }
    },
  })
}

/** Applies the workspace name limit to direct organization API calls too. */
function assertWorkspaceName(name: string | undefined): void {
  if (
    !name ||
    /[\r\n]/u.test(name) ||
    name.trim().length < 1 ||
    name.trim().length > 40
  ) {
    throw new APIError('BAD_REQUEST', {
      message: 'Use a name between 1 and 40 characters.',
    })
  }
}

/** Workspaces use one fixed role per member, including through direct API calls. */
function assertWorkspaceRole(role: string): void {
  if (!workspaceRoles.some((known) => known === role)) {
    throw new APIError('BAD_REQUEST', {
      message: 'Choose a valid workspace role.',
    })
  }
}

/** Preserves the user's workspace preference across sessions. */
async function activateWorkspace(
  userId: string,
  workspaceId: string
): Promise<void> {
  await db
    .update(users)
    .set({ activeWorkspaceId: workspaceId, updatedAt: new Date() })
    .where(eq(users.id, userId))
}
