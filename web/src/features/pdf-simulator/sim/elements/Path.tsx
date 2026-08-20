// web/src/features/pdf-simulator/sim/elements/Path.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Path: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  return (
    <path
      id={element.id}
      d={props.d ?? ''}
      fill={props.fill ?? 'none'}
      stroke={props.stroke ?? '#94a3b8'}
      strokeWidth={props.strokeWidth ?? 2}
      strokeDasharray={props.strokeDasharray ?? 'none'}
      strokeLinecap={props.strokeLinecap ?? 'round'}
      strokeLinejoin={props.strokeLinejoin ?? 'round'}
      opacity={props.opacity ?? 1}
    />
  )
}
