'use client'

import { buttonVariants } from '@workspace/ui/components/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'

import { Activity } from '@/components/activity/activity'

interface Props {
  className?: string
}

/** Shows recent account activity with a footer link to the full feed. */
export function ActivityCard({ className }: Props) {
  return (
    <Card
      aria-labelledby="activity-title"
      className={cn('flex flex-col', className)}
      role="region"
    >
      <CardHeader>
        <CardTitle id="activity-title">Activity</CardTitle>
      </CardHeader>
      <CardContent className="min-h-72 flex-1 overflow-y-auto md:min-h-0">
        <Activity limit={8} />
      </CardContent>
      <CardFooter className="mt-auto">
        <Link
          className={cn(
            buttonVariants({ size: 'lg', variant: 'outline' }),
            'min-h-11 w-full'
          )}
          href="/portfolio"
        >
          View full activity
        </Link>
      </CardFooter>
    </Card>
  )
}
