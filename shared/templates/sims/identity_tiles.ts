import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const identity_tiles: SimFile = {
  id: 'identity_tiles',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 8,
  label: '(a+b)² tiles',
  description: 'Area model of (a+b)² = a² + 2ab + b²',
  equations: ['(a+b)^2 = a^2 + 2ab + b^2'],
  keywords: ['algebraic identity', '(a+b)^2', 'expansion', 'a plus b squared'],
  params: [
    param('a', 'a', '', 1, 8, 0.5, 3),
    param('b', 'b', '', 1, 8, 0.5, 2),
  ],
  schema: z.object({
    a: num(0.5, 20, 3),
    b: num(0.5, 20, 2),
  }),
  run(params) {
    const { a, b } = params
    const sum = a + b
    const expanded = sum * sum
    const scale = 180 / Math.max(sum, 1)
    const x0 = 160
    const y0 = 70
    const aw = a * scale
    const bw = b * scale
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('a2', { x: x0, y: y0, width: aw, height: aw, fill: '#38bdf8', rx: 2 }),
          rect('ab1', { x: x0 + aw, y: y0, width: bw, height: aw, fill: '#fbbf24', rx: 2 }),
          rect('ab2', { x: x0, y: y0 + aw, width: aw, height: bw, fill: '#fbbf24', rx: 2 }),
          rect('b2', { x: x0 + aw, y: y0 + aw, width: bw, height: bw, fill: '#f472b6', rx: 2 }),
          label('eq', 28, 28, `(a+b)² = ${expanded}`),
          label('parts', 28, 46, `a²=${a * a}  2ab=${2 * a * b}  b²=${b * b}`),
        ],
      },
      metrics: { a, b, expanded, a2: a * a, twoAb: 2 * a * b, b2: b * b },
      warnings: [],
    }
  },
}
