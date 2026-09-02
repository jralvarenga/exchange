import { Button } from '@workspace/ui/components/button'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'

interface Props {
  canPanLeft: boolean
  canPanRight: boolean
  canReset: boolean
  canZoomIn: boolean
  canZoomOut: boolean
  onPanLeft: () => void
  onPanRight: () => void
  onReset: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  totalCount: number
  visibleCount: number
}

/** Provides keyboard-accessible zoom and pan controls for the price chart. */
export function AssetChartZoom({
  canPanLeft,
  canPanRight,
  canReset,
  canZoomIn,
  canZoomOut,
  onPanLeft,
  onPanRight,
  onReset,
  onZoomIn,
  onZoomOut,
  totalCount,
  visibleCount,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3 pb-2">
      <p aria-live="polite" className="text-muted-foreground text-sm">
        <span aria-hidden="true">
          {visibleCount} of {totalCount} bars
        </span>
        <span className="sr-only">
          Showing {visibleCount} of {totalCount} price bars
        </span>
      </p>
      <fieldset className="flex gap-1">
        <legend className="sr-only">Chart zoom and pan controls</legend>
        <Button
          aria-label="Show earlier prices"
          className="size-11 rounded-full"
          disabled={!canPanLeft}
          onClick={onPanLeft}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
          aria-label="Show later prices"
          className="size-11 rounded-full"
          disabled={!canPanRight}
          onClick={onPanRight}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
        <Button
          aria-label="Zoom in"
          className="size-11 rounded-full"
          disabled={!canZoomIn}
          onClick={onZoomIn}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ZoomIn aria-hidden="true" />
        </Button>
        <Button
          aria-label="Zoom out"
          className="size-11 rounded-full"
          disabled={!canZoomOut}
          onClick={onZoomOut}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ZoomOut aria-hidden="true" />
        </Button>
        <Button
          aria-label="Reset chart zoom"
          className="size-11 rounded-full"
          disabled={!canReset}
          onClick={onReset}
          size="icon"
          type="button"
          variant="ghost"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </fieldset>
    </div>
  )
}
