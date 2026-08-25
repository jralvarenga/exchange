'use client'

import { Button } from '@workspace/ui/components/button'
import { Field, FieldGroup, FieldLabel } from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { DollarSignIcon, HashIcon } from 'lucide-react'
import { Suspense, useState } from 'react'

import { AssetSearchCombobox } from '@/components/buy/asset-search-combobox'
import { BuyingPower } from '@/components/buy/buying-power'
import {
  type AlpacaOrderType,
  type AlpacaQuantityMode,
  type AlpacaTimeInForce,
  alpacaOrderTypeSchema,
  alpacaQuantityModeSchema,
  alpacaTimeInForceSchema,
} from '@/lib/alpaca/schemas'

interface SelectOption<Value extends string> {
  description: string
  label: string
  value: Value
}

const orderTypes: Array<SelectOption<AlpacaOrderType>> = [
  { description: 'Best available price', label: 'Market', value: 'market' },
  { description: 'At your price or better', label: 'Limit', value: 'limit' },
  { description: 'Triggers a market order', label: 'Stop', value: 'stop' },
  {
    description: 'Triggers a limit order',
    label: 'Stop limit',
    value: 'stop_limit',
  },
  {
    description: 'Follows the market by a trail',
    label: 'Trailing stop',
    value: 'trailing_stop',
  },
]

const timesInForce: Array<SelectOption<AlpacaTimeInForce>> = [
  { description: 'Expires after today’s session', label: 'Day', value: 'day' },
  { description: 'Open until canceled', label: 'GTC', value: 'gtc' },
  { description: 'Opening auction only', label: 'OPG', value: 'opg' },
  { description: 'Closing auction only', label: 'CLS', value: 'cls' },
  { description: 'Fill now; cancel the rest', label: 'IOC', value: 'ioc' },
  { description: 'Fill completely now or cancel', label: 'FOK', value: 'fok' },
]

/** Displays the controls and account summary for composing an Alpaca order. */
export function BuyOrderForm() {
  const [quantityMode, setQuantityMode] =
    useState<AlpacaQuantityMode>('notional')
  const [orderType, setOrderType] = useState<AlpacaOrderType>('market')
  const [timeInForce, setTimeInForce] = useState<AlpacaTimeInForce>('day')
  const selectedTimeInForce = timesInForce.find(
    (option) => option.value === timeInForce
  )

  return (
    <form className="flex flex-col gap-6">
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel className="font-bold text-base" htmlFor="asset-symbol">
            Asset
          </FieldLabel>
          <AssetSearchCombobox />
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-4">
            <FieldLabel
              className="font-bold text-base"
              htmlFor="order-quantity"
            >
              {quantityMode === 'qty' ? 'Quantity' : 'Amount'}
            </FieldLabel>
            <fieldset
              aria-label="Quantity unit"
              className="flex rounded-2xl bg-muted p-1"
            >
              <Button
                aria-label="Enter a number of shares"
                aria-pressed={quantityMode === 'qty'}
                className="size-7 rounded-xl"
                onClick={() =>
                  setQuantityMode(alpacaQuantityModeSchema.parse('qty'))
                }
                size="icon"
                type="button"
                variant={quantityMode === 'qty' ? 'default' : 'ghost'}
              >
                <HashIcon aria-hidden="true" />
              </Button>
              <Button
                aria-label="Enter a dollar amount"
                aria-pressed={quantityMode === 'notional'}
                className="size-7 rounded-xl"
                onClick={() =>
                  setQuantityMode(alpacaQuantityModeSchema.parse('notional'))
                }
                size="icon"
                type="button"
                variant={quantityMode === 'notional' ? 'default' : 'ghost'}
              >
                <DollarSignIcon aria-hidden="true" />
              </Button>
            </fieldset>
          </div>
          <Input
            className="px-4"
            defaultValue="1"
            id="order-quantity"
            inputMode="decimal"
            placeholder={
              quantityMode === 'qty' ? 'Enter quantity' : 'Enter amount'
            }
            min="0"
            name={quantityMode}
            step="any"
            type="number"
          />
        </Field>

        <Field>
          <FieldLabel className="font-bold text-base" htmlFor="order-type">
            Order type
          </FieldLabel>
          <Select
            items={orderTypes}
            onValueChange={(value) =>
              setOrderType(alpacaOrderTypeSchema.parse(value))
            }
            value={orderType}
          >
            <SelectTrigger className="h-12 w-full px-4" id="order-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {orderTypes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-muted-foreground text-xs">
                      {option.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel className="font-bold text-base" htmlFor="time-in-force">
            Time in force
          </FieldLabel>
          <Select
            items={timesInForce}
            onValueChange={(value) =>
              setTimeInForce(alpacaTimeInForceSchema.parse(value))
            }
            value={timeInForce}
          >
            <SelectTrigger className="h-12 w-full px-4" id="time-in-force">
              <SelectValue className="flex-none font-bold uppercase" />
              <span className="hidden min-w-0 flex-1 truncate text-left text-muted-foreground sm:block">
                {selectedTimeInForce?.description}
              </span>
            </SelectTrigger>
            <SelectContent align="start">
              {timesInForce.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex flex-col">
                    <span className="font-medium uppercase">
                      {option.label}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {option.description}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>

      <dl className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 font-bold text-base">
          <dt>Estimated cost</dt>
          <dd className="font-mono tabular-nums">—</dd>
        </div>
        <div className="flex items-center justify-between gap-4 text-muted-foreground">
          <dt>Buying power</dt>
          <dd className="text-foreground">
            <Suspense
              fallback={
                <span className="font-mono tabular-nums" role="status">
                  —<span className="sr-only">Loading buying power</span>
                </span>
              }
            >
              <BuyingPower />
            </Suspense>
          </dd>
        </div>
      </dl>

      <div className="grid grid-cols-2 gap-3">
        <Button className="h-12 text-base" disabled type="button">
          Buy
        </Button>
        <Button
          className="h-12 text-base"
          disabled
          type="button"
          variant="outline"
        >
          Sell
        </Button>
      </div>
    </form>
  )
}
