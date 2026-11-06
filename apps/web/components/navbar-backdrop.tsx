const blurLayers = [
  'backdrop-blur-[1px] mask-b-from-60% mask-b-to-100%',
  'backdrop-blur-[3px] mask-b-from-40% mask-b-to-80%',
  'backdrop-blur-[8px] mask-b-from-20% mask-b-to-60%',
  'backdrop-blur-[16px] mask-b-from-0% mask-b-to-40%',
]

/**
 * Softens content scrolling under the floating navbar with a progressive
 * blur: stacked backdrop blurs that each fade out a little lower, under a
 * background tint that melts into the page, like an iOS top bar.
 */
export function NavbarBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-30 h-28"
    >
      <div className="absolute inset-0 [@media(prefers-reduced-transparency:reduce)]:hidden">
        {blurLayers.map((layer) => (
          <div className={`absolute inset-0 ${layer}`} key={layer} />
        ))}
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-background/85 via-background/50 to-transparent [@media(prefers-reduced-transparency:reduce)]:from-background [@media(prefers-reduced-transparency:reduce)]:via-background/90" />
    </div>
  )
}
