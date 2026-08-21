import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, pathEl } from '../stage.js'

function poly(pts: Array<[number, number]>): string {
  return `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')} Z`
}

function fmt(x: number): string {
  const r = Math.round(x * 1000) / 1000
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

export const pythagoras: SimFile = {
  id: 'pythagoras',
  domain: 'math',
  classBand: '6-8',
  label: 'Pythagoras',
  ncertClass: 7,
  description: 'Squares on the sides of a right triangle: a² + b² = c²',
  equations: ['a^2 + b^2 = c^2', 'c = \\sqrt{a^2 + b^2}'],
  keywords: ['pythagoras', 'pythagorean', 'hypotenuse', 'right triangle'],
  params: [
    param('a', 'Leg a', '', 1, 12, 0.5, 3),
    param('b', 'Leg b', '', 1, 12, 0.5, 4),
  ],
  schema: z.object({
    a: num(0.5, 40, 3),
    b: num(0.5, 40, 4),
  }),
  run(params) {
    const { a, b } = params
    const c = Math.hypot(a, b)
    const a2 = a * a
    const b2 = b * b
    const c2 = a2 + b2
    const s = Math.min(452 / (a + 2 * b), 228 / (2 * a + b))
    const x0 = 28 + b * s
    const y0 = 56 + (a + b) * s
    const ax = a * s
    const by = b * s
    const C: [number, number] = [x0, y0]
    const Bp: [number, number] = [x0 + ax, y0]
    const A: [number, number] = [x0, y0 - by]
    const sqA: Array<[number, number]> = [C, Bp, [x0 + ax, y0 + ax], [x0, y0 + ax]]
    const sqB: Array<[number, number]> = [C, A, [x0 - by, y0 - by], [x0 - by, y0]]
    const rot: [number, number] = [by, -ax]
    const A2: [number, number] = [A[0] + rot[0], A[1] + rot[1]]
    const B2: [number, number] = [Bp[0] + rot[0], Bp[1] + rot[1]]
    const sqC: Array<[number, number]> = [A, A2, B2, Bp]
    const mark = Math.min(14, 0.2 * ax, 0.2 * by)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 24, 22, `${fmt(a2)} + ${fmt(b2)} = ${fmt(c2)}`),
          pathEl('sq-a', {
            d: poly(sqA),
            fill: '#e2e8f0',
            stroke: '#334155',
            strokeWidth: 1.5,
          }),
          pathEl('sq-b', {
            d: poly(sqB),
            fill: '#e2e8f0',
            stroke: '#334155',
            strokeWidth: 1.5,
          }),
          pathEl('sq-c', {
            d: poly(sqC),
            fill: '#e2e8f0',
            stroke: '#334155',
            strokeWidth: 1.5,
          }),
          pathEl('tri', {
            d: poly([C, Bp, A]),
            fill: '#fff',
            stroke: '#0f172a',
            strokeWidth: 2,
          }),
          pathEl('right', {
            d: `M ${x0 + mark} ${y0} L ${x0 + mark} ${y0 - mark} L ${x0} ${y0 - mark}`,
            fill: 'none',
            stroke: '#0f172a',
            strokeWidth: 1.25,
          }),
          label('la2', x0 + ax / 2 - 10, y0 + ax / 2 + 4, fmt(a2)),
          label('lb2', x0 - by / 2 - 10, y0 - by / 2 + 4, fmt(b2)),
          label('lc2', (A[0] + Bp[0] + rot[0]) / 2 - 10, (A[1] + Bp[1] + rot[1]) / 2 + 4, fmt(c2)),
        ],
      },
      metrics: { a, b, c: Number(c.toFixed(4)), a2, b2, c2 },
      warnings: [],
    }
  },
}
