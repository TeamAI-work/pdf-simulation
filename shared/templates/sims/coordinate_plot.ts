import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const coordinate_plot: SimFile = {
  id: 'coordinate_plot',
  domain: 'math',
  classBand: '6-8',
  label: 'Coordinate plot',
  ncertClass: 7,
  description: 'Plot one or two points on the Cartesian plane',
  equations: ['P(x_1, y_1)', 'Q(x_2, y_2)'],
  keywords: ['coordinate plane', 'cartesian', 'plot the point', 'ordered pair'],
  params: [
    param('x1', 'x₁', '', -8, 8, 0.5, 2),
    param('y1', 'y₁', '', -8, 8, 0.5, 3),
    param('x2', 'x₂', '', -8, 8, 0.5, 0),
    param('y2', 'y₂', '', -8, 8, 0.5, 0),
  ],
  schema: z.object({
    x1: num(-20, 20, 2),
    y1: num(-20, 20, 3),
    x2: num(-20, 20, 0),
    y2: num(-20, 20, 0),
  }),
  run(params) {
    const { x1, y1, x2, y2 } = params
    const ox = 250
    const oy = 160
    const s = 18
    const hasQ = !(x2 === 0 && y2 === 0)
    const elements = [
      line('x-axis', { x1: 40, y1: oy, x2: 460, y2: oy, stroke: '#475569', strokeWidth: 1 }),
      line('y-axis', { x1: ox, y1: 30, x2: ox, y2: 270, stroke: '#475569', strokeWidth: 1 }),
      circle('P', { cx: ox + x1 * s, cy: oy - y1 * s, r: 7, fill: '#38bdf8' }),
      label('p', 28, 28, `P(${x1}, ${y1})`),
    ]
    if (hasQ) {
      elements.push(circle('Q', { cx: ox + x2 * s, cy: oy - y2 * s, r: 7, fill: '#f472b6' }))
      elements.push(label('q', 28, 46, `Q(${x2}, ${y2})`))
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x1, y1, x2, y2 },
      warnings: [],
    }
  },
}
