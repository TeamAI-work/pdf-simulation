// web/src/features/pdf-simulator/sim/elements/Particles.tsx
import React, { useMemo } from 'react'
import type { ResolvedElement } from '../evalSpec.js'

// Deterministic pseudo-random sequence for stable particle offsets
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

export const Particles: React.FC<{ element: ResolvedElement }> = ({ element }) => {
  const { props } = element
  const count = Math.min(20, Math.max(1, Number(props.count ?? 12))) // Cap at 20 for KP-8
  const cx = Number(props.cx ?? props.x ?? 250)
  const cy = Number(props.cy ?? props.y ?? 150)
  const width = Number(props.width ?? 200)
  const height = Number(props.height ?? 120)
  const speed = Number(props.speed ?? 1)
  const radius = Number(props.r ?? props.radius ?? 4)
  const fill = props.fill ?? '#ec4899'
  const time = Number(props.time ?? 0)

  // Pre-compute stable base offsets for up to 20 particles
  const particleConfigs = useMemo(() => {
    const configs = []
    for (let i = 0; i < 20; i++) {
      configs.push({
        baseX: seededRandom(i * 13 + 1) * width - width / 2,
        baseY: seededRandom(i * 17 + 2) * height - height / 2,
        freqX: 1 + seededRandom(i * 19 + 3) * 2,
        freqY: 1 + seededRandom(i * 23 + 4) * 2,
        ampX: 10 + seededRandom(i * 29 + 5) * 15,
        ampY: 10 + seededRandom(i * 31 + 6) * 15,
        phase: seededRandom(i * 37 + 7) * Math.PI * 2,
      })
    }
    return configs
  }, [width, height])

  return (
    <g id={element.id} opacity={props.opacity ?? 1}>
      {particleConfigs.slice(0, count).map((cfg, idx) => {
        const px = cx + cfg.baseX + Math.sin(time * speed * cfg.freqX + cfg.phase) * cfg.ampX
        const py = cy + cfg.baseY + Math.cos(time * speed * cfg.freqY + cfg.phase) * cfg.ampY

        return (
          <circle
            key={idx}
            cx={px}
            cy={py}
            r={radius}
            fill={fill}
            opacity={0.85}
          />
        )
      })}
    </g>
  )
}
