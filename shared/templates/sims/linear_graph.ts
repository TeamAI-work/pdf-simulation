import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line } from '../stage.js'

export const linear_graph: SimFile = {
  id: 'linear_graph',
  domain: 'math',
  classBand: '9-10',
  label: 'Linear graph',
  ncertClass: 9,
  description: 'y = mx + c, optional second line',
  equations: ['y = mx + c'],
  keywords: ['linear graph', 'slope intercept', 'y = mx', 'straight line graph'],
  params: [
    param('m', 'Slope m', '', -5, 5, 0.1, 1),
    param('c', 'Intercept c', '', -8, 8, 0.5, 0),
    param('m2', 'Slope m₂ (0 = hide)', '', -5, 5, 0.1, 0),
    param('c2', 'Intercept c₂', '', -8, 8, 0.5, 0),
  ],
  schema: z.object({
    m: num(-20, 20, 1),
    c: num(-40, 40, 0),
    m2: num(-20, 20, 0),
    c2: num(-40, 40, 0),
  }),
  run(params) {
    const { m, c, m2, c2 } = params
    const ox = 250
    const oy = 160
    const s = 18
    const x1 = -10
    const x2 = 10
    const y = (x: number, mm: number, cc: number) => oy - (mm * x + cc) * s
    const elements = [
      line('x-axis', { x1: 40, y1: oy, x2: 460, y2: oy, stroke: '#475569', strokeWidth: 1 }),
      line('y-axis', { x1: ox, y1: 30, x2: ox, y2: 270, stroke: '#475569', strokeWidth: 1 }),
      line('l1', {
        x1: ox + x1 * s,
        y1: y(x1, m, c),
        x2: ox + x2 * s,
        y2: y(x2, m, c),
        stroke: '#38bdf8',
        strokeWidth: 3,
      }),
      label('eq', 28, 28, `y = ${m}x + ${c}`),
    ]
    if (Math.abs(m2) > 1e-6 || Math.abs(c2) > 1e-6) {
      elements.push(
        line('l2', {
          x1: ox + x1 * s,
          y1: y(x1, m2, c2),
          x2: ox + x2 * s,
          y2: y(x2, m2, c2),
          stroke: '#f472b6',
          strokeWidth: 2,
        })
      )
      elements.push(label('eq2', 28, 46, `y = ${m2}x + ${c2}`))
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { m, c, m2, c2 },
      warnings: [],
    }
  },
}
