'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { buttonVariants } from '@workspace/ui/components/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import { createContext, useContext } from 'react'

type TabsListStyle = {
  size: 'default' | 'lg'
  variant: 'default' | 'line'
}

/** Lets each trigger match the size and variant set on its `TabsList`. */
const TabsListContext = createContext<TabsListStyle>({
  size: 'default',
  variant: 'default',
})

function Tabs({
  className,
  orientation = 'horizontal',
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      orientation={orientation}
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        'group/tabs flex gap-2 data-horizontal:flex-col',
        className
      )}
      {...props}
    />
  )
}

/**
 * `default` is a row of real buttons: inactive tabs are `ghost` and the active
 * tab is `secondary`, exactly like `PillGroup`. `line` is a
 * flat row with an underline. `size` follows `Button`: 32px, or 44px for `lg`.
 */
const tabsListVariants = cva(
  'group/tabs-list inline-flex w-fit items-center group-data-vertical/tabs:flex-col group-data-vertical/tabs:items-stretch',
  {
    variants: {
      variant: {
        default: 'gap-1',
        line: 'gap-1 border-border text-muted-foreground group-data-horizontal/tabs:border-b group-data-vertical/tabs:border-l',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const lineTriggerClassName = cn(
  'relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2.5 font-medium text-sm outline-none transition-colors hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-active:text-foreground',
  'after:absolute after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity data-active:after:opacity-100 group-data-horizontal/tabs:after:inset-x-0 group-data-vertical/tabs:after:inset-y-0 group-data-horizontal/tabs:after:-bottom-px group-data-vertical/tabs:after:-left-px group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:w-0.5',
  "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"
)

function TabsList({
  className,
  size = 'default',
  variant = 'default',
  ...props
}: TabsPrimitive.List.Props &
  VariantProps<typeof tabsListVariants> & {
    size?: TabsListStyle['size']
  }) {
  const resolvedVariant = variant ?? 'default'

  return (
    <TabsListContext.Provider value={{ size, variant: resolvedVariant }}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-size={size}
        data-variant={resolvedVariant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsListContext.Provider>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const { size, variant } = useContext(TabsListContext)

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={(state) =>
        cn(
          variant === 'line'
            ? cn(lineTriggerClassName, size === 'lg' ? 'h-11' : 'h-8')
            : buttonVariants({
                size: size === 'lg' ? 'xl' : 'default',
                variant: state.active ? 'secondary' : 'ghost',
              }),
          'aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-vertical/tabs:justify-start',
          typeof className === 'function' ? className(state) : className
        )
      }
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('flex-1 text-base outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants }
