import type { LucideIcon } from 'lucide-react'

interface Props {
  hint: string
  icon: LucideIcon
  title: string
}

/** Explains what a Trade tab is missing and what the trader can expect. */
export function TradePanelEmpty({ hint, icon: Icon, title }: Props) {
  return (
    <div className="flex items-start gap-4 py-6" role="status">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
