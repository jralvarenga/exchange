import { DepositAddressForm } from '@/components/account/deposit-address-form'
import { DepositPicker } from '@/components/account/deposit-picker'
import { FundingEmpty } from '@/components/account/funding-empty'
import { Section } from '@/components/section'
import { SectionHeader } from '@/components/section-header'
import {
  type DepositMethod,
  depositSlots,
  getDepositMethod,
} from '@/lib/wallet/deposit-addresses'

interface Props {
  methods: DepositMethod[]
}

/** Shows where to send stablecoins and lets the user manage those addresses. */
export function Funding({ methods }: Props) {
  return (
    <Section id="funding" titleId="funding-title">
      <SectionHeader id="funding-title" title="Funding">
        <p className="max-w-2xl text-muted-foreground">
          Fund the account by sending USDC or USDT to your Alpaca deposit
          addresses. This works even while your keys need fixing.
        </p>
      </SectionHeader>
      <div className="grid grid-cols-1 gap-14 xl:grid-cols-2 xl:gap-16">
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-xl tracking-tight">Deposit</h3>
          {methods.length === 0 ? (
            <FundingEmpty />
          ) : (
            <DepositPicker methods={methods} />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-xl tracking-tight">
              Deposit addresses
            </h3>
            <p className="text-muted-foreground">
              Copy each one from Alpaca&apos;s crypto deposit screen.
              Double-check the network: funds sent on the wrong one may be lost.
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-border border-border border-y">
            {depositSlots.map((slot) => (
              <DepositAddressForm
                address={getDepositMethod({ ...slot, methods })?.address}
                key={`${slot.chain}:${slot.asset}`}
                slot={slot}
              />
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
