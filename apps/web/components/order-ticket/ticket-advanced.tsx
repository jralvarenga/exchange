import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Label } from '@workspace/ui/components/label'

import { TicketField } from '@/components/order-ticket/ticket-field'
import { TicketPills } from '@/components/order-ticket/ticket-pills'
import { TicketSelect } from '@/components/order-ticket/ticket-select'
import {
  getAllowedOrderClasses,
  getAllowedTimesInForce,
  isFractionalQuantity,
} from '@/lib/alpaca/order-constraints'
import type { TicketDraft } from '@/models/order-ticket/ticket'

interface Props {
  draft: TicketDraft
  errors: Record<string, string>
  onChange: (patch: Partial<TicketDraft>) => void
}

const timeLabels = {
  day: 'Day · Until market close',
  gtc: 'Good until canceled',
  opg: 'At the open',
  cls: 'At the close',
  ioc: 'Immediate or cancel',
  fok: 'Fill or kill',
}
const classLabels = {
  simple: 'Simple',
  bracket: 'Bracket',
  oco: 'OCO',
  oto: 'OTO',
}
const classDescriptions = {
  simple: 'A single order, with no linked exits.',
  bracket:
    'An entry with a take-profit and stop-loss. When one exit fills, the other is canceled.',
  oco: 'Two linked exits for an existing position. When one fills, the other is canceled.',
  oto: 'An entry that activates one take-profit or stop-loss order after it fills.',
}

/** Reveals duration, session eligibility, and linked exits for the selected asset. */
export function TicketAdvanced({ draft, errors, onChange }: Props) {
  const times = getAllowedTimesInForce({
    ...draft,
    assetClass: draft.asset?.assetClass,
  })
  // A single allowed duration means the ticket replaced the user's choice.
  const onlyTime = times.length === 1 ? times[0] : undefined
  const classes = getAllowedOrderClasses(draft.asset?.assetClass)
  const advanced = draft.orderClass !== 'simple'
  const fractional = isFractionalQuantity(draft.amount, draft.quantityMode)
  const canExtend =
    draft.asset?.assetClass === 'us_equity' &&
    !advanced &&
    draft.type === 'limit' &&
    ['day', 'gtc'].includes(draft.timeInForce)
  return (
    <div className="flex flex-col gap-6 pt-5">
      <TicketSelect
        description={
          onlyTime
            ? `This order can only use ${timeLabels[onlyTime]}.`
            : undefined
        }
        name="timeInForce"
        error={errors.timeInForce}
        label="Time in force"
        onChange={(timeInForce) => onChange({ timeInForce })}
        options={times.map((value) => ({ label: timeLabels[value], value }))}
        value={draft.timeInForce}
      />
      {draft.asset?.assetClass === 'us_equity' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ticket-extended-hours" id="ticket-extended-label">
              Extended hours
            </Label>
            <Checkbox
              aria-describedby="ticket-extended-help"
              aria-labelledby="ticket-extended-label"
              checked={draft.extendedHours}
              data-order-field="extendedHours"
              disabled={!canExtend}
              id="ticket-extended-hours"
              onCheckedChange={(extendedHours) => onChange({ extendedHours })}
            />
          </div>
          <p className="text-muted-foreground" id="ticket-extended-help">
            {canExtend
              ? 'Allow this limit order to fill outside the regular session.'
              : 'Available for simple limit orders with Day or good until canceled.'}
          </p>
          {errors.extendedHours ? (
            <p className="text-destructive">{errors.extendedHours}</p>
          ) : null}
        </div>
      ) : null}
      {classes.length > 1 ? (
        <div className="flex flex-col gap-3 border-t pt-5">
          <fieldset
            className="flex flex-wrap gap-1"
            data-order-field="orderClass"
            disabled={fractional}
          >
            <legend className="mb-2 text-muted-foreground">
              Order strategy
            </legend>
            {classes.map((value) => (
              <Button
                aria-pressed={draft.orderClass === value}
                key={value}
                onClick={() => onChange({ orderClass: value })}
                type="button"
                variant={draft.orderClass === value ? 'secondary' : 'ghost'}
              >
                {classLabels[value]}
              </Button>
            ))}
          </fieldset>
          <p className="text-muted-foreground">
            {fractional
              ? 'Linked exits require a whole-share quantity.'
              : classDescriptions[draft.orderClass]}
          </p>
          {errors.orderClass ? (
            <p className="text-destructive">{errors.orderClass}</p>
          ) : null}
        </div>
      ) : null}
      {draft.orderClass === 'oto' ? (
        <TicketPills
          label="Activate after entry"
          onChange={(otoLeg) => onChange({ otoLeg })}
          options={[
            { label: 'Take profit', value: 'take_profit' },
            { label: 'Stop loss', value: 'stop_loss' },
          ]}
          value={draft.otoLeg}
        />
      ) : null}
      {advanced &&
      (draft.orderClass !== 'oto' || draft.otoLeg === 'take_profit') ? (
        <TicketField
          name="takeProfitLimitPrice"
          error={
            errors.takeProfitLimitPrice ??
            (draft.orderClass === 'oco' ? errors.limitPrice : undefined)
          }
          label="Take-profit price"
          onChange={(takeProfitLimitPrice) =>
            onChange({ takeProfitLimitPrice })
          }
          value={draft.takeProfitLimitPrice}
        />
      ) : null}
      {advanced &&
      (draft.orderClass !== 'oto' || draft.otoLeg === 'stop_loss') ? (
        <>
          <TicketField
            name="stopLossStopPrice"
            error={errors.stopLossStopPrice}
            label="Stop-loss price"
            onChange={(stopLossStopPrice) => onChange({ stopLossStopPrice })}
            value={draft.stopLossStopPrice}
          />
          <TicketField
            name="stopLossLimitPrice"
            error={errors.stopLossLimitPrice}
            label="Stop-loss limit price"
            onChange={(stopLossLimitPrice) => onChange({ stopLossLimitPrice })}
            optional
            value={draft.stopLossLimitPrice}
          />
        </>
      ) : null}
    </div>
  )
}
