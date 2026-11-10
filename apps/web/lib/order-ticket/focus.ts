import type { TicketDraft } from '@/models/order-ticket/ticket'

interface TicketErrorFieldOptions {
  field: string
  orderClass: TicketDraft['orderClass']
}

interface FocusTicketFieldOptions extends TicketErrorFieldOptions {
  form: HTMLFormElement
}

/** Maps a schema error to the visible field that holds its value. */
export function getTicketErrorField({
  field,
  orderClass,
}: TicketErrorFieldOptions): string {
  if (field === 'trailPrice') return 'trailPercent'
  // OCO sends its take-profit as the entry limit price.
  if (field === 'limitPrice' && orderClass === 'oco')
    return 'takeProfitLimitPrice'
  return field
}

/** Moves keyboard focus to the control behind a validation error and centers it. */
export function focusTicketField({
  field,
  form,
  orderClass,
}: FocusTicketFieldOptions): void {
  const target = form.querySelector<HTMLElement>(
    `[data-order-field="${getTicketErrorField({ field, orderClass })}"]`
  )
  if (!target) return
  const selector = 'input, select, button, [role=combobox], [role=checkbox]'
  const control = target.matches(selector)
    ? target
    : target.querySelector<HTMLElement>(selector)
  control?.focus()
  control?.scrollIntoView({ block: 'center', behavior: 'instant' })
}
