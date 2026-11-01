import { AppShell } from '@/components/app-shell'
import { CredentialsGate } from '@/components/credentials/credentials-gate'
import {
  listMaskedCredentials,
  resolveActiveEnvironment,
} from '@/lib/alpaca/credentials'
import { requireSession } from '@/lib/auth/require-session'

interface Props {
  children: React.ReactNode
}

/** Requires a session and hides portfolio data until Alpaca keys are valid. */
export default async function DashboardLayout({ children }: Props) {
  const session = await requireSession()
  const credentials = await listMaskedCredentials(session.user.id)
  const environment = await resolveActiveEnvironment(session.user.id)
  const active = credentials.find(
    (credential) => credential.environment === environment
  )
  const ready = active?.status === 'valid'

  return (
    <AppShell user={{ email: session.user.email, name: session.user.name }}>
      <CredentialsGate
        credentialVersion={`${environment}:${active?.status}:${active?.lastVerifiedAt}`}
        environment={environment}
        hasCredential={Boolean(active)}
        ready={ready}
      >
        {children}
      </CredentialsGate>
    </AppShell>
  )
}
