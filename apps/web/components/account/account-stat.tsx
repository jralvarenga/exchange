import { cn } from '@workspace/ui/lib/utils'
import { TextMorph } from 'torph/react'

import { revealClassName } from '@/lib/utils'

interface Props {
  className?: string
  label: string
  value: string
}

const morphEase = 'cubic-bezier(0.19, 1, 0.22, 1)'

/** One figure in an open stats strip that morphs when it refreshes. */
export function AccountStat({ className, label, value }: Props) {
  return (
    <div className={cn('flex flex-col gap-2 py-6', revealClassName, className)}>
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="font-bold text-3xl tabular-nums tracking-tight">
        <TextMorph as="span" duration={700} ease={morphEase} locale="en-US">
          {value}
        </TextMorph>
      </dd>
    </div>
  )
}
