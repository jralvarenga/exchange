import { cn } from '@workspace/ui/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  detail?: string
  label: string
}

/** One label and value row inside an account definition list. */
export function AccountFact({ children, className, detail, label }: Props) {
  return (
    <div
      className={cn(
        'flex min-h-16 items-center justify-between gap-4 py-4',
        className
      )}
    >
      <dt className="flex min-w-0 flex-col">
        <span className="font-medium">{label}</span>
        {detail ? (
          <span className="text-muted-foreground">{detail}</span>
        ) : null}
      </dt>
      <dd className="flex shrink-0 items-center gap-2 text-right font-bold text-lg tabular-nums">
        {children}
      </dd>
    </div>
  )
}
