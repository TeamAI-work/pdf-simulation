// web/src/features/pdf-simulator/sim/elements/Spring.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Spring: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const x1 = Number(props.x1 ?? 50)
  const y1 = Number(props.y1 ?? 150)
  const x2 = Number(props.x2 ?? 250)
  const y2 = Number(props.y2 ?? 150)
  const coils = Math.max(3, Math.min(20, Number(props.coils ?? 8)))
  const radius = Number(props.radius ?? props.r ?? 15)
  const stroke = props.stroke ?? '#94a3b8'
  const strokeWidth = Number(props.strokeWidth ?? 2)

  const dx = x2 - x1
  const dy = y2 - y1
  const length = Math.hypot(dx, dy)
  const angle = Math.atan2(dy, dx)

  const points: string[] = [`M ${x1} ${y1}`]
  const lead = 15 // straight lead-in/out
  const activeLength = Math.max(10, length - 2 * lead)
  const step = activeLength / (coils * 2)

  for (let i = 0; i <= coils * 2; i++) {
    const along = lead + i * step
    const perp = i === 0 || i === coils * 2 ? 0 : (i % 2 === 1 ? 1 : -1) * radius

    const px = x1 + Math.cos(angle) * along - Math.sin(angle) * perp
    const py = y1 + Math.sin(angle) * along + Math.cos(angle) * perp
    points.push(`L ${px.toFixed(2)} ${py.toFixed(2)}`)
  }

  points.push(`L ${x2} ${y2}`)

  return (
    <path
      id={element.id}
      d={points.join(' ')}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={props.opacity ?? 1}
    />
  )
}
