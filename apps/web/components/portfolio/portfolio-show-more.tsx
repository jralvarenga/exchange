'use client'

import { Button } from '@workspace/ui/components/button'

interface Props {
  label: string
  loading: boolean
  onClick: () => void
}

/** Loads the next, older page of a portfolio list. */
export function PortfolioShowMore({ label, loading, onClick }: Props) {
  return (
    <Button
      className="self-center"
      disabled={loading}
      onClick={onClick}
      size="xl"
      type="button"
      variant="outline"
    >
      {loading ? 'Loading…' : label}
    </Button>
  )
}
