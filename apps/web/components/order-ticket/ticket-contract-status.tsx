interface Props {
  status: 'empty' | 'error' | 'loading' | 'none'
}

const messages = {
  empty: 'No contracts are listed for this side and expiration.',
  error: 'Option contracts are unavailable. Try again in a moment.',
  loading: 'Loading contracts…',
  none: 'This stock has no listed option contracts.',
}

/** Explains why the contract picker cannot offer a strike yet. */
export function TicketContractStatus({ status }: Props) {
  return (
    <p
      className="text-muted-foreground"
      role={status === 'error' ? 'alert' : 'status'}
    >
      {messages[status]}
    </p>
  )
}
