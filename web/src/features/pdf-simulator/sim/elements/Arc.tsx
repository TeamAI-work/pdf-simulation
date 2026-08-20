// web/src/features/pdf-simulator/sim/elements/Arc.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Arc: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const cx = Number(props.cx ?? props.x ?? 250)
  const cy = Number(props.cy ?? props.y ?? 150)
  const r = Number(props.r ?? props.radius ?? 50)
  const startAngle = Number(props.startAngle ?? 0)
  const endAngle = Number(props.endAngle ?? Math.PI)
  const stroke = props.stroke ?? '#a855f7'
  const strokeWidth = Number(props.strokeWidth ?? 2)
  const fill = props.fill ?? 'none'

  const x1 = cx + r * Math.cos(startAngle)
  const y1 = cy + r * Math.sin(startAngle)
  const x2 = cx + r * Math.cos(endAngle)
  const y2 = cy + r * Math.sin(endAngle)

  const diff = ((endAngle - startAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  const largeArcFlag = diff > Math.PI ? 1 : 0
  const sweepFlag = endAngle > startAngle ? 1 : 0

  const d = `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x2.toFixed(2)} ${y2.toFixed(2)}`

  return (
    <path
      id={element.id}
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={props.opacity ?? 1}
    />
  )
}
