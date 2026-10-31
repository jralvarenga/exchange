# Design

> **Status:** target design, not implemented. The app still uses its previous UI; build new UI toward this document.

## Direction

Exchange is a personal trading desk on top of Alpaca: stocks, options and crypto, on paper or live money, for a single self-directed trader who checks it on a phone during the day and works on a desktop when placing trades.

The interface is **frosted glass over a slow aurora**. Dark ink is the default canvas, panels are translucent glass that blur a soft iridescent light behind them, numbers are large and quiet, and actions are white pills. It should feel calm and expensive, like a private banking app, never like a busy terminal. Density comes from clear grouping, not from small text.

## Signature

**The market aurora.** One iridescent mesh of light (violet, sky, peach, rose) lives behind the whole app and shows at full strength in exactly one place per screen: the hero panel (account equity on Overview, the price on the Trade screen, the order amount in the trade ticket).

Its intensity encodes the market clock, so it is information, not decoration: full saturation with a slow drift while the market is open, half saturation in pre-market and after hours, desaturated and still when closed.

The session is always also written as text in the market clock pill, never color alone. Everything else stays restrained: no other gradients, glows or illustrations.

## Colors

Tokens live in [globals.css](packages/ui/src/styles/globals.css) and are consumed through Tailwind (`bg-card`, `text-market-up`). Never write hex or raw `oklch` in components. Dark is the default theme; light must stay fully supported.

| Token | Dark | Light | Purpose |
| --- | --- | --- | --- |
| `background` | `oklch(0.13 0.012 275)` | `oklch(0.96 0.012 280)` | Ink canvas under the aurora |
| `foreground` | `oklch(0.97 0.005 275)` | `oklch(0.2 0.02 275)` | Text, solid buttons |
| `card` | `oklch(1 0 0 / 6%)` | `oklch(1 0 0 / 62%)` | Glass panel fill |
| `card-foreground` | `oklch(0.97 0.005 275)` | `oklch(0.2 0.02 275)` | Text on panels |
| `popover` | `oklch(0.2 0.015 275 / 82%)` | `oklch(1 0 0 / 85%)` | Floating glass: menus, sheets, dialogs |
| `primary` | `oklch(0.74 0.12 278)` | `oklch(0.52 0.17 278)` | Iris: selection, focus, highlighted data |
| `primary-foreground` | `oklch(0.16 0.03 278)` | `oklch(0.98 0 0)` | Text on iris |
| `success` | same as `primary` | same as `primary` | Filled orders, saved settings |
| `muted` | `oklch(1 0 0 / 5%)` | `oklch(0.2 0.02 275 / 5%)` | Inset fields and tiles inside a panel |
| `muted-foreground` | `oklch(0.72 0.01 275)` | `oklch(0.47 0.02 275)` | Labels, secondary text |
| `border` | `oklch(1 0 0 / 10%)` | `oklch(0.2 0.02 275 / 9%)` | Glass edge highlight, dividers |
| `input` | `oklch(1 0 0 / 7%)` | `oklch(0.2 0.02 275 / 6%)` | Field fill |
| `ring` | same as `primary` | same as `primary` | Focus ring |
| `warning` | `oklch(0.82 0.14 75)` | `oklch(0.66 0.15 70)` | Pending orders, PDT and margin notices |
| `danger` | `oklch(0.7 0.18 25)` | `oklch(0.56 0.2 25)` | Destructive actions, errors |
| `market-up` | `oklch(0.8 0.15 160)` | `oklch(0.55 0.14 160)` | Gains, buy side |
| `market-down` | `oklch(0.72 0.17 22)` | `oklch(0.56 0.2 25)` | Losses, sell side |
| `aurora-1..4` | violet `0.62 0.2 295`, sky `0.7 0.14 240`, peach `0.82 0.11 55`, rose `0.7 0.16 350` | same hues, lighter `L` + 0.1 | Aurora mesh only |
| `chart-1..5` | iris, sky, peach, mint, rose | darker for contrast | Categorical series, allocation |

- `destructive`, `secondary`, `accent` and the `sidebar-*` tokens alias the tokens above, so shadcn primitives inherit the system.
- Gains and losses always carry a sign and an arrow icon (`+2.92%` with `ArrowUpRight`), never color alone.
- Paper trading is never signalled by color alone: the environment pill reads "Paper" or "Live" and every order button names the environment.
- Borders are 1px glass edges at `border` opacity, nothing heavier.

## Typography

Fonts are loaded in [layout.tsx](apps/web/app/layout.tsx) with `next/font`.

| Role | Font | Use |
| --- | --- | --- |
| Display and body | Manrope (`--font-sans`, `--font-heading`) | Everything, including large numerals |
| Utility | Geist Mono (`--font-mono`) | Tickers, order IDs, contract symbols, API key masks |

| Style | Size / line height | Weight |
| --- | --- | --- |
| Hero number | 48/52 mobile, 64/68 desktop | 400 |
| Panel number | 28/34 | 400 |
| Title | 20/28 | 500 |
| Body | 16/24 | 400 |
| Label | 14/20 | 400, `muted-foreground` |
| Caption | 13/18 | 400, only chart axes and timestamps |

- Weights are 400, 500 and 700 only. Large numbers stay at 400; size carries the hierarchy.
- All numeric values use `tabular-nums` so columns and ticking prices don't jitter.
- Sentence case everywhere. No all caps, no wide tracking.
- Base size is 16px; 14px is the smallest text for anything a user reads to decide.

## Spacing and layout

- 4px base scale. Panel padding 20px mobile, 24px desktop. Gap between panels 12px mobile, 16px desktop. Page gutter 16px mobile, 24px desktop.
- Radius: panels 28px, tiles and fields inside panels 18px, buttons, chips, tabs and nav are full pills.
- Mobile first. Every screen is a single column of panels on mobile and becomes a 12-column grid at `md`.

### Surfaces

| Level | Surface | Treatment |
| --- | --- | --- |
| 0 | Canvas | `background` with a fixed, low-opacity aurora behind everything |
| 1 | Panel | `card` fill, `backdrop-blur-2xl`, 1px `border` edge, soft shadow |
| 2 | Tile, field | `muted` or `input` fill, no blur, no edge |
| 3 | Floating | `popover` fill, `backdrop-blur-3xl`: menus, sheets, dialogs, tab bar |

Never stack blur on blur: anything inside a panel uses level 2 fills.

### Shell: the trading desk

The layout is not based on the current sidebar app. It is a desk with three persistent layers, so every Alpaca action is one click away from any screen:

1. **Command bar** (top): pill navigation, search and account state.
2. **Canvas** (center) and **dock** (right): the screen's content next to an always-ready order ticket and watchlist.
3. **Blotter** (bottom): a tray with live positions, open orders and fills.

```text
Desktop ≥ 1280px
┌──────────────────────────────────────────────────────────────────────┐
│ ◆  (Overview)(Trade)(Portfolio)(Markets)(Activity)  ⌘K  ● Open  Paper▾ (JA) │
├────────────────────────────────────────────────┬─────────────────────┤
│ canvas                                         │ dock                │
│ ┌ hero aurora panel ─────────────────────────┐ │ (Ticket)(Watchlist) │
│ │ $10,120.50   +2.92% today                  │ │ AAPL  $231.87       │
│ └────────────────────────────────────────────┘ │ (Buy)(Sell)         │
│ ┌ panel ──────────────┐ ┌ panel ─────────────┐ │ Limit · Day         │
│ └─────────────────────┘ └────────────────────┘ │ [ Place paper order]│
├────────────────────────────────────────────────┴─────────────────────┤
│ Positions 4 · Open orders 2 · Fills today 7                       ▴  │
└──────────────────────────────────────────────────────────────────────┘

Mobile
┌───────────────────────┐
│ ◆   ● Open  Paper (JA)│
│ ┌ hero aurora ──────┐ │
│ └───────────────────┘ │
│ ( ◎  ◔  [+]  ⌁  ≡ )   │
└───────────────────────┘
```

- **Command bar:** a floating glass strip. The logo, then the five destinations as text pills (active pill is filled glass with a short iris glow line under it), then `⌘K` search, market clock pill, Paper/Live switch and account avatar. On tablet the pills scroll horizontally with hidden scrollbars.
- **Dock (≥ 1280px):** a 360px glass column with two tabs, Ticket and Watchlist. The ticket follows the symbol in context (the asset being viewed, a clicked position, a watchlist row). The dock collapses to a thin edge with a toggle, and hides on the Trade screen, where the ticket is inline.
- **Below 1280px:** the dock becomes a "Trade" solid pill in the command bar that opens the ticket as a right sheet (tablet) or a full-height drawer (mobile).
- **Blotter (≥ 768px):** starts collapsed and then remembers its last state; collapsed it is a single glass line with live counts; expanded it rises to 40% of the viewport with tabs for Positions, Open orders and Fills, and row actions to close, replace or cancel. On mobile the same tabs live on the Portfolio screen.
- **Command palette (`⌘K`, search icon on mobile):** searches assets, options contracts and crypto pairs, jumps to any screen, and runs account actions ("Cancel all orders", "Close all positions", "Switch to Live") behind the usual confirmation.
- **Mobile tab bar:** floating glass bar with Overview, Portfolio, Trade (center, solid), Markets and Activity. Account opens from the avatar.

### Screen map

| Screen | Alpaca coverage |
| --- | --- |
| Overview `/` | Equity, day P/L, buying power, cash, portfolio history chart with ranges, allocation, top movers among positions, market clock and next session, recent fills |
| Trade `/trade/[symbol]` | Bars chart with timeframes, latest quote and trade, snapshot, crypto order book, options chain tab, symbol news and corporate actions, current position, inline ticket |
| Portfolio | Positions (close one or all), orders by status (open, filled, canceled) with replace, cancel and cancel all, history chart |
| Markets | Watchlists (create, rename, edit symbols, delete), movers and most actives, news feed, market calendar, corporate action announcements |
| Activity | Account activities filtered by type and date, trade history |
| Account (avatar menu) | Status and restrictions (PDT, day trade count, trading blocked), configuration (DTBP check, shorting, fractional, trade confirmations, max margin, options level), Paper and Live environments with API keys, crypto funding and deposit addresses, theme |

### Order ticket

The ticket is the same component in the dock, the sheet, the drawer and the Trade screen:

- An aurora header with the symbol, live price and the order amount as the hero number.
- Buy/Sell segmented control (labelled, colored `market-up` and `market-down`), then quantity or notional.
- Order type pills: Market, Limit, Stop, Stop limit, Trailing stop. Fields appear only for the selected type.
- "Advanced" disclosure: bracket, OCO and OTO legs (take profit, stop loss), time in force, extended hours.
- Asset-class aware: options show contract, side and legs; crypto shows the pair and GTC/IOC only.
- A summary line with estimated cost and buying power after, then the solid submit pill naming side and environment ("Buy 10 AAPL · Paper").

## Components

Shared primitives live in [packages/ui/src/components](packages/ui/src/components); reuse and restyle them before creating anything new.

| Component | Variants and rules |
| --- | --- |
| `Button` | `solid` (foreground fill, the main action), `primary` (iris), `glass` (muted fill), `ghost`, `danger`; sizes `sm`, `default`, `lg`, `icon`. Always a pill |
| `Card` | The level 1 glass panel. `size="sm"` for tiles. `CardAction` holds round icon buttons, top right |
| `Tabs` | Segmented pill control: muted track, solid foreground thumb on the active item (Expenses/Income style) |
| `Input`, `Select`, `Textarea`, `Combobox` | Level 2 fills, 18px radius, label above, no outline until focus |
| `Dialog`, `Sheet`, `Drawer` | Level 3 surfaces. The ticket uses a right `Sheet` on tablet and a `Drawer` on mobile |
| `Table` / `DataTable` | No outer border, rows separated by spacing, header in `muted-foreground`, row hover in `muted` |
| `Chart` | Area chart with iris line and fading fill; bar chart with muted bars and the selected bar in iris; tooltip is a level 3 glass card |
| `Toast`, `Tooltip`, `Skeleton` | Level 3 glass; skeletons use `muted` with a soft shimmer |

New shared pieces to add: `Aurora` (the signature mesh, takes the market session), `Badge` (status and environment pills), `Stat` (label above a tabular number with an optional change chip), `ChangeChip` (sign, arrow, color), `Command` (the `⌘K` palette).

App-level pieces of the desk: command bar, dock, blotter, order ticket, market clock pill and environment switch. Each has one implementation that adapts by breakpoint; never fork a mobile copy.

## States

- **Loading:** skeletons shaped like the final content, inside the real panel, so nothing jumps. Buttons keep their width and show a spinner while pending.
- **Empty:** one sentence saying what is missing and one action to fix it, for example "No open positions. Place a trade" with a Trade button.
- **Error:** inside the panel that failed, with what happened and a retry. The rest of the screen keeps working.
- **Success:** toast that repeats the action name ("Order placed", "Order canceled").
- **Disabled:** 50% opacity, no pointer, and a tooltip or helper text explaining why (market closed, not enough buying power, options not enabled).
- **Permission and capability:** options, crypto, shorting and extended hours only appear when the account supports them; otherwise show a short note with a link to Account.
- **Destructive:** closing all positions, canceling all orders and switching to Live require a confirmation dialog that names the environment and the count affected.

## Motion

- Keep the existing enter animations: panels fade and rise 8px, staggered 40ms, 240ms ease-out.
- Aurora drifts on a 40s loop while the market is open and stops when closed.
- Price changes flash the number's text to `market-up` or `market-down` for 600ms, then return.
- Sheets and drawers slide 280ms; tabs move the thumb 200ms.
- `prefers-reduced-motion` disables the drift, the stagger and the flash.

## Accessibility

- Text contrast 4.5:1 on top of glass in both themes; check against the brightest point of the aurora, not the average.
- Visible 2px iris focus ring with offset on every interactive element.
- Touch targets at least 44px; icon buttons have an `aria-label`.
- Skip link to main content stays.
- Live prices update in a polite region only when the user focuses an asset, never on every tick.
- Glass falls back to a solid `background` mix when `backdrop-filter` is unsupported or `prefers-reduced-transparency` is set.

## Open questions

- Manrope is implemented as a proposal; confirm or swap it in `apps/web/app/layout.tsx`.
- Options use a single-expiry chain with single-leg orders; a multi-leg builder is not built yet.
