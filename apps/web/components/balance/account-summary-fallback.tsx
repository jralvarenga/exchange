import { Skeleton } from '@workspace/ui/components/skeleton'

const summaryFallbackKeys = ['buying-power', 'cash-balance', 'daily-change']

/** Reserves the account-summary layout while its balance request resolves. */
export function AccountSummaryFallback() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {summaryFallbackKeys.map((key) => (
        <div className="rounded-2xl bg-primary p-5" key={key}>
          <Skeleton className="h-5 w-24 bg-primary-foreground/20" />
          <Skeleton className="mt-2 h-8 w-40 max-w-full bg-primary-foreground/20" />
        </div>
      ))}
    </div>
  )
}
