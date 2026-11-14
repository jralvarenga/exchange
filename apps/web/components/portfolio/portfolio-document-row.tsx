import type { LucideIcon } from 'lucide-react'

interface Props {
  detail: string
  icon: LucideIcon
  label: string
}

/** One kind of Alpaca document and when it is issued. */
export function PortfolioDocumentRow({ detail, icon: Icon, label }: Props) {
  return (
    <li className="flex min-h-16 items-center gap-4 py-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        <Icon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{detail}</span>
      </div>
    </li>
  )
}
