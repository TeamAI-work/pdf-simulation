// web/src/features/pdf-simulator/sim/elements/Rect.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Rect: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  return (
    <rect
      id={element.id}
      x={props.x ?? 0}
      y={props.y ?? 0}
      width={Math.max(0, props.width ?? props.w ?? 0)}
      height={Math.max(0, props.height ?? props.h ?? 0)}
      rx={props.rx ?? props.borderRadius ?? 0}
      ry={props.ry ?? props.borderRadius ?? 0}
      fill={props.fill ?? '#94a3b8'}
      stroke={props.stroke ?? 'none'}
      strokeWidth={props.strokeWidth ?? 1}
      opacity={props.opacity ?? 1}
      transform={props.transform ?? undefined}
    />
  )
}
