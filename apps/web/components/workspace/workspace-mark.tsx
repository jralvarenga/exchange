import { cn } from '@workspace/ui/lib/utils'

interface Props {
  className?: string
  name: string
}

/** A rounded tile with the workspace's first letter, so workspaces are told apart at a glance. */
export function WorkspaceMark({ className, name }: Props) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl bg-foreground font-bold text-background text-lg',
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase() || 'W'}
    </span>
  )
}
