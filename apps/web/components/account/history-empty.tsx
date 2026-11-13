import { History } from 'lucide-react'

/** Shown before anything was recorded in the workspace. */
export function HistoryEmpty() {
  return (
    <div className="flex flex-col items-start gap-3 border-border border-y py-8">
      <History aria-hidden="true" className="size-6 text-muted-foreground" />
      <p className="font-medium">Nothing recorded yet.</p>
      <p className="text-muted-foreground">
        Orders you place and connections you add show up here.
      </p>
    </div>
  )
}
