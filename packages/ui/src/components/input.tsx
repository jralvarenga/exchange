import { Input as InputPrimitive } from '@base-ui/react/input'
import { cn } from 'cn'
import type * as React from 'react'

type InputProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  size?: 'default' | 'lg'
}

function Input({ className, size = 'default', type, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'data-[slot=input]:elevation-well w-full min-w-0 rounded-lg border border-input bg-muted/50 px-2.5 py-1 text-base outline-none transition-colors file:inline-flex file:h-6 file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80',
        size === 'lg' ? 'h-11' : 'h-8',
        className
      )}
      {...props}
    />
  )
}

export { Input }
