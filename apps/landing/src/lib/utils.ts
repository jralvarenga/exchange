interface SeriesOptions {
  /** Average move per step, as a fraction of the price. */
  drift: number
  length: number
  /** Seed for the generator, so every build draws the same line. */
  seed: number
  start: number
  /** Largest random move per step, as a fraction of the price. */
  volatility: number
}

interface SparklineOptions {
  height: number
  /** Space kept above and below the line so its stroke is never clipped. */
  inset?: number
  values: number[]
  width: number
}

interface SparklinePaths {
  /** Closed path under the line, for a fill that fades into the page. */
  area: string
  /** End of the line, for the live dot. */
  end: { x: number; y: number }
  line: string
}

interface CurrencyOptions {
  value: number
}

interface PercentOptions {
  value: number
}

/**
 * Returns a seeded pseudo-random number generator (mulberry32), so mock
 * charts look organic but stay identical between builds.
 */
function createRandom(seed: number): () => number {
  let state = seed

  return function random() {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

/** Draws a deterministic random-walk price series for mock charts. */
export function createSeries(options: SeriesOptions): number[] {
  const random = createRandom(options.seed)
  const values = [options.start]

  for (let index = 1; index < options.length; index++) {
    const previous = values[index - 1] ?? options.start
    const move = options.drift + (random() * 2 - 1) * options.volatility

    values.push(previous * (1 + move))
  }

  return values
}

/**
 * Turns a series into SVG paths that fill a `width` × `height` viewBox, with
 * the line smoothed by midpoint quadratic curves.
 */
export function buildSparkline(options: SparklineOptions): SparklinePaths {
  const inset = options.inset ?? 4
  const minimum = Math.min(...options.values)
  const maximum = Math.max(...options.values)
  const range = maximum - minimum || 1
  const step = options.width / Math.max(options.values.length - 1, 1)
  const points = options.values.map((value, index) => ({
    x: index * step,
    y: inset + (1 - (value - minimum) / range) * (options.height - inset * 2),
  }))
  const first = points[0] ?? { x: 0, y: options.height / 2 }
  const end = points.at(-1) ?? first
  let line = `M${first.x.toFixed(2)} ${first.y.toFixed(2)}`

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1] ?? first
    const current = points[index] ?? first
    const midX = (previous.x + current.x) / 2
    const midY = (previous.y + current.y) / 2

    line += ` Q${previous.x.toFixed(2)} ${previous.y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`
  }

  line += ` T${end.x.toFixed(2)} ${end.y.toFixed(2)}`

  return {
    area: `${line} L${end.x.toFixed(2)} ${options.height} L${first.x.toFixed(2)} ${options.height} Z`,
    end,
    line,
  }
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
})

const percentFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  signDisplay: 'always',
  style: 'percent',
})

/** Formats a number as US dollars, like the app does. */
export function formatCurrency(options: CurrencyOptions): string {
  return currencyFormatter.format(options.value)
}

/** Formats a fraction as a signed percentage, such as `+2.41%`. */
export function formatSignedPercent(options: PercentOptions): string {
  return percentFormatter.format(options.value)
}

interface AssetLogoOptions {
  /** Pixel size to request; ask for twice the rendered size for sharp edges. */
  size: number
  symbol: string
}

/** Returns the remote logo for a stock or ETF, from the same source the app uses. */
export function getAssetLogoUrl(options: AssetLogoOptions): string {
  return `https://assets.parqet.com/logos/symbol/${encodeURIComponent(options.symbol)}?format=png&size=${options.size}`
}
