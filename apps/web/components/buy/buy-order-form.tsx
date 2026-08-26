'use client'

import { useForm } from '@tanstack/react-form'
import { Button } from '@workspace/ui/components/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@workspace/ui/components/field'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { DollarSignIcon, HashIcon, LoaderCircleIcon } from 'lucide-react'
import { Suspense } from 'react'

import { AssetSearchCombobox } from '@/components/buy/asset-search-combobox'
import { BuyingPower } from '@/components/buy/buying-power'
import { useCreateOrder } from '@/hooks/use-create-order'
import {
  type AlpacaOrderSide,
  type AlpacaOrderType,
  type AlpacaTimeInForce,
  type CreateOrderRequest,
  createOrderRequestSchema,
  type Order,
  type OrderFormValues,
  orderFormValuesSchema,
} from '@/lib/alpaca/schemas'

interface Props {
  onOrderSubmitted: (order: Order) => void
}

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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  style: 'currency',
})

const defaultValues: OrderFormValues = {
  amount: '1',
  asset: null,
  limitPrice: '',
  quantityMode: 'notional',
  stopPrice: '',
  timeInForce: 'day',
  trailPercent: '',
  type: 'market',
}

/** Displays a validated order ticket and submits buy or sell orders to Alpaca. */
export function BuyOrderForm({ onOrderSubmitted }: Props) {
  const createOrder = useCreateOrder()
  const form = useForm({
    defaultValues,
    onSubmit: async ({ meta, value }) => {
      const values = orderFormValuesSchema.parse(value)
      const order = createOrderRequest(values, meta.side)

      if (!order) {
        return
      }

      try {
        const submittedOrder = await createOrder.mutateAsync(order)

        onOrderSubmitted(submittedOrder)
      } catch {
        // React Query retains the actionable error for the inline status below.
      }
    },
    onSubmitMeta: { side: 'buy' as AlpacaOrderSide },
    validators: {
      onSubmit: orderFormValuesSchema,
    },
  })

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit({ side: 'buy' })
      }}
    >
      <FieldGroup className="gap-5">
        <form.Field name="asset">
          {(field) => (
            <Field data-invalid={!field.state.meta.isValid}>
              <FieldLabel
                className="font-bold text-base"
                htmlFor="asset-symbol"
              >
                Asset
              </FieldLabel>
              <AssetSearchCombobox
                onValueChange={(asset) => {
                  field.handleChange(asset)
                  createOrder.reset()

                  if (asset?.assetClass === 'crypto') {
                    if (
                      !['gtc', 'ioc'].includes(form.state.values.timeInForce)
                    ) {
                      form.setFieldValue('timeInForce', 'gtc')
                    }

                    if (
                      !['market', 'limit', 'stop_limit'].includes(
                        form.state.values.type
                      )
                    ) {
                      form.setFieldValue('type', 'market')
                    }
                  }
                }}
                value={field.state.value}
              />
              <FieldError errors={getFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.quantityMode}>
          {(quantityMode) => (
            <form.Field name="amount">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
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
                          form.setFieldValue('quantityMode', 'qty')
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
                          form.setFieldValue('quantityMode', 'notional')
                        }
                        size="icon"
                        type="button"
                        variant={
                          quantityMode === 'notional' ? 'default' : 'ghost'
                        }
                      >
                        <DollarSignIcon aria-hidden="true" />
                      </Button>
                    </fieldset>
                  </div>
                  <Input
                    aria-invalid={!field.state.meta.isValid}
                    className="px-4"
                    id="order-quantity"
                    inputMode="decimal"
                    min="0"
                    name={quantityMode}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder={
                      quantityMode === 'qty' ? 'Enter quantity' : 'Enter amount'
                    }
                    step="any"
                    type="number"
                    value={field.state.value}
                  />
                  <FieldError
                    errors={getFieldErrors(field.state.meta.errors)}
                  />
                </Field>
              )}
            </form.Field>
          )}
        </form.Subscribe>

        <form.Field name="type">
          {(field) => (
            <Field data-invalid={!field.state.meta.isValid}>
              <FieldLabel className="font-bold text-base" htmlFor="order-type">
                Order type
              </FieldLabel>
              <Select
                items={orderTypes}
                onValueChange={(value) =>
                  field.handleChange(value as AlpacaOrderType)
                }
                value={field.state.value}
              >
                <SelectTrigger
                  aria-invalid={!field.state.meta.isValid}
                  className="h-12 w-full px-4"
                  id="order-type"
                >
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
              <FieldError errors={getFieldErrors(field.state.meta.errors)} />
            </Field>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => state.values.type}>
          {(orderType) => (
            <>
              {orderType === 'limit' || orderType === 'stop_limit' ? (
                <form.Field name="limitPrice">
                  {(field) => (
                    <Field data-invalid={!field.state.meta.isValid}>
                      <FieldLabel
                        className="font-bold text-base"
                        htmlFor="limit-price"
                      >
                        Limit price
                      </FieldLabel>
                      <Input
                        aria-invalid={!field.state.meta.isValid}
                        className="px-4"
                        id="limit-price"
                        inputMode="decimal"
                        min="0"
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Enter limit price"
                        step="any"
                        type="number"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={getFieldErrors(field.state.meta.errors)}
                      />
                    </Field>
                  )}
                </form.Field>
              ) : null}

              {orderType === 'stop' || orderType === 'stop_limit' ? (
                <form.Field name="stopPrice">
                  {(field) => (
                    <Field data-invalid={!field.state.meta.isValid}>
                      <FieldLabel
                        className="font-bold text-base"
                        htmlFor="stop-price"
                      >
                        Stop price
                      </FieldLabel>
                      <Input
                        aria-invalid={!field.state.meta.isValid}
                        className="px-4"
                        id="stop-price"
                        inputMode="decimal"
                        min="0"
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Enter stop price"
                        step="any"
                        type="number"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={getFieldErrors(field.state.meta.errors)}
                      />
                    </Field>
                  )}
                </form.Field>
              ) : null}

              {orderType === 'trailing_stop' ? (
                <form.Field name="trailPercent">
                  {(field) => (
                    <Field data-invalid={!field.state.meta.isValid}>
                      <FieldLabel
                        className="font-bold text-base"
                        htmlFor="trail-percent"
                      >
                        Trail percent
                      </FieldLabel>
                      <Input
                        aria-invalid={!field.state.meta.isValid}
                        className="px-4"
                        id="trail-percent"
                        inputMode="decimal"
                        min="0"
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        placeholder="Enter trailing percentage"
                        step="any"
                        type="number"
                        value={field.state.value}
                      />
                      <FieldError
                        errors={getFieldErrors(field.state.meta.errors)}
                      />
                    </Field>
                  )}
                </form.Field>
              ) : null}
            </>
          )}
        </form.Subscribe>

        <form.Field name="timeInForce">
          {(field) => {
            const selectedTimeInForce = timesInForce.find(
              (option) => option.value === field.state.value
            )

            return (
              <Field data-invalid={!field.state.meta.isValid}>
                <FieldLabel
                  className="font-bold text-base"
                  htmlFor="time-in-force"
                >
                  Time in force
                </FieldLabel>
                <Select
                  items={timesInForce}
                  onValueChange={(value) =>
                    field.handleChange(value as AlpacaTimeInForce)
                  }
                  value={field.state.value}
                >
                  <SelectTrigger
                    aria-invalid={!field.state.meta.isValid}
                    className="h-12 w-full px-4"
                    id="time-in-force"
                  >
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
                <FieldError errors={getFieldErrors(field.state.meta.errors)} />
              </Field>
            )
          }}
        </form.Field>
      </FieldGroup>

      <dl className="flex flex-col gap-2">
        <form.Subscribe
          selector={(state) =>
            [state.values.amount, state.values.quantityMode] as const
          }
        >
          {([amount, quantityMode]) => (
            <div className="flex items-center justify-between gap-4 font-bold text-base">
              <dt>Estimated cost</dt>
              <dd className="font-mono tabular-nums">
                {quantityMode === 'notional' && Number(amount) > 0
                  ? currencyFormatter.format(Number(amount))
                  : '—'}
              </dd>
            </div>
          )}
        </form.Subscribe>
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

      {createOrder.isError ? (
        <p className="text-danger text-sm" role="alert">
          {createOrder.error.message}
        </p>
      ) : null}
      <form.Subscribe
        selector={(state) =>
          [state.canSubmit, state.isSubmitting, state.values] as const
        }
      >
        {([canSubmit, isSubmitting, values]) => {
          const isReady = canAttemptSubmit(values)

          return (
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="h-12 text-base"
                disabled={!canSubmit || !isReady || isSubmitting}
                onClick={() => void form.handleSubmit({ side: 'buy' })}
                type="button"
              >
                {isSubmitting && createOrder.variables?.side === 'buy' ? (
                  <LoaderCircleIcon
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : null}
                Buy
              </Button>
              <Button
                className="h-12 text-base"
                disabled={!canSubmit || !isReady || isSubmitting}
                onClick={() => void form.handleSubmit({ side: 'sell' })}
                type="button"
                variant="outline"
              >
                {isSubmitting && createOrder.variables?.side === 'sell' ? (
                  <LoaderCircleIcon
                    aria-hidden="true"
                    className="animate-spin"
                  />
                ) : null}
                Sell
              </Button>
            </div>
          )
        }}
      </form.Subscribe>
    </form>
  )
}

/** Converts TanStack Form errors to the shared Field component shape. */
function getFieldErrors(errors: unknown[]): Array<{ message?: string }> {
  return errors.map((error) => {
    if (typeof error === 'string') {
      return { message: error }
    }

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string'
    ) {
      return { message: error.message }
    }

    return {}
  })
}

/** Checks whether enough ticket data exists to attempt validation and submit. */
function canAttemptSubmit(values: OrderFormValues): boolean {
  if (!values.asset || !(Number(values.amount) > 0)) {
    return false
  }

  if (
    (values.type === 'limit' || values.type === 'stop_limit') &&
    !values.limitPrice
  ) {
    return false
  }

  if (
    (values.type === 'stop' || values.type === 'stop_limit') &&
    !values.stopPrice
  ) {
    return false
  }

  return values.type !== 'trailing_stop' || Boolean(values.trailPercent)
}

/** Builds a schema-validated order request from form values and a side. */
function createOrderRequest(
  values: OrderFormValues,
  side: AlpacaOrderSide
): CreateOrderRequest | undefined {
  if (!values.asset) {
    return undefined
  }

  return createOrderRequestSchema.parse({
    amount: values.amount,
    assetClass: values.asset.assetClass,
    clientOrderId: crypto.randomUUID(),
    fractionable: values.asset.fractionable,
    limitPrice: values.limitPrice,
    quantityMode: values.quantityMode,
    side,
    stopPrice: values.stopPrice,
    symbol: values.asset.symbol,
    timeInForce: values.timeInForce,
    trailPercent: values.trailPercent,
    type: values.type,
  })
}
