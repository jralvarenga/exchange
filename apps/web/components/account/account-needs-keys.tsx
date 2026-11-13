interface Props {
  label: string
}

/** Explains that a section waits on valid Alpaca keys and links to them. */
export function AccountNeedsKeys({ label }: Props) {
  return (
    <p className="py-8 font-medium text-muted-foreground">
      {label}{' '}
      <a
        className="rounded-sm text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
        href="#connections"
      >
        Add a connection
      </a>
    </p>
  )
}
