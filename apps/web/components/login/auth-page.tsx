import { cn } from '@workspace/ui/lib/utils'

interface Props {
  children: React.ReactNode
  /** Wide pages hold multi-field forms, such as onboarding. */
  size?: 'default' | 'wide'
}

/** Centers an authentication form on the same canvas as the dashboard. */
export function AuthPage({ children, size = 'default' }: Props) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className={cn('w-full', size === 'wide' ? 'max-w-lg' : 'max-w-sm')}>
        {children}
      </div>
    </main>
  )
}
