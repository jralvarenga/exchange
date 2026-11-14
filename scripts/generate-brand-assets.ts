import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

/**
 * Renders the PNG icons and Open Graph images for both apps from the one
 * source of truth, `apps/landing/public/favicon.svg` (the "treid." wordmark on
 * a #080808 rounded square). Run with `bun run brand:assets` after changing it.
 * The `.ico` files are maintained separately and are not touched here.
 */

type Output = {
  path: string
  svg: string
}

interface RenderPngOptions {
  height: number
  svg: string
  width: number
}

const root = fileURLToPath(new URL('..', import.meta.url))
const source = join(root, 'apps/landing/public/favicon.svg')
const landingPublic = join(root, 'apps/landing/public')
const webApp = join(root, 'apps/web/app')
const webIcons = join(root, 'apps/web/public/icons')

/** Brand canvas behind the wordmark. */
const canvas = '#080808'
/** Dark theme `muted-foreground`, for the Open Graph tagline. */
const muted = '#a6a09b'
const tagline = 'A quiet trading desk for your Alpaca account.'

/** Reads the wordmark path data from the source favicon. */
function readWordmark(svg: string): string {
  const match = svg.match(/<path[^>]*\sd="([^"]+)"/)

  if (!match?.[1]) {
    throw new Error(`No wordmark path found in ${source}.`)
  }

  return match[1]
}

/**
 * Builds a square icon: the wordmark centered on a full-bleed canvas, scaled
 * around the center. iOS and maskable icons crop their own corners, so they
 * get square edges.
 */
function squareIcon(wordmark: string, scale: number): string {
  const offset = 50 - 50 * scale

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${canvas}"/>
  <path transform="translate(${offset} ${offset}) scale(${scale})" d="${wordmark}" fill="#fff"/>
</svg>`
}

/** Builds the 1200x630 link preview: wordmark, tagline and a faded equity line. */
function openGraphImage(wordmark: string): string {
  // The wordmark spans x 15..85.5 and y 39.5..60.5 in its own units.
  const scale = 7
  const x = 96 - 15 * scale
  const y = 150 - 39.5 * scale
  const line =
    'M0 610 C 120 602, 180 584, 260 590 S 400 552, 480 566 S 620 534, 700 542 S 840 496, 920 510 S 1080 466, 1200 446'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0.10"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.35" stop-color="#fff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0.6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="${canvas}"/>
  <path d="${line} L 1200 630 L 0 630 Z" fill="url(#fill)"/>
  <path d="${line}" fill="none" stroke="url(#fade)" stroke-width="3"/>
  <path transform="translate(${x} ${y}) scale(${scale})" d="${wordmark}" fill="#fff"/>
  <text x="96" y="${150 + 21 * scale + 70}" fill="${muted}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="40" font-weight="500" letter-spacing="-0.5">${tagline}</text>
</svg>`
}

/** Rasterizes an SVG string to a PNG buffer at the given size. */
async function renderPng({
  height,
  svg,
  width,
}: RenderPngOptions): Promise<Buffer> {
  return sharp(Buffer.from(svg), { density: 600 })
    .resize(width, height)
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** Writes one PNG, creating its folder when needed. */
async function writePng(
  output: Output,
  width: number,
  height = width
): Promise<void> {
  await mkdir(dirname(output.path), { recursive: true })
  await writeFile(
    output.path,
    await renderPng({ height, svg: output.svg, width })
  )
  console.log(`wrote ${output.path.replace(root, '')}`)
}

/** Renders every brand asset for the landing site and the web app. */
async function main(): Promise<void> {
  const favicon = await readFile(source, 'utf8')
  const wordmark = readWordmark(favicon)
  const square = squareIcon(wordmark, 1)
  const maskable = squareIcon(wordmark, 0.8)
  const og = openGraphImage(wordmark)

  await copyFile(source, join(webApp, 'icon.svg'))
  console.log('wrote /apps/web/app/icon.svg')

  for (const directory of [landingPublic, webIcons]) {
    await writePng({ path: join(directory, 'icon-192.png'), svg: favicon }, 192)
    await writePng({ path: join(directory, 'icon-512.png'), svg: favicon }, 512)
    await writePng(
      { path: join(directory, 'icon-maskable-512.png'), svg: maskable },
      512
    )
  }

  await writePng(
    { path: join(landingPublic, 'apple-touch-icon.png'), svg: square },
    180
  )
  await writePng({ path: join(webApp, 'apple-icon.png'), svg: square }, 180)

  for (const path of [
    join(landingPublic, 'og-image.png'),
    join(webApp, 'opengraph-image.png'),
    join(webApp, 'twitter-image.png'),
  ]) {
    await writePng({ path, svg: og }, 1200, 630)
  }
}

await main()
