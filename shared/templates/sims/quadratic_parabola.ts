import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

export const quadratic_parabola: SimFile = {
  id: 'quadratic_parabola',
  domain: 'math',
  classBand: '9-10',
  label: 'Quadratic parabola',
  ncertClass: 10,
  description: 'y = ax² + bx + c',
  equations: ['y = ax^2 + bx + c', 'x = -b/(2a)'],
  keywords: ['quadratic', 'parabola', 'ax^2', 'vertex'],
  params: [
    param('a', 'a', '', -3, 3, 0.1, 0.5),
    param('b', 'b', '', -6, 6, 0.1, 0),
    param('c', 'c', '', -6, 6, 0.1, 0),
  ],
  schema: z.object({
    a: num(-8, 8, 0.5),
    b: num(-20, 20, 0),
    c: num(-20, 20, 0),
  }),
  run(params) {
    const { a, b, c } = params
    const ox = 250
    const oy = 200
    const s = 16
    const pts: string[] = []
    for (let i = 0; i <= 40; i++) {
      const x = -10 + i * 0.5
      const yv = a * x * x + b * x + c
      const px = ox + x * s
      const py = oy - yv * s
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
    }
    const vertex = Math.abs(a) > 1e-6 ? -b / (2 * a) : 0
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('x-axis', { x1: 40, y1: oy, x2: 460, y2: oy, stroke: '#475569', strokeWidth: 1 }),
          line('y-axis', { x1: ox, y1: 20, x2: ox, y2: 280, stroke: '#475569', strokeWidth: 1 }),
          pathEl('para', { d: pts.join(' '), stroke: '#fbbf24', fill: 'none', strokeWidth: 2.5 }),
          label('eq', 28, 28, `y = ${a}x² + ${b}x + ${c}`),
          label('v', 28, 46, `vertex x = ${vertex.toFixed(2)}`),
        ],
      },
      metrics: { a, b, c, vertex: Number(vertex.toFixed(4)) },
      warnings: [],
    }
  },
}
