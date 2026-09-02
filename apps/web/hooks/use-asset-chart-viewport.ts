import { useCallback, useEffect, useMemo, useState } from 'react'

import type { AssetInterval } from '@/lib/alpaca/schemas'
import {
  type ChartViewport,
  type ChartVisibleRange,
  DEFAULT_CHART_VIEWPORT,
  getPanStep,
  getZoomFocusRatio,
  MIN_VISIBLE_BARS,
  panViewport,
  readChartViewport,
  toVisibleRange,
  writeChartViewport,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
  zoomViewport,
} from '@/lib/asset-chart-viewport'

interface Options {
  interval: AssetInterval
  length: number
  symbol: string
}

interface AssetChartViewportControls {
  canPanLeft: boolean
  canPanRight: boolean
  canReset: boolean
  canZoomIn: boolean
  canZoomOut: boolean
  panTo: (startIndex: number) => void
  panLeft: () => void
  panRight: () => void
  range: ChartVisibleRange
  reset: () => void
  visibleCount: number
  zoomBy: (factor: number, focusRatio?: number) => void
  zoomIn: (focusRatio?: number) => void
  zoomOut: (focusRatio?: number) => void
}

/** Owns the visible price-history window and remembers it per symbol and interval. */
export function useAssetChartViewport(
  options: Options
): AssetChartViewportControls {
  const [viewport, setViewport] = useState<ChartViewport>(
    DEFAULT_CHART_VIEWPORT
  )

  useEffect(() => {
    setViewport(
      readChartViewport({
        interval: options.interval,
        symbol: options.symbol,
      }) ?? DEFAULT_CHART_VIEWPORT
    )
  }, [options.interval, options.symbol])

  const range = useMemo(
    () =>
      toVisibleRange({
        length: options.length,
        minVisible: MIN_VISIBLE_BARS,
        viewport,
      }),
    [options.length, viewport]
  )
  const visibleCount = range.endIndex - range.startIndex + 1
  const canZoomIn = visibleCount > Math.min(MIN_VISIBLE_BARS, options.length)
  const canZoomOut = visibleCount < options.length
  const canPanLeft = range.startIndex > 0
  const canPanRight = range.endIndex < options.length - 1

  /** Writes the next viewport to state and localStorage. */
  const commit = useCallback(
    (nextViewport: ChartViewport) => {
      setViewport(nextViewport)
      writeChartViewport({
        interval: options.interval,
        symbol: options.symbol,
        viewport: nextViewport,
      })
    },
    [options.interval, options.symbol]
  )

  /** Zooms by a custom factor around a 0–1 focus point in the current view. */
  const zoomBy = useCallback(
    (factor: number, focusRatio?: number) => {
      commit(
        zoomViewport({
          factor,
          focusRatio: focusRatio ?? getZoomFocusRatio(range, options.length),
          length: options.length,
          minVisible: MIN_VISIBLE_BARS,
          viewport,
        })
      )
    },
    [commit, options.length, range, viewport]
  )

  /** Zooms in around the latest bars, the current center, or a pointer focus. */
  const zoomIn = useCallback(
    (focusRatio?: number) => {
      zoomBy(ZOOM_IN_FACTOR, focusRatio)
    },
    [zoomBy]
  )

  /** Zooms out around the latest bars, the current center, or a pointer focus. */
  const zoomOut = useCallback(
    (focusRatio?: number) => {
      zoomBy(ZOOM_OUT_FACTOR, focusRatio)
    },
    [zoomBy]
  )

  /** Moves the window so it starts at a specific bar index. */
  const panTo = useCallback(
    (startIndex: number) => {
      const currentStart = toVisibleRange({
        length: options.length,
        minVisible: MIN_VISIBLE_BARS,
        viewport,
      }).startIndex

      commit(
        panViewport({
          delta: startIndex - currentStart,
          length: options.length,
          minVisible: MIN_VISIBLE_BARS,
          viewport,
        })
      )
    },
    [commit, options.length, viewport]
  )

  /** Moves the window by a number of bars without changing zoom. */
  const panBy = useCallback(
    (delta: number) => {
      panTo(range.startIndex + delta)
    },
    [panTo, range.startIndex]
  )

  /** Shows earlier prices while keeping the current zoom. */
  const panLeft = useCallback(() => {
    panBy(-getPanStep(visibleCount))
  }, [panBy, visibleCount])

  /** Shows later prices while keeping the current zoom. */
  const panRight = useCallback(() => {
    panBy(getPanStep(visibleCount))
  }, [panBy, visibleCount])

  /** Restores the full selected interval. */
  const reset = useCallback(() => {
    commit(DEFAULT_CHART_VIEWPORT)
  }, [commit])

  return {
    canPanLeft,
    canPanRight,
    canReset: canZoomOut || canPanLeft || canPanRight,
    canZoomIn,
    canZoomOut,
    panLeft,
    panRight,
    panTo,
    range,
    reset,
    visibleCount,
    zoomBy,
    zoomIn,
    zoomOut,
  }
}
