import { AppShell } from '@/components/app-shell'
import { CredentialsGate } from '@/components/credentials/credentials-gate'
import { requireSession } from '@/lib/auth/require-session'
import { loadWorkspace } from '@/lib/workspaces/shell'

interface Props {
  children: React.ReactNode
}

/** Requires a session and hides portfolio data until the active connection is valid. */
export default async function DashboardLayout({ children }: Props) {
  const session = await requireSession()
  const { active, shell } = await loadWorkspace(session.user)
  const environment = active?.environment ?? 'paper'

  return (
    <AppShell
      environment={environment}
      user={{
        email: session.user.email,
        image: session.user.image ?? null,
        name: session.user.name,
      }}
      workspace={shell}
    >
      <CredentialsGate
        active={active}
        canManage={shell.role === 'owner'}
        connectionVersion={`${shell.id}:${active?.id}:${active?.status}:${active?.lastVerifiedAt}`}
        connections={shell.connections}
        ready={active?.status === 'valid'}
      >
        {children}
      </CredentialsGate>
    </AppShell>
  )
}
