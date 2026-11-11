import { AccountBalances } from '@/components/account/account-balances'
import { AccountBuyingPower } from '@/components/account/account-buying-power'
import { AccountHero } from '@/components/account/account-hero'
import { AccountKeys } from '@/components/account/account-keys'
import { AccountLimits } from '@/components/account/account-limits'
import { AccountMargin } from '@/components/account/account-margin'
import { AccountSectionNav } from '@/components/account/account-section-nav'
import { AccountSectionRedirect } from '@/components/account/account-section-redirect'
import { Appearance } from '@/components/account/appearance'
import { Funding } from '@/components/account/funding'
import { TradingSettings } from '@/components/account/trading-settings'
import {
  listMaskedCredentials,
  resolveActiveEnvironment,
} from '@/lib/alpaca/credentials'
import { requireSession } from '@/lib/auth/require-session'
import { listDepositMethods } from '@/lib/wallet/crypto-wallets'

interface PageProps {
  searchParams: Promise<{
    section?: string | string[]
  }>
}

/** Renders the account: balances, limits, trading settings, keys and funding. */
export default async function AccountPage({ searchParams }: PageProps) {
  const session = await requireSession()
  const [credentials, depositMethods, environment, params] = await Promise.all([
    listMaskedCredentials(session.user.id),
    listDepositMethods(session.user.id),
    resolveActiveEnvironment(session.user.id),
    searchParams,
  ])
  const section =
    typeof params.section === 'string' ? params.section : undefined
  const ready =
    credentials.find((credential) => credential.environment === environment)
      ?.status === 'valid'
  const keys = (
    <AccountKeys activeEnvironment={environment} credentials={credentials} />
  )

  return (
    <div className="flex flex-1 flex-col gap-10 md:pl-24">
      <AccountHero
        environment={environment}
        ready={ready}
        user={{ email: session.user.email, name: session.user.name }}
      />
      <AccountSectionRedirect section={section} />
      <AccountSectionNav />
      <div className="flex flex-col gap-14">
        {/* Without valid keys nothing else can load, so lead with the fix. */}
        {ready ? null : keys}
        <AccountBalances ready={ready} />
        <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
          <AccountBuyingPower ready={ready} />
          <AccountMargin ready={ready} />
        </div>
        <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
          <AccountLimits ready={ready} />
          <TradingSettings ready={ready} />
        </div>
        {ready ? keys : null}
        <Funding methods={depositMethods} />
        <Appearance />
      </div>
    </div>
  )
}
