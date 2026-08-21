import { z } from 'zod'
import { thinPrismDeviation } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

type Pt = { x: number; y: number }

function hypot(p: Pt): number {
  return Math.hypot(p.x, p.y) || 1
}

function add(a: Pt, b: Pt, s = 1): Pt {
  return { x: a.x + s * b.x, y: a.y + s * b.y }
}

function unit(p: Pt): Pt {
  const L = hypot(p)
  return { x: p.x / L, y: p.y / L }
}

function scale(p: Pt, s: number): Pt {
  return { x: p.x * s, y: p.y * s }
}

function rot(d: Pt, deg: number): Pt {
  const t = (deg * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  return { x: d.x * c - d.y * s, y: d.x * s + d.y * c }
}

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

function snellRefract(I: Pt, N: Pt, n1: number, n2: number): Pt | null {
  let nx = N.x
  let ny = N.y
  let c = -(nx * I.x + ny * I.y)
  if (c < 0) {
    nx = -nx
    ny = -ny
    c = -c
  }
  const eta = n1 / n2
  const k = 1 - eta * eta * (1 - c * c)
  if (k < 0) return null
  const f = eta * c - Math.sqrt(k)
  return unit({ x: eta * I.x + f * nx, y: eta * I.y + f * ny })
}

const SPECTRUM = [
  { id: 'V', fill: '#6d28d9' },
  { id: 'I', fill: '#4338ca' },
  { id: 'B', fill: '#2563eb' },
  { id: 'G', fill: '#16a34a' },
  { id: 'Y', fill: '#ca8a04' },
  { id: 'O', fill: '#ea580c' },
  { id: 'R', fill: '#dc2626' },
] as const

export const prism: SimFile = {
  id: 'prism',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Thin prism',
  description: 'White light refracts at both faces; the second face splits it into seven colours. δ = (μ − 1)A',
  equations: ['\\delta = (\\mu - 1)A'],
  keywords: ['prism', 'angle of deviation', 'refractive index prism', 'thin prism', 'dispersion prism'],
  params: [
    param('A', 'Prism angle A', 'deg', 1, 20, 0.5, 6),
    param('mu', 'μ', '', 1.1, 2.2, 0.01, 1.5),
  ],
  schema: z.object({
    A: num(0.2, 40, 6),
    mu: num(1.01, 3, 1.5),
  }),
  run(params) {
    const { A, mu } = params
    const delta = thinPrismDeviation(A, mu)
    const ink = '#334155'
    const Ad = 60
    const half = ((Ad / 2) * Math.PI) / 180
    const side = 210
    const Q: Pt = { x: 248, y: 42 }
    const Lpt: Pt = { x: Q.x - side * Math.sin(half), y: Q.y + side * Math.cos(half) }
    const Rpt: Pt = { x: Q.x + side * Math.sin(half), y: Q.y + side * Math.cos(half) }
    const tHit = 0.4
    const P1 = lerp(Q, Lpt, tHit)
    const P2 = lerp(Q, Rpt, tHit)
    const N2 = unit({ x: Math.cos(half), y: -Math.sin(half) })
    const N_in = unit({ x: Math.cos(half), y: Math.sin(half) })
    const S: Pt = { x: Math.sin(half), y: -Math.cos(half) }
    const sinI = Math.min(0.96, mu * Math.sin(half))
    const iAng = Math.asin(sinI)
    const rAng = Math.asin(Math.min(0.96, sinI / mu))
    const Iin = unit(add(scale(N_in, Math.cos(iAng)), S, Math.sin(iAng)))
    const inside = unit(add(scale(N_in, Math.cos(rAng)), S, Math.sin(rAng)))
    const faceOut = unit({ x: Rpt.x - Q.x, y: Rpt.y - Q.y })
    const meanOut = snellRefract(inside, N2, mu, 1) ?? faceOut
    const fan = 12 + 0.4 * A + 6 * (mu - 1)
    const outLen = 150
    const inLen = Math.min(170, Math.max(40, (P1.x - 18) / Math.max(Iin.x, 0.25)))
    const inStart = add(P1, Iin, -inLen)
    const elements = [
      label('d', 24, 22, `δ = (μ−1)A = ${delta.toFixed(2)}°`),
      pathEl('prism', {
        d: `M ${Q.x.toFixed(1)} ${Q.y.toFixed(1)} L ${Lpt.x.toFixed(1)} ${Lpt.y.toFixed(1)} L ${Rpt.x.toFixed(1)} ${Rpt.y.toFixed(1)} Z`,
        fill: '#e2e8f0',
        stroke: ink,
        strokeWidth: 2,
      }),
      line('in', { x1: inStart.x, y1: inStart.y, x2: P1.x, y2: P1.y, stroke: ink, strokeWidth: 2 }),
      line('inside', { x1: P1.x, y1: P1.y, x2: P2.x, y2: P2.y, stroke: ink, strokeWidth: 2 }),
    ]
    SPECTRUM.forEach((col, i) => {
      const t = i / (SPECTRUM.length - 1)
      const ang = (0.5 - t) * fan
      const D = rot(meanOut, ang)
      const end = add(P2, D, outLen)
      elements.push(
        line(`out-${i}`, {
          x1: P2.x,
          y1: P2.y,
          x2: end.x,
          y2: end.y,
          stroke: col.fill,
          strokeWidth: 2,
        })
      )
    })
    const vEnd = add(P2, rot(meanOut, 0.5 * fan), outLen + 8)
    const rEnd = add(P2, rot(meanOut, -0.5 * fan), outLen + 8)
    elements.push(
      circle('p1', { cx: P1.x, cy: P1.y, r: 3.5, fill: ink }),
      circle('p2', { cx: P2.x, cy: P2.y, r: 3.5, fill: ink }),
      label('nV', vEnd.x - 4, vEnd.y + 4, 'V', SPECTRUM[0].fill),
      label('nR', rEnd.x - 4, rEnd.y + 4, 'R', SPECTRUM[6].fill)
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { A, mu, delta: Number(delta.toFixed(4)) },
      warnings: [],
    }
  },
}
