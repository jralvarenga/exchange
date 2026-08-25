import { BalanceDetails } from '@/components/balance/balance-details'

/** Displays the account balance and available chart intervals. */
export function BalanceCard() {
  return (
    <div className="flex h-80 w-full flex-col rounded-3xl bg-primary p-5 text-primary-foreground shadow-lg">
      <div className="flex-1" />
      <BalanceDetails />
    </div>
  )
}
