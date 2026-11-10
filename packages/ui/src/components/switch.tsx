'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from 'cn'

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-muted p-0.5 outline-none ring-1 ring-border transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring data-disabled:cursor-not-allowed data-checked:bg-foreground data-disabled:opacity-50 data-checked:ring-foreground',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-6 rounded-full bg-background shadow-sm ring-1 ring-border transition-transform duration-200 ease-[cubic-bezier(0.19,1,0.22,1)] data-checked:translate-x-5 data-checked:ring-transparent motion-reduce:transition-none"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
