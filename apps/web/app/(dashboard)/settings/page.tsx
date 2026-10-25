import { DepositAddressesPanel } from '@/components/settings/deposit-addresses-panel'
import { SettingsPanel } from '@/components/settings/settings-panel'
import {
  listMaskedCredentials,
  resolveActiveEnvironment,
} from '@/lib/alpaca/credentials'
import { requireSession } from '@/lib/auth/require-session'
import { listDepositMethods } from '@/lib/wallet/crypto-wallets'

/** Renders the signed-in user's Alpaca keys and deposit wallet settings. */
export default async function SettingsPage() {
  const session = await requireSession()
  const [credentials, depositMethods] = await Promise.all([
    listMaskedCredentials(session.user.id),
    listDepositMethods(session.user.id),
  ])
  const activeEnvironment = await resolveActiveEnvironment(session.user.id)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
      <h1 className="font-bold text-xl">Settings</h1>
      <section
        aria-labelledby="alpaca-keys-title"
        className="flex flex-col gap-4"
      >
        <h2 id="alpaca-keys-title" className="font-bold text-lg">
          Alpaca keys
        </h2>
        <SettingsPanel
          activeEnvironment={activeEnvironment}
          credentials={credentials}
        />
      </section>
      <section
        aria-labelledby="deposit-wallets-title"
        className="flex flex-col gap-4"
      >
        <h2 id="deposit-wallets-title" className="sr-only">
          Deposit wallets
        </h2>
        <DepositAddressesPanel methods={depositMethods} />
      </section>
    </div>
  )
}
