// web/src/features/pdf-simulator/sim/elements/Text.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Text: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const displayText = element.text !== undefined ? String(element.text) : (props.text ?? '')

  return (
    <text
      id={element.id}
      x={props.x ?? 0}
      y={props.y ?? 0}
      fill={props.fill ?? props.color ?? '#f8fafc'}
      fontSize={props.fontSize ?? 14}
      fontWeight={props.fontWeight ?? 'normal'}
      fontFamily={props.fontFamily ?? 'Inter, sans-serif'}
      textAnchor={props.textAnchor ?? 'start'}
      dominantBaseline={props.dominantBaseline ?? 'auto'}
      opacity={props.opacity ?? 1}
    >
      {displayText}
    </text>
  )
}
