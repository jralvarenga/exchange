import { cn } from '@workspace/ui/lib/utils'

import { AuthFooter } from '@/components/login/auth-footer'
import { AuthShowcase } from '@/components/login/auth-showcase'
import { Logo } from '@/components/logo'

interface Props {
  children: React.ReactNode
  /** Wide pages hold multi-field forms, such as onboarding. */
  size?: 'default' | 'wide'
}

/**
 * Splits the screen into the brand showcase and the form from `lg`. Phones
 * get the form alone, under the logo. Links to the legal pages close the
 * form column.
 */
export function AuthPage({ children, size = 'default' }: Props) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2 lg:gap-3 lg:p-3">
      <AuthShowcase />
      <main className="flex flex-col items-center gap-10 px-4 py-10 sm:px-6">
        <div
          className={cn(
            'flex w-full flex-col gap-10 lg:flex-1 lg:justify-center',
            size === 'wide' ? 'max-w-lg' : 'max-w-sm'
          )}
        >
          <Logo className="lg:hidden" />
          {children}
        </div>
        <AuthFooter />
      </main>
    </div>
  )
}
