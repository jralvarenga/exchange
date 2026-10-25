import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'

import { DepositAddressRow } from '@/components/settings/deposit-address-row'
import {
  type DepositMethod,
  depositSlots,
  getDepositMethod,
} from '@/lib/wallet/deposit-addresses'

interface Props {
  methods: DepositMethod[]
}

/** Lets the user add the deposit addresses shown on Funds & Wallet. */
export function DepositAddressesPanel({ methods }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit wallets</CardTitle>
        <CardDescription>
          Copy each address from your Alpaca account&apos;s crypto deposit
          screen. Double-check the network: funds sent on the wrong one may be
          lost.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {depositSlots.map((slot) => (
          <DepositAddressRow
            key={`${slot.chain}:${slot.asset}`}
            address={getDepositMethod({ ...slot, methods })?.address}
            slot={slot}
          />
        ))}
      </CardContent>
    </Card>
  )
}
