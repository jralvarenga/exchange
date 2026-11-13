import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'

interface Props extends React.ComponentProps<typeof Link> {}

/** An inline text link inside auth forms: bold foreground, underlined on hover. */
export function AuthLink({ className, ...props }: Props) {
  return (
    <Link
      className={cn(
        'rounded-md font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring',
        className
      )}
      {...props}
    />
  )
}
