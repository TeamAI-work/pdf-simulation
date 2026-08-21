// web/src/features/pdf-simulator/sim/elements/Text.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

const DARK_ON_LIGHT = new Set(['#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b'])

function lightTextFill(fill: unknown): string {
  const raw = String(fill ?? '#334155').toLowerCase()
  if (DARK_ON_LIGHT.has(raw)) return '#334155'
  return String(fill ?? '#334155')
}

export const Text: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const displayText = element.text !== undefined ? String(element.text) : (props.text ?? '')

  return (
    <text
      id={element.id}
      x={props.x ?? 0}
      y={props.y ?? 0}
      fill={lightTextFill(props.fill ?? props.color)}
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
