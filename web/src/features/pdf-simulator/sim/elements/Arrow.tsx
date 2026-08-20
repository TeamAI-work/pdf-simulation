// web/src/features/pdf-simulator/sim/elements/Arrow.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Arrow: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const x1 = Number(props.x1 ?? 0)
  const y1 = Number(props.y1 ?? 0)
  const x2 = Number(props.x2 ?? 0)
  const y2 = Number(props.y2 ?? 0)
  const color = props.stroke ?? props.fill ?? '#f59e0b'
  const strokeWidth = Number(props.strokeWidth ?? 2)
  const headSize = Number(props.headSize ?? 8)

  const angle = Math.atan2(y2 - y1, x2 - x1)
  const arrowAngle = Math.PI / 6

  const p1x = x2 - headSize * Math.cos(angle - arrowAngle)
  const p1y = y2 - headSize * Math.sin(angle - arrowAngle)
  const p2x = x2 - headSize * Math.cos(angle + arrowAngle)
  const p2y = y2 - headSize * Math.sin(angle + arrowAngle)

  return (
    <g id={element.id} opacity={props.opacity ?? 1}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <polygon
        points={`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`}
        fill={color}
      />
      {props.label && (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 8}
          fill={color}
          fontSize={12}
          textAnchor="middle"
        >
          {String(props.label)}
        </text>
      )}
    </g>
  )
}
