import { FundsWalletCard } from '@/components/wallet/funds-wallet-card'
import { FundsWalletEmpty } from '@/components/wallet/funds-wallet-empty'
import { getConfiguredDepositMethods } from '@/lib/wallet/deposit-addresses'

/** Renders deposit options for every chain and asset configured in the environment. */
export default function FundsWalletPage() {
  const methods = getConfiguredDepositMethods()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {methods.length === 0 ? (
        <FundsWalletEmpty />
      ) : (
        <FundsWalletCard methods={methods} />
      )}
    </div>
  )
}
