import { FundsWalletCard } from '@/components/wallet/funds-wallet-card'
import { FundsWalletEmpty } from '@/components/wallet/funds-wallet-empty'
import { requireSession } from '@/lib/auth/require-session'
import { listDepositMethods } from '@/lib/wallet/crypto-wallets'

/** Renders the signed-in user's own Alpaca crypto deposit addresses. */
export default async function FundsWalletPage() {
  const session = await requireSession()
  const methods = await listDepositMethods(session.user.id)

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
