import {
  listPendingInvitations,
  listWorkspaceMembers,
} from '@workspace/db/queries/workspaces'

import { AccountBalances } from '@/components/account/account-balances'
import { AccountBuyingPower } from '@/components/account/account-buying-power'
import { AccountConnections } from '@/components/account/account-connections'
import { AccountHero } from '@/components/account/account-hero'
import { AccountHistory } from '@/components/account/account-history'
import { AccountLimits } from '@/components/account/account-limits'
import { AccountMargin } from '@/components/account/account-margin'
import { AccountSectionNav } from '@/components/account/account-section-nav'
import { AccountSectionRedirect } from '@/components/account/account-section-redirect'
import { Appearance } from '@/components/account/appearance'
import { Funding } from '@/components/account/funding'
import { TradingSettings } from '@/components/account/trading-settings'
import { WorkspaceSettings } from '@/components/workspace/workspace-settings'
import { listWorkspaceHistory } from '@/lib/activity/feed'
import { requireSession } from '@/lib/auth/require-session'
import { listDepositMethods } from '@/lib/wallet/crypto-wallets'
import {
  canLeaveWorkspace,
  canManageWorkspace,
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

/** Renders the account: balances, limits, trading, connections, workspace, history and funding. */
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
  const section =
    typeof params.section === 'string' ? params.section : undefined
  const ready = active?.status === 'valid'
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
    role: invitation.role === 'owner' ? 'owner' : 'member',
  }))
  const ownerCount = members.filter((member) => member.role === 'owner').length
  const connectionsSection = (
    <AccountConnections
      activeConnectionId={active?.id ?? null}
      canManage={canManage}
      connections={connections}
      defaultConnectionId={workspace.defaultConnectionId}
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
      <AccountSectionRedirect section={section} />
      <AccountSectionNav />
      <div className="flex flex-col gap-14">
        {/* Without a valid connection nothing else can load, so lead with the fix. */}
        {ready ? null : connectionsSection}
        <AccountBalances ready={ready} />
        <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
          <AccountBuyingPower ready={ready} />
          <AccountMargin ready={ready} />
        </div>
        <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
          <AccountLimits ready={ready} />
          <TradingSettings ready={ready} />
        </div>
        {ready ? connectionsSection : null}
        <WorkspaceSettings
          canLeave={
            workspace.memberships.length > 1 &&
            canLeaveWorkspace({ ownerCount, role: workspace.role })
          }
          canManage={canManage}
          currentUserId={session.user.id}
          invitations={invitations}
          members={members}
          name={workspace.workspaceName}
          workspaceId={workspace.workspaceId}
        />
        <AccountHistory
          currentUserId={session.user.id}
          entries={history}
          members={members}
        />
        <Funding methods={depositMethods} />
        <Appearance />
      </div>
    </div>
  )
}
