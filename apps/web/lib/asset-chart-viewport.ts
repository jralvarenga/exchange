import { z } from 'zod'

import type { AssetInterval } from '@/lib/alpaca/schemas'

export interface ChartVisibleRange {
  endIndex: number
  startIndex: number
}

export interface ChartViewport {
  startRatio: number
  visibleRatio: number
}

interface ToVisibleRangeOptions {
  length: number
  minVisible: number
  viewport: ChartViewport
}

interface ToViewportOptions {
  length: number
  range: ChartVisibleRange
}

interface ZoomViewportOptions {
  factor: number
  focusRatio: number
  length: number
  minVisible: number
  viewport: ChartViewport
}

interface PanViewportOptions {
  delta: number
  length: number
  minVisible: number
  viewport: ChartViewport
}

interface ReadChartViewportOptions {
  interval: AssetInterval
  symbol: string
}

interface WriteChartViewportOptions extends ReadChartViewportOptions {
  viewport: ChartViewport
}

export const DEFAULT_CHART_VIEWPORT: ChartViewport = {
  startRatio: 1,
  visibleRatio: 1,
}

export const MIN_VISIBLE_BARS = 12
export const ZOOM_IN_FACTOR = 0.5
export const ZOOM_OUT_FACTOR = 2
export const WHEEL_ZOOM_IN_FACTOR = 0.9
export const WHEEL_ZOOM_OUT_FACTOR = 1.12
export const PAN_WINDOW_RATIO = 0.25

const viewportStorageKey = 'exchange:asset-chart-viewport'

const chartViewportSchema = z.object({
  startRatio: z.number().min(0).max(1),
  visibleRatio: z.number().min(0).max(1),
})

const chartViewportStoreSchema = z.record(z.string(), chartViewportSchema)

/** Converts a persisted viewport into inclusive bar indices for the current series. */
export function toVisibleRange(
  options: ToVisibleRangeOptions
): ChartVisibleRange {
  if (options.length <= 0) {
    return { endIndex: 0, startIndex: 0 }
  }

  const minCount = Math.min(options.minVisible, options.length)
  const visibleCount = clamp(
    Math.round(options.viewport.visibleRatio * options.length),
    minCount,
    options.length
  )
  const maxStart = options.length - visibleCount
  const startIndex = clamp(
    Math.round(options.viewport.startRatio * maxStart),
    0,
    maxStart
  )

  return {
    endIndex: startIndex + visibleCount - 1,
    startIndex,
  }
}

/** Converts a visible index range into ratios that survive series length changes. */
export function toViewport(options: ToViewportOptions): ChartViewport {
  if (options.length <= 0) {
    return DEFAULT_CHART_VIEWPORT
  }

  const visibleCount = options.range.endIndex - options.range.startIndex + 1
  const maxStart = Math.max(options.length - visibleCount, 0)

  return {
    startRatio:
      maxStart === 0
        ? DEFAULT_CHART_VIEWPORT.startRatio
        : options.range.startIndex / maxStart,
    visibleRatio: visibleCount / options.length,
  }
}

/** Shrinks or expands the window around a 0–1 focus point in the current view. */
export function zoomViewport(options: ZoomViewportOptions): ChartViewport {
  const range = toVisibleRange({
    length: options.length,
    minVisible: options.minVisible,
    viewport: options.viewport,
  })
  const currentCount = range.endIndex - range.startIndex + 1
  const nextCount = clamp(
    Math.round(currentCount * options.factor),
    Math.min(options.minVisible, options.length),
    options.length
  )
  const focusIndex =
    range.startIndex + options.focusRatio * Math.max(currentCount - 1, 0)
  const nextStart = clamp(
    Math.round(focusIndex - options.focusRatio * Math.max(nextCount - 1, 0)),
    0,
    Math.max(options.length - nextCount, 0)
  )

  return toViewport({
    length: options.length,
    range: {
      endIndex: nextStart + nextCount - 1,
      startIndex: nextStart,
    },
  })
}

/** Slides the window without changing how many bars are visible. */
export function panViewport(options: PanViewportOptions): ChartViewport {
  const range = toVisibleRange({
    length: options.length,
    minVisible: options.minVisible,
    viewport: options.viewport,
  })
  const visibleCount = range.endIndex - range.startIndex + 1
  const startIndex = clamp(
    range.startIndex + options.delta,
    0,
    Math.max(options.length - visibleCount, 0)
  )

  return toViewport({
    length: options.length,
    range: {
      endIndex: startIndex + visibleCount - 1,
      startIndex,
    },
  })
}

/** Returns a focus point that keeps the latest bars on screen when they already are. */
export function getZoomFocusRatio(
  range: ChartVisibleRange,
  length: number
): number {
  if (range.endIndex >= length - 1) {
    return 1
  }

  if (range.startIndex <= 0) {
    return 0
  }

  return 0.5
}

/** Returns how many bars one pan button press should move. */
export function getPanStep(visibleCount: number): number {
  return Math.max(1, Math.round(visibleCount * PAN_WINDOW_RATIO))
}

/** Reads the saved viewport for one symbol and interval, if it exists. */
export function readChartViewport(
  options: ReadChartViewportOptions
): ChartViewport | undefined {
  try {
    const raw = window.localStorage.getItem(viewportStorageKey)

    if (!raw) {
      return undefined
    }

    const store = chartViewportStoreSchema.safeParse(JSON.parse(raw))

    if (!store.success) {
      return undefined
    }

    return store.data[getViewportEntryKey(options)]
  } catch {
    return undefined
  }
}

/** Saves the viewport for one symbol and interval without replacing other charts. */
export function writeChartViewport(options: WriteChartViewportOptions): void {
  try {
    const store = chartViewportStoreSchema.safeParse(
      JSON.parse(window.localStorage.getItem(viewportStorageKey) ?? '{}')
    )
    const nextStore = store.success ? store.data : {}

    nextStore[getViewportEntryKey(options)] = options.viewport
    window.localStorage.setItem(viewportStorageKey, JSON.stringify(nextStore))
  } catch {
    // The in-memory viewport still works for this visit.
  }
}

/** Builds the localStorage record key for one chart. */
function getViewportEntryKey(options: ReadChartViewportOptions): string {
  return `${options.symbol}:${options.interval}`
}

/** Clamps a number to an inclusive min/max range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
