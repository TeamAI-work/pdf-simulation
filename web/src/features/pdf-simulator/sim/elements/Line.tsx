// web/src/features/pdf-simulator/sim/elements/Line.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Line: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  return (
    <line
      id={element.id}
      x1={props.x1 ?? 0}
      y1={props.y1 ?? 0}
      x2={props.x2 ?? 0}
      y2={props.y2 ?? 0}
      stroke={props.stroke ?? '#cbd5e1'}
      strokeWidth={props.strokeWidth ?? 2}
      strokeDasharray={props.strokeDasharray ?? 'none'}
      strokeLinecap={props.strokeLinecap ?? 'round'}
      opacity={props.opacity ?? 1}
    />
  )
}
