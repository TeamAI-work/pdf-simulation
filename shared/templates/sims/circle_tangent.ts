import { z } from 'zod'
import { tangentLength } from '../math.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

type Pt = { x: number; y: number }

function mathHeading(from: Pt, to: Pt): number {
  return (Math.atan2(-(to.y - from.y), to.x - from.x) * 180) / Math.PI
}

function rightMark(ox: number, oy: number, d1: number, d2: number, m: number): string {
  const r1x = Math.cos((d1 * Math.PI) / 180)
  const r1y = Math.sin((d1 * Math.PI) / 180)
  const r2x = Math.cos((d2 * Math.PI) / 180)
  const r2y = Math.sin((d2 * Math.PI) / 180)
  return `M ${(ox + m * r1x).toFixed(1)} ${(oy - m * r1y).toFixed(1)} L ${(ox + m * r1x + m * r2x).toFixed(1)} ${(oy - m * r1y - m * r2y).toFixed(1)} L ${(ox + m * r2x).toFixed(1)} ${(oy - m * r2y).toFixed(1)}`
}

function fmt(x: number): string {
  const r = Math.round(x * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

export const circle_tangent: SimFile = {
  id: 'circle_tangent',
  domain: 'math',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Tangent from a point',
  description: 'Two tangents from an external point are equal; radius is perpendicular to the tangent',
  equations: ['\\ell = \\sqrt{d^2 - r^2}', 'PA = PB'],
  keywords: ['tangent to a circle', 'from a point', 'tangent length', 'two tangents'],
  params: [
    param('r', 'Radius r', '', 1, 8, 0.1, 3),
    param('d', 'Distance d', '', 2, 14, 0.1, 5),
  ],
  schema: z.object({
    r: num(0.5, 20, 3),
    d: num(0.5, 40, 5),
  }),
  run(params) {
    const { r, d } = params
    const { length, real } = tangentLength(r, d)
    const warnings = real ? [] : ['Point is inside the circle: no real tangent']
    const s = Math.min(410 / Math.max(r + Math.max(d, r), 0.4), 210 / Math.max(2 * r, 0.4))
    const R = r * s
    const O = { x: 40 + R, y: 52 + R }
    const P = { x: O.x + d * s, y: O.y }
    const ink = '#334155'
    const elements = [
      label('eq', 24, 22, real ? `ℓ = √(d² − r²) = ${fmt(length)}` : 'no tangent (d < r)'),
      circle('circ', { cx: O.x, cy: O.y, r: R, fill: 'none', stroke: ink, strokeWidth: 2 }),
      circle('O', { cx: O.x, cy: O.y, r: 3, fill: ink }),
      circle('P', { cx: P.x, cy: P.y, r: 3.5, fill: ink }),
      line('op', {
        x1: O.x,
        y1: O.y,
        x2: P.x,
        y2: P.y,
        stroke: ink,
        strokeWidth: 1,
        strokeDasharray: '5 4',
      }),
      label('nO', O.x - 14, O.y + 4, 'O', ink),
      label('nP', P.x + 8, P.y - 8, 'P', ink),
    ]

    if (real && length > 0.04) {
      const th = Math.acos(Math.min(1, r / d))
      const A = { x: O.x + R * Math.cos(th), y: O.y - R * Math.sin(th) }
      const B = { x: O.x + R * Math.cos(th), y: O.y + R * Math.sin(th) }
      const mark = Math.min(11, 0.18 * R, 0.16 * length * s)
      elements.push(
        line('oa', { x1: O.x, y1: O.y, x2: A.x, y2: A.y, stroke: ink, strokeWidth: 1.5 }),
        line('ob', { x1: O.x, y1: O.y, x2: B.x, y2: B.y, stroke: ink, strokeWidth: 1.5 }),
        line('pa', { x1: P.x, y1: P.y, x2: A.x, y2: A.y, stroke: ink, strokeWidth: 2 }),
        line('pb', { x1: P.x, y1: P.y, x2: B.x, y2: B.y, stroke: ink, strokeWidth: 2 }),
        pathEl('sqA', { d: rightMark(A.x, A.y, mathHeading(A, O), mathHeading(A, P), mark), fill: 'none', stroke: ink, strokeWidth: 1.25 }),
        pathEl('sqB', { d: rightMark(B.x, B.y, mathHeading(B, O), mathHeading(B, P), mark), fill: 'none', stroke: ink, strokeWidth: 1.25 }),
        circle('A', { cx: A.x, cy: A.y, r: 3, fill: ink }),
        circle('B', { cx: B.x, cy: B.y, r: 3, fill: ink }),
        label('lA', (P.x + A.x) / 2 + 6, (P.y + A.y) / 2 - 4, 'ℓ', ink)
      )
    } else if (real) {
      const A = { x: O.x + R, y: O.y }
      const tanLen = Math.max(40, 0.8 * R)
      elements.push(
        line('oa', { x1: O.x, y1: O.y, x2: A.x, y2: A.y, stroke: ink, strokeWidth: 1.5 }),
        line('pa', { x1: A.x, y1: A.y - tanLen, x2: A.x, y2: A.y + tanLen, stroke: ink, strokeWidth: 2 }),
        pathEl('sqA', { d: rightMark(A.x, A.y, 180, 90, 11), fill: 'none', stroke: ink, strokeWidth: 1.25 })
      )
    }

    return {
      stage: { viewBox: VIEW, elements },
      metrics: { r, d, length: Number(length.toFixed(4)), real },
      warnings,
    }
  },
}
