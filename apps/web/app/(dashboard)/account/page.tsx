import {
  listPendingInvitations,
  listWorkspaceMembers,
  toWorkspaceRole,
} from '@workspace/db/queries/workspaces'
import type { Metadata } from 'next'

import { AccountBalances } from '@/components/account/account-balances'
import { AccountBuyingPower } from '@/components/account/account-buying-power'
import { AccountConnections } from '@/components/account/account-connections'
import { AccountHero } from '@/components/account/account-hero'
import { AccountHistory } from '@/components/account/account-history'
import { AccountLimits } from '@/components/account/account-limits'
import { AccountMargin } from '@/components/account/account-margin'
import { Appearance } from '@/components/account/appearance'
import { Funding } from '@/components/account/funding'
import { TradingSettings } from '@/components/account/trading-settings'
import { PageTabs } from '@/components/page-tabs'
import { WorkspaceSettings } from '@/components/workspace/workspace-settings'
import {
  type AccountSectionId,
  accountSections,
  defaultAccountSection,
  isAccountSectionId,
} from '@/lib/account/sections'
import { listWorkspaceHistory } from '@/lib/activity/feed'
import { requireSession } from '@/lib/auth/require-session'
import { listDepositMethods } from '@/lib/wallet/crypto-wallets'
import {
  canDeleteWorkspace,
  canLeaveWorkspace,
  canManageWorkspace,
  canTestConnection,
} from '@/lib/workspaces/permissions'
import { loadWorkspace } from '@/lib/workspaces/shell'
import type {
  PendingInvitation,
  WorkspaceMember,
} from '@/models/workspace/members'

interface PageProps {
  searchParams: Promise<{
    section?: string | string[]
  }>
}

export const metadata: Metadata = {
  title: 'Account',
}

/** Renders the account in tabs: balances, limits, trading, connections, workspace, history, funding and appearance. */
export default async function AccountPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const { active, connections, workspace } = await loadWorkspace(session.user)
  const canManage = canManageWorkspace(workspace.role)
  const [depositMethods, memberRows, invitationRows, history, params] =
    await Promise.all([
      listDepositMethods(session.user.id),
      listWorkspaceMembers(workspace.workspaceId),
      canManage ? listPendingInvitations(workspace.workspaceId) : [],
      listWorkspaceHistory(workspace.workspaceId),
      searchParams,
    ])
  const ready = active?.status === 'valid'
  // Without a valid connection nothing else can load, so lead with the fix.
  const urlDefault: AccountSectionId = ready
    ? defaultAccountSection
    : 'connections'
  const section = isAccountSectionId(params.section)
    ? params.section
    : urlDefault
  const members: WorkspaceMember[] = memberRows.map((member) => ({
    email: member.email,
    image: member.image,
    name: member.name,
    role: member.role,
    userId: member.userId,
  }))
  const invitations: PendingInvitation[] = invitationRows.map((invitation) => ({
    email: invitation.email,
    expiresAt: invitation.expiresAt.toISOString(),
    id: invitation.id,
    role: toWorkspaceRole(invitation.role),
  }))
  const ownerCount = members.filter((member) => member.role === 'owner').length
  const connectionsSection = (
    <AccountConnections
      activeConnectionId={active?.id ?? null}
      canManage={canManage}
      canTest={canTestConnection(workspace.role)}
      connections={connections}
      defaultConnectionId={workspace.defaultConnectionId}
      key={workspace.workspaceId}
      workspaceId={workspace.workspaceId}
    />
  )

  return (
    <div className="flex flex-1 flex-col gap-10 md:pl-24">
      <AccountHero
        connectionName={active?.name}
        environment={active?.environment ?? 'paper'}
        ready={ready}
        user={{
          email: session.user.email,
          image: session.user.image ?? null,
          name: session.user.name,
        }}
        workspaceName={workspace.workspaceName}
      />
      <PageTabs
        defaultValue={section}
        key={section}
        label="Account sections"
        panels={{
          appearance: <Appearance />,
          balances: (
            <div className="flex flex-col">
              <AccountBalances ready={ready} />
              <div className="grid grid-cols-1 xl:grid-cols-2 xl:gap-x-16">
                <AccountBuyingPower ready={ready} />
                <AccountMargin ready={ready} />
              </div>
            </div>
          ),
          connections: connectionsSection,
          funding: <Funding methods={depositMethods} />,
          history: (
            <AccountHistory
              currentUserId={session.user.id}
              entries={history}
              members={members}
            />
          ),
          limits: <AccountLimits ready={ready} />,
          trading: <TradingSettings ready={ready} />,
          workspace: (
            <WorkspaceSettings
              canDelete={
                workspace.memberships.length > 1 &&
                canDeleteWorkspace(workspace.role)
              }
              canLeave={
                workspace.memberships.length > 1 &&
                canLeaveWorkspace({ ownerCount, role: workspace.role })
              }
              canManage={canManage}
              currentUserId={session.user.id}
              invitations={invitations}
              members={members}
              name={workspace.workspaceName}
              role={workspace.role}
              workspaceId={workspace.workspaceId}
            />
          ),
        }}
        param="section"
        tabs={accountSections}
        urlDefault={urlDefault}
      />
    </div>
  )
}
