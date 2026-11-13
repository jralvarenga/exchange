# Design

The portfolio home (`/`) is the reference implementation. When in doubt, match it: [page.tsx](apps/web/app/(dashboard)/page.tsx), [components/balance](apps/web/components/balance), [components/home](apps/web/components/home).

## Direction

Exchange is a personal trading desk on Alpaca for one self-directed trader, checked on a phone during the day and used on a desktop to trade.

The interface is **open and editorial**: content sits directly on the page background, not inside cards. Numbers are the hero, large, bold and calm. Structure comes from typography, spacing and hairline dividers, never from boxes, heavy borders or color fills. It should feel quiet and expensive, closer to a private banking app than a terminal.

## Signature

**The live balance over a full-bleed equity line.** The current balance is the largest thing on screen, morphs digit by digit when it refreshes, and sits over an edge-to-edge area chart whose fill and edges melt into the background.

- Only one full-bleed chart per screen. Everything else stays restrained.
- The chart line takes `market-up` or `market-down` from the period's direction, the last point pulses.
- Numbers that update live use Torph (`TextMorph` from `torph/react`) so changes read as motion, not flicker.

## Colors

Tokens live in [globals.css](packages/ui/src/styles/globals.css) and are used through Tailwind (`text-market-up`, `bg-muted`). Never write hex or raw `oklch` in components.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| `background` | `oklch(1 0 0)` | `oklch(0.147 0.004 49.25)` | Page canvas, everything sits on it |
| `foreground` | `oklch(0.147 0.004 49.25)` | `oklch(0.985 0.001 106.423)` | Text, numbers, active pills |
| `muted` | `oklch(0.97 0.001 106.424)` | `oklch(0.268 0.007 34.298)` | Hover rows, selected ghost pills, skeletons, tags |
| `muted-foreground` | `oklch(0.553 0.013 58.071)` | `oklch(0.709 0.01 56.259)` | Labels, currency symbol, secondary lines |
| `border` | `oklch(0.923 0.003 48.717)` | `oklch(1 0 0 / 10%)` | Hairline dividers only |
| `primary` | `oklch(0.496 0.265 301.924)` | `oklch(0.438 0.218 303.724)` | Brand violet: the Buy / Sell action |
| `market-up` | `oklch(0.51 0.14 160)` | `oklch(0.74 0.18 155)` | Gains, buy side, filled orders, rising chart |
| `market-down` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Losses, sell side, falling chart |
| `warning` | `oklch(0.54 0.15 70)` | `oklch(0.82 0.14 75)` | Open and pending orders |
| `danger` / `destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Destructive actions, errors |
| `popover` | same as `card` | same as `card` | Floating surfaces, tooltips, dialogs |

- Gains and losses always carry a sign and an arrow (`ArrowUpRight` / `ArrowDownRight`), never color alone.
- Status pills tint with the tone at 10% (`bg-market-up/10 text-market-up`) and always include the status word.
- Gradients are allowed only to fade something into `background` (the chart fill, its edges, the navbar backdrop and the mobile tab bar) and as the sheen inside the `elevation-*` utilities.
- The one color not taken from a token is the Trade hero glow: [use-asset-tint.ts](apps/web/hooks/use-asset-tint.ts) samples the asset logo's dominant color at runtime into `--asset-tint`, shown at 12% behind a blur. Logos with no color fall back to `primary`.

## Typography

Fonts are loaded in [layout.tsx](apps/web/app/layout.tsx) with `next/font`.

| Role | Font | Use |
| --- | --- | --- |
| Display and body | Geist (`--font-sans`) | Everything, including large numbers |
| Utility | Geist Mono (`--font-mono`) | Timestamps, IDs, key masks |

| Style | Classes | Example |
| --- | --- | --- |
| Hero number | `text-6xl md:text-8xl font-bold tracking-tighter` | Account balance |
| Hero symbol | `text-3xl md:text-5xl font-medium text-muted-foreground` | `$` before the balance |
| Hero change | `text-2xl md:text-4xl font-medium tracking-tight` | `-5.19%` beside the balance |
| Stat number | `text-3xl font-bold tracking-tight` | Buying power, cash |
| Section title | `text-2xl font-bold tracking-tight` | "Top positions" |
| Row primary | `text-lg font-bold` | Symbol, market value |
| Body | `text-base` (16px) | Secondary lines, labels in `muted-foreground` |

- Weights: regular, `font-medium` and `font-bold` only.
- Every number uses `tabular-nums`.
- Sentence case everywhere. No all caps, no wide tracking.
- Avoid text below 16px in primary UI text; the default `Button` size and compact chart tooltips (`text-xs` on the shared chart primitive) are the exceptions.

## Elevation

Interactive primitives feel like physical controls: a soft, raised bubble you press, or a recessed well you type into. Content (lists, stats, headings) stays flat on the page; only controls get elevation.

The utilities live in [globals.css](packages/ui/src/styles/globals.css) and read the `--elevation-*` tokens, which are tuned per theme. Raised and pressed also paint a sheen with `background-image`. Each utility writes `--tw-shadow` and an explicit `box-shadow` that includes Tailwind's ring variables, so focus and invalid rings still stack on top.

| Utility | Look | Used by |
| --- | --- | --- |
| `elevation-raised` | Top sheen and inner highlight, darker inner bottom edge, faint 1px inner edge (never an outer border), soft drop shadow | `Button` (all variants but `ghost` and `link`), pressed `ghost` toggles, `SelectTrigger`, checked `Checkbox`, `Switch` thumb, active default `TabsTrigger` (line tabs stay flat) |
| `elevation-pressed` | Sheen flips, inner shadow, no drop | Press of every raised control (`:active`; Base UI `data-pressed` on `SelectTrigger`) |
| `elevation-well` | Inner top shadow and a lit bottom lip. Fill is set by the control, not the utility | `Input`, `Textarea`, `InputGroup`, unchecked `Checkbox` (`bg-muted/50`), `Switch` track (`bg-input` / `bg-primary`), default `TabsList` (`bg-muted`) |

- Never stack elevation on content containers or rows; it marks something you can operate.
- New interactive primitives pick one of the three utilities instead of a `shadow-*` class.

## Spacing and layout

- Mobile first, single column. Page gutter is 16px mobile, 24px from `sm` (`px-4 sm:px-6`, set by the shell).
- On `md+` the floating sidebar overlays the left edge, so page content is offset with `md:pl-24`. Full-bleed elements (the hero chart) cancel the gutter with `-mx-4 sm:-mx-6` and run under the sidebar.
- Section rhythm: `gap-10` after the hero, `gap-14` between sections, `gap-4` from a section header to its content.
- Two sections side by side only from `xl` (`xl:grid-cols-2 xl:gap-16`).
- Lists bleed their hover state into the gutter with `-mx-3 px-3 rounded-2xl` so text stays aligned with headings.
- Stats strips are a `dl` grid with `border-y` and `divide-x` (`divide-y` on mobile), no fills.

### Shell

- **Sidebar:** floating vertical pill rail, `surface-floating`, centered on the left from `md`. Active item is `bg-foreground text-background`.
- **Navbar:** floating, transparent, search on the left, Buy / Sell and avatar on the right. A progressive blur backdrop ([navbar-backdrop.tsx](apps/web/components/navbar-backdrop.tsx)) softens content scrolling under it, iOS top bar style.
- **Mobile tab bar:** floating pill on a bottom fade to `background`.

## Components

Shared primitives live in [packages/ui/src/components](packages/ui/src/components); app-level shared pieces in [apps/web/components](apps/web/components). Reuse them before creating anything new.

| Component | Use |
| --- | --- |
| `Button` | Prefer existing variants (`default`, `outline`, `secondary`, `ghost`, `destructive`, `link`). Toggle groups use `ghost` |
| `Switch` | Binary settings: recessed track, raised thumb |
| `PillGroup` | Single-choice filters (chart period, asset class, order status): default-size `ghost` buttons, the active one `aria-pressed` and `secondary` (a raised bubble), no size or color overrides |
| `SectionHeader` | Section title with an optional "View all →" link and controls below |
| `Chart` (`ChartContainer`) | Recharts wrapper; area charts have no axes, a fading gradient fill and a dashed `border` cursor |
| `Skeleton` | `bg-muted` pulse, sized like the content it replaces |
| `AssetIcon` | Round asset logo with a two-letter fallback |
| `AssetListFallback` | Row skeleton for any logo + two lines + two figures list |
| `Dialog` | Confirmations: `rounded-[2rem] bg-background p-6`, bold `text-xl` title as a question, ghost "Keep" and `destructive` confirm pills |
| `ConfirmDialog` | The `Dialog` confirmation pattern as one component; use it for every "are you sure" (remove a connection, leave a workspace, trade live) |
| `UserAvatar` | Round profile photo, or initials when there is none |
| `Card` | Only where content must be grouped off the page (forms, settings). Not on the home screen |

Row patterns:

- **Position row:** logo · symbol (+ `Crypto` / `Short` tag) and `qty × price` · value and return. A thin allocation bar with its percentage runs underneath.
- **Order row:** logo · symbol and `Buy · type · time` · size and status pill, plus a round ghost `×` to cancel open orders. The symbol is a stretched link so the row stays clickable next to the button.

## States

- **Loading:** every skeleton mirrors the final layout: real labels stay visible at half opacity, blocks match the size of the numbers, list skeletons fade out row by row. The chart loads as a faint pulsing ghost curve with the same fill and edge fade.
- **Reveal:** content replaces its skeleton with `revealClassName` from [lib/utils.ts](apps/web/lib/utils.ts) (fade, blur and 8px rise, 700ms), staggered with `delay-75`…`delay-200` and `fill-mode-both`.
- **Empty:** icon, one sentence saying what is missing, one sentence on what to do. Distinguish "none yet" from "none match this filter".
- **Error:** a short `muted-foreground` line inside the failed section ("Orders unavailable"); the rest of the page keeps working.
- **Success / failure of actions:** toast naming the action ("Order canceled").
- **Destructive:** always a confirmation dialog phrased as a question naming the asset and side.
- **Live data:** balances refresh every 3 minutes and morph in place; open order status dots pulse.

## Motion

- Ease for everything that settles: `cubic-bezier(0.19, 1, 0.22, 1)`.
- Number changes: Torph morph, 700ms (500ms for timestamps).
- Live prices on the Trade screen also flash `market-up` or `market-down` for 600ms when they tick ([use-price-flash.ts](apps/web/hooks/use-price-flash.ts)); reduced motion turns the flash off.
- Chart: fades in from a blur over 1s while Recharts draws the line; allocation bars slide in from the left.
- Hover: color and background transitions only; arrows nudge 2px.
- `prefers-reduced-motion` disables reveals, pulses and slides; Torph respects it itself.

## Accessibility

- Contrast 4.5:1 for text in both themes; `muted-foreground` is the floor.
- Visible `focus-visible:ring-3 ring-ring` on every interactive element; rows show the ring when their link is focused.
- Icon-only buttons have an `aria-label` naming the target ("Cancel NFLX buy order").
- Toggle filters are `fieldset` + `legend` with `aria-pressed` buttons.
- Live figures sit in an `aria-live="polite"` region; skeletons are `role="status"` with an `sr-only` label.
- `prefers-reduced-transparency` replaces the navbar blur with a solid fade.

## Open questions

- `success` is still neutral black / white instead of matching a brand or `market-up` color.
- Default `Button` height (32px) is under the 44px touch target; pills use it as is.
- `/portfolio` still uses the previous card and table design and should move to this system.
