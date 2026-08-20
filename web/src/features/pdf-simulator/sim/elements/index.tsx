// web/src/features/pdf-simulator/sim/elements/index.tsx
import React from 'react'
import type { ResolvedElement } from '../evalSpec.js'
import { Circle } from './Circle.js'
import { Rect } from './Rect.js'
import { Line } from './Line.js'
import { Path } from './Path.js'
import { Text } from './Text.js'
import { Arrow } from './Arrow.js'
import { Wave } from './Wave.js'
import { Particles } from './Particles.js'
import { Spring } from './Spring.js'
import { Arc } from './Arc.js'
import { ActivePath, type Point } from './ActivePath.js'

export const ElementRenderer: React.FC<{
  element: ResolvedElement
  historyPoints?: Point[]
}> = ({ element, historyPoints }) => {
  switch (element.type) {
    case 'circle':
      return <Circle element={element} />
    case 'rect':
      return <Rect element={element} />
    case 'line':
      return <Line element={element} />
    case 'path':
      return <Path element={element} />
    case 'text':
      return <Text element={element} />
    case 'arrow':
      return <Arrow element={element} />
    case 'wave':
      return <Wave element={element} />
    case 'particles':
      return <Particles element={element} />
    case 'spring':
      return <Spring element={element} />
    case 'arc':
      return <Arc element={element} />
    case 'active-path':
      return <ActivePath element={element} historyPoints={historyPoints} />
    default:
      return null
  }
}

export * from './Circle.js'
export * from './Rect.js'
export * from './Line.js'
export * from './Path.js'
export * from './Text.js'
export * from './Arrow.js'
export * from './Wave.js'
export * from './Particles.js'
export * from './Spring.js'
export * from './Arc.js'
export * from './ActivePath.js'
