'use client'

import { useForm } from '@tanstack/react-form'
import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
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
import { DollarSign, Hash } from 'lucide-react'
import { useState } from 'react'

import { AssetCombobox } from '@/components/assets/asset-combobox'
import { searchAssets } from '@/hooks/use-asset-search'
import { useCreateOrder } from '@/hooks/use-create-order'
import {
  getAllowedOrderTypes,
  getAllowedTimesInForce,
  getCompatibleOrderSettings,
} from '@/lib/alpaca/order-constraints'
import {
  type AlpacaOrderSide,
  type AlpacaOrderType,
  type AlpacaTimeInForce,
  AssetSearchResult,
  type CreateOrderRequest,
  type OrderFormValues,
  orderFormValuesSchema,
} from '@/lib/alpaca/schemas'

interface Props {
  assetIdentifier?: string
}

interface SelectOption<Value extends string> {
  label: string
  value: Value
}

interface OrderFeedback {
  kind: 'error' | 'success'
  message: string
}

const orderTypes: Array<SelectOption<AlpacaOrderType>> = [
  { label: 'Market', value: 'market' },
  { label: 'Limit', value: 'limit' },
  { label: 'Stop', value: 'stop' },
  { label: 'Stop limit', value: 'stop_limit' },
  { label: 'Trailing stop', value: 'trailing_stop' },
]

const timesInForce: Array<SelectOption<AlpacaTimeInForce>> = [
  { label: 'Day · Expires at market close', value: 'day' },
  { label: 'Good until canceled', value: 'gtc' },
  { label: 'Opening auction only', value: 'opg' },
  { label: 'Closing auction only', value: 'cls' },
  { label: 'Immediate or cancel', value: 'ioc' },
  { label: 'Fill completely or cancel', value: 'fok' },
]

const defaultValues: OrderFormValues = {
  amount: '1',
  asset: null,
  limitPrice: '',
  quantityMode: 'qty',
  stopPrice: '',
  timeInForce: 'day',
  trailPercent: '',
  type: 'market',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  style: 'currency',
})

/** Opens a schema-validated Alpaca order ticket for an optional asset. */
export function BuyDialog({ assetIdentifier }: Props) {
  const [feedback, setFeedback] = useState<OrderFeedback | null>(null)
  const createOrder = useCreateOrder()
  const form = useForm({
    defaultValues,
    onSubmit: async ({ meta, value }) => {
      const request = toCreateOrderRequest({
        side: meta.side,
        values: value,
      })

      if (!request) {
        return
      }

      const side = request.side === 'sell' ? 'Sell' : 'Buy'

      try {
        await createOrder.mutateAsync(request)
        setFeedback({
          kind: 'success',
          message: `${side} order for ${request.symbol.toLocaleLowerCase('en-US')} was submitted.`,
        })
      } catch (error) {
        setFeedback({
          kind: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to place the order.',
        })
      }
    },
    onSubmitMeta: { side: 'buy' as AlpacaOrderSide },
    validators: {
      onSubmit: orderFormValuesSchema,
    },
  })

  /** Keeps order type and time in force on values Alpaca accepts for this asset. */
  function syncCompatibleOrderFields(values: OrderFormValues): void {
    const compatible = getCompatibleOrderSettings({
      amount: values.amount,
      assetClass: values.asset?.assetClass,
      quantityMode: values.quantityMode,
      timeInForce: values.timeInForce,
      type: values.type,
    })

    form.setFieldValue('type', compatible.type)
    form.setFieldValue('timeInForce', compatible.timeInForce)
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          return
        }

        setFeedback(null)
        form.setFieldValue('asset', null)

        const normalizedIdentifier = assetIdentifier
          ?.trim()
          .toLocaleLowerCase('en-US')

        if (!normalizedIdentifier) {
          return
        }

        const controller = new AbortController()

        void searchAssets({
          query: normalizedIdentifier,
          signal: controller.signal,
        })
          .then((response) => {
            const exactAsset = response.assets.find(
              (asset) =>
                asset.id.toLocaleLowerCase('en-US') === normalizedIdentifier ||
                asset.symbol.toLocaleLowerCase('en-US') === normalizedIdentifier
            )

            if (!exactAsset) {
              return
            }

            form.setFieldValue('asset', exactAsset)
            syncCompatibleOrderFields({
              ...form.state.values,
              asset: exactAsset,
            })
          })
          .catch(() => {
            // The combobox remains available for a manual search.
          })
      }}
    >
      <DialogTrigger
        render={
          <Button
            className="h-12 bg-foreground px-6 text-background hover:bg-foreground/85 sm:min-w-28"
            size="lg"
          />
        }
      >
        Buy
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-[2rem] bg-background p-5 sm:max-w-md sm:p-6">
        <div className="pr-10">
          <DialogTitle className="font-bold text-xl">
            Place an order
          </DialogTitle>
          <DialogDescription className="mt-2 text-base">
            Search for an asset and configure the order details.
          </DialogDescription>
        </div>

        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit({ side: 'buy' })
          }}
        >
          <FieldGroup className="gap-4">
            <form.Field name="asset">
              {(field) => (
                <Field data-invalid={!field.state.meta.isValid}>
                  <FieldLabel className="sr-only">Symbol</FieldLabel>
                  <AssetCombobox
                    initialSymbol={assetIdentifier}
                    key={assetIdentifier ?? 'asset-search'}
                    onValueChange={(asset: AssetSearchResult | null) => {
                      field.handleChange(asset)
                      syncCompatibleOrderFields({
                        ...form.state.values,
                        asset,
                      })
                      setFeedback(null)
                    }}
                    value={field.state.value}
                  />
                  <FieldError
                    errors={getFieldErrors(field.state.meta.errors)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values.quantityMode}>
              {(quantityMode) => (
                <form.Field name="amount">
                  {(field) => (
                    <Field data-invalid={!field.state.meta.isValid}>
                      <div className="flex items-center justify-between gap-4">
                        <FieldLabel htmlFor="order-amount">Quantity</FieldLabel>
                        <fieldset
                          aria-label="Quantity unit"
                          className="flex rounded-full bg-muted p-1"
                        >
                          <Button
                            aria-label="Enter a number of shares"
                            aria-pressed={quantityMode === 'qty'}
                            className="size-8 rounded-full"
                            onClick={() => {
                              form.setFieldValue('quantityMode', 'qty')
                              syncCompatibleOrderFields({
                                ...form.state.values,
                                quantityMode: 'qty',
                              })
                            }}
                            size="icon-sm"
                            type="button"
                            variant={
                              quantityMode === 'qty' ? 'default' : 'ghost'
                            }
                          >
                            <Hash aria-hidden="true" />
                          </Button>
                          <Button
                            aria-label="Enter a dollar amount"
                            aria-pressed={quantityMode === 'notional'}
                            className="size-8 rounded-full"
                            onClick={() => {
                              form.setFieldValue('quantityMode', 'notional')
                              syncCompatibleOrderFields({
                                ...form.state.values,
                                quantityMode: 'notional',
                              })
                            }}
                            size="icon-sm"
                            type="button"
                            variant={
                              quantityMode === 'notional' ? 'default' : 'ghost'
                            }
                          >
                            <DollarSign aria-hidden="true" />
                          </Button>
                        </fieldset>
                      </div>
                      <Input
                        aria-invalid={!field.state.meta.isValid}
                        className="h-12 px-4 text-base"
                        id="order-amount"
                        inputMode="decimal"
                        min="0"
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) => {
                          field.handleChange(event.target.value)
                          syncCompatibleOrderFields({
                            ...form.state.values,
                            amount: event.target.value,
                          })
                          setFeedback(null)
                        }}
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

            <form.Subscribe
              selector={(state) =>
                [
                  state.values.amount,
                  state.values.asset,
                  state.values.quantityMode,
                  state.values.type,
                ] as const
              }
            >
              {([amount, asset, quantityMode, orderType]) => {
                const allowedOrderTypes = getAllowedOrderTypes(
                  asset?.assetClass
                )
                const allowedTimesInForce = getAllowedTimesInForce({
                  amount,
                  assetClass: asset?.assetClass,
                  quantityMode,
                  type: orderType,
                })
                const visibleOrderTypes = orderTypes.filter((option) =>
                  allowedOrderTypes.includes(option.value)
                )
                const visibleTimesInForce = timesInForce.filter((option) =>
                  allowedTimesInForce.includes(option.value)
                )

                return (
                  <>
                    <form.Field name="type">
                      {(field) => (
                        <Field data-invalid={!field.state.meta.isValid}>
                          <FieldLabel htmlFor="order-type">
                            Order type
                          </FieldLabel>
                          <Select
                            items={visibleOrderTypes}
                            onValueChange={(value) => {
                              const type = value as AlpacaOrderType
                              field.handleChange(type)
                              syncCompatibleOrderFields({
                                ...form.state.values,
                                type,
                              })
                            }}
                            value={field.state.value}
                          >
                            <SelectTrigger
                              aria-invalid={!field.state.meta.isValid}
                              className="h-12 w-full px-4 text-base"
                              id="order-type"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                              {visibleOrderTypes.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError
                            errors={getFieldErrors(field.state.meta.errors)}
                          />
                        </Field>
                      )}
                    </form.Field>

                    {orderType === 'limit' || orderType === 'stop_limit' ? (
                      <form.Field name="limitPrice">
                        {(field) => (
                          <Field data-invalid={!field.state.meta.isValid}>
                            <FieldLabel htmlFor="limit-price">
                              Limit price
                            </FieldLabel>
                            <Input
                              aria-invalid={!field.state.meta.isValid}
                              className="h-12 px-4 text-base"
                              id="limit-price"
                              inputMode="decimal"
                              min="0"
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
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
                    ) : null}

                    {orderType === 'stop' || orderType === 'stop_limit' ? (
                      <form.Field name="stopPrice">
                        {(field) => (
                          <Field data-invalid={!field.state.meta.isValid}>
                            <FieldLabel htmlFor="stop-price">
                              Stop price
                            </FieldLabel>
                            <Input
                              aria-invalid={!field.state.meta.isValid}
                              className="h-12 px-4 text-base"
                              id="stop-price"
                              inputMode="decimal"
                              min="0"
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
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
                    ) : null}

                    {orderType === 'trailing_stop' ? (
                      <form.Field name="trailPercent">
                        {(field) => (
                          <Field data-invalid={!field.state.meta.isValid}>
                            <FieldLabel htmlFor="trail-percent">
                              Trail percent
                            </FieldLabel>
                            <Input
                              aria-invalid={!field.state.meta.isValid}
                              className="h-12 px-4 text-base"
                              id="trail-percent"
                              inputMode="decimal"
                              min="0"
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
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
                    ) : null}

                    <form.Field name="timeInForce">
                      {(field) => (
                        <Field data-invalid={!field.state.meta.isValid}>
                          <FieldLabel htmlFor="time-in-force">
                            Time in force
                          </FieldLabel>
                          <Select
                            items={visibleTimesInForce}
                            onValueChange={(value) =>
                              field.handleChange(value as AlpacaTimeInForce)
                            }
                            value={field.state.value}
                          >
                            <SelectTrigger
                              aria-invalid={!field.state.meta.isValid}
                              className="h-12 w-full px-4 text-base"
                              id="time-in-force"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                              {visibleTimesInForce.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FieldError
                            errors={getFieldErrors(field.state.meta.errors)}
                          />
                        </Field>
                      )}
                    </form.Field>
                  </>
                )
              }}
            </form.Subscribe>
          </FieldGroup>

          <form.Subscribe
            selector={(state) =>
              [state.canSubmit, state.isSubmitting, state.values] as const
            }
          >
            {([canSubmit, isSubmitting, values]) => {
              const isReady = orderFormValuesSchema.safeParse(values).success
              const estimatedCost =
                values.quantityMode === 'notional'
                  ? currencyFormatter.format(Number(values.amount) || 0)
                  : '—'
              const isBusy = isSubmitting || createOrder.isPending

              return (
                <>
                  <dl className="flex flex-col gap-2 border-border border-t pt-4">
                    <div className="flex items-center justify-between gap-4 font-medium text-base">
                      <dt>Estimated cost</dt>
                      <dd className="font-mono tabular-nums">
                        {estimatedCost}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                      <dt>Cash buying power</dt>
                      <dd className="font-mono text-foreground tabular-nums">
                        —
                      </dd>
                    </div>
                  </dl>

                  {feedback ? (
                    <p
                      className={
                        feedback.kind === 'error'
                          ? 'text-danger text-sm'
                          : 'text-sm text-success'
                      }
                      role={feedback.kind === 'error' ? 'alert' : 'status'}
                    >
                      {feedback.message}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="h-12 text-base"
                      disabled={!canSubmit || !isReady || isBusy}
                      type="submit"
                    >
                      {isBusy ? 'Submitting…' : 'Buy'}
                    </Button>
                    <Button
                      className="h-12 text-base"
                      disabled={!canSubmit || !isReady || isBusy}
                      onClick={() => void form.handleSubmit({ side: 'sell' })}
                      type="button"
                      variant="outline"
                    >
                      Sell
                    </Button>
                  </div>
                </>
              )
            }}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ToCreateOrderRequestOptions {
  side: AlpacaOrderSide
  values: OrderFormValues
}

/** Maps ticket values to the API payload when an asset is selected. */
function toCreateOrderRequest(
  options: ToCreateOrderRequestOptions
): CreateOrderRequest | undefined {
  if (!options.values.asset) {
    return undefined
  }

  return {
    amount: options.values.amount,
    assetClass: options.values.asset.assetClass,
    fractionable: options.values.asset.fractionable,
    limitPrice: options.values.limitPrice,
    quantityMode: options.values.quantityMode,
    side: options.side,
    stopPrice: options.values.stopPrice,
    symbol: options.values.asset.symbol,
    timeInForce: options.values.timeInForce,
    trailPercent: options.values.trailPercent,
    type: options.values.type,
  }
}

/** Converts TanStack Form and Zod errors to the shared Field error shape. */
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
