import type { BarShapeProps } from 'recharts'

import type { AssetBar } from '@/lib/alpaca/schemas'

interface CandlestickPayload extends AssetBar {
  range: [number, number]
}

/** Draws an OHLC wick and body within a Recharts range bar. */
export function CandlestickShape(props: BarShapeProps) {
  const payload = props.payload as CandlestickPayload | undefined

  if (!payload || props.width <= 0 || props.height < 0) {
    return null
  }

  const range = payload.high - payload.low
  const centerX = props.x + props.width / 2
  const openY =
    range === 0
      ? props.y + props.height / 2
      : props.y + ((payload.high - payload.open) / range) * props.height
  const closeY =
    range === 0
      ? props.y + props.height / 2
      : props.y + ((payload.high - payload.close) / range) * props.height
  const bodyY = Math.min(openY, closeY)
  const bodyHeight = Math.max(Math.abs(closeY - openY), 2)
  const bodyWidth = Math.max(Math.min(props.width * 0.66, 12), 2)
  const bodyX = centerX - bodyWidth / 2
  const isRising = payload.close >= payload.open
  const color = isRising ? 'var(--market-up)' : 'var(--market-down)'

  return (
    <g>
      <line
        stroke={color}
        strokeWidth={1.25}
        x1={centerX}
        x2={centerX}
        y1={props.y}
        y2={props.y + props.height}
      />
      <rect
        fill={isRising ? color : 'var(--card)'}
        height={bodyHeight}
        rx={1}
        stroke={color}
        strokeWidth={1.25}
        width={bodyWidth}
        x={bodyX}
        y={bodyY}
      />
    </g>
  )
}
