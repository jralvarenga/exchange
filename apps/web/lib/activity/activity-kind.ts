import type { AccountActivity } from '@/lib/alpaca/schemas'

export type ActivityKind =
  | 'deposit'
  | 'dividend'
  | 'fee'
  | 'interest'
  | 'other'
  | 'trade'
  | 'transfer'
  | 'withdrawal'

export type ActivityKindInfo = {
  kind: ActivityKind
  label: string
}

/** Readable names for the Alpaca activity codes a self-directed account sees. */
const activityLabels: Record<string, ActivityKindInfo> = {
  ACATC: { kind: 'transfer', label: 'Cash transfer' },
  ACATS: { kind: 'transfer', label: 'Securities transfer' },
  CFEE: { kind: 'fee', label: 'Crypto fee' },
  CSD: { kind: 'deposit', label: 'Deposit' },
  CSW: { kind: 'withdrawal', label: 'Withdrawal' },
  DIV: { kind: 'dividend', label: 'Dividend' },
  DIVCGL: { kind: 'dividend', label: 'Long-term capital gain' },
  DIVCGS: { kind: 'dividend', label: 'Short-term capital gain' },
  DIVFEE: { kind: 'fee', label: 'Dividend fee' },
  DIVFT: { kind: 'fee', label: 'Dividend tax withheld' },
  DIVNRA: { kind: 'fee', label: 'Dividend tax withheld' },
  DIVROC: { kind: 'dividend', label: 'Return of capital' },
  DIVTW: { kind: 'fee', label: 'Dividend tax withheld' },
  DIVTXEX: { kind: 'dividend', label: 'Tax-exempt dividend' },
  FEE: { kind: 'fee', label: 'Fee' },
  FILL: { kind: 'trade', label: 'Fill' },
  INT: { kind: 'interest', label: 'Interest' },
  INTNRA: { kind: 'fee', label: 'Interest tax withheld' },
  INTTW: { kind: 'fee', label: 'Interest tax withheld' },
  JNL: { kind: 'transfer', label: 'Journal' },
  JNLC: { kind: 'transfer', label: 'Cash journal' },
  JNLS: { kind: 'transfer', label: 'Stock journal' },
  MA: { kind: 'other', label: 'Merger or acquisition' },
  NC: { kind: 'other', label: 'Name change' },
  OPASN: { kind: 'trade', label: 'Option assigned' },
  OPEXP: { kind: 'trade', label: 'Option expired' },
  OPXRC: { kind: 'trade', label: 'Option exercised' },
  PTC: { kind: 'fee', label: 'Pass-through charge' },
  PTR: { kind: 'deposit', label: 'Pass-through rebate' },
  REORG: { kind: 'other', label: 'Reorganization' },
  SC: { kind: 'other', label: 'Symbol change' },
  SSO: { kind: 'other', label: 'Stock spinoff' },
  SSP: { kind: 'other', label: 'Stock split' },
}

/** Names an activity and groups it into a kind the UI can give an icon. */
export function getActivityKind(activity: AccountActivity): ActivityKindInfo {
  const known = activityLabels[activity.activityType]

  if (activity.activityType === 'FILL' && activity.type === 'partial_fill') {
    return { kind: 'trade', label: 'Partial fill' }
  }

  if (known) {
    return known
  }

  const label = activity.activityType
    .replaceAll('_', ' ')
    .toLocaleLowerCase('en-US')

  return {
    kind: 'other',
    label: label.charAt(0).toLocaleUpperCase('en-US') + label.slice(1),
  }
}
