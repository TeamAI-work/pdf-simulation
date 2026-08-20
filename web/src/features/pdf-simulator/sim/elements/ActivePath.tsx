// web/src/features/pdf-simulator/sim/elements/ActivePath.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export interface Point {
  x: number
  y: number
}

export const ActivePath: React.FC<{
  element: ResolvedElement
  historyPoints?: Point[]
}> = ({ element, historyPoints = [] }) => {
  const { props } = element
  const points = (props.points as Point[]) || historyPoints

  if (!points || points.length === 0) {
    return null
  }

  const d = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ')

  return (
    <path
      id={element.id}
      d={d}
      fill="none"
      stroke={props.stroke ?? '#38bdf8'}
      strokeWidth={props.strokeWidth ?? 2}
      strokeDasharray={props.strokeDasharray ?? '4 4'}
      strokeLinecap="round"
      opacity={props.opacity ?? 0.7}
    />
  )
}
