// web/src/features/pdf-simulator/sim/elements/Wave.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'

export const Wave: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const x1 = Number(props.x1 ?? 0)
  const y1 = Number(props.y1 ?? 150)
  const x2 = Number(props.x2 ?? 500)
  const amplitude = Number(props.amplitude ?? 30)
  const wavelength = Number(props.wavelength ?? 80)
  const phase = Number(props.phase ?? 0)
  const stroke = props.stroke ?? '#38bdf8'
  const strokeWidth = Number(props.strokeWidth ?? 2)

  const length = Math.max(10, x2 - x1)
  const steps = Math.min(100, Math.max(20, Math.round(length / 5)))
  const points: string[] = []

  for (let i = 0; i <= steps; i++) {
    const x = x1 + (i / steps) * length
    const y = y1 + amplitude * Math.sin(((2 * Math.PI) / wavelength) * (x - x1) + phase)
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  return (
    <path
      id={element.id}
      d={points.join(' ')}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      opacity={props.opacity ?? 1}
    />
  )
}
