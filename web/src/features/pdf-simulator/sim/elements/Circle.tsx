// web/src/features/pdf-simulator/sim/elements/Circle.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Circle: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  return (
    <circle
      id={element.id}
      cx={props.cx ?? props.x ?? 0}
      cy={props.cy ?? props.y ?? 0}
      r={props.r ?? props.radius ?? 5}
      fill={props.fill ?? '#38bdf8'}
      stroke={props.stroke ?? 'none'}
      strokeWidth={props.strokeWidth ?? 1}
      opacity={props.opacity ?? 1}
    />
  )
}
