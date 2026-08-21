import { z } from 'zod'
import { snellTheta2 } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const snell_refraction: SimFile = {
  id: 'snell_refraction',
  domain: 'physics',
  classBand: '8-10',
  label: 'Snell refraction',
  ncertClass: 10,
  description: 'Ray bends at a boundary: n1 sin θ1 = n2 sin θ2',
  equations: ['n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2'],
  keywords: ['snell', 'refraction', 'refractive index', 'air to glass', 'bends toward'],
  params: [
    param('n1', 'n₁', '', 1, 2.5, 0.01, 1),
    param('n2', 'n₂', '', 1, 2.5, 0.01, 1.5),
    param('theta1', 'θ₁', 'deg', 1, 80, 1, 35),
  ],
  schema: z.object({
    n1: num(1, 3, 1),
    n2: num(1, 3, 1.5),
    theta1: num(0, 85, 35),
  }),
  run(params) {
    const { n1, n2, theta1 } = params
    const { theta2Deg, tir } = snellTheta2(n1, n2, theta1)
    const t1 = (theta1 * Math.PI) / 180
    const t2 = (theta2Deg * Math.PI) / 180
    const ox = 250
    const oy = 150
    const L = 120
    const ix = ox - L * Math.sin(t1)
    const iy = oy - L * Math.cos(t1)
    const rx = tir ? ox + L * Math.sin(t1) : ox + L * Math.sin(t2)
    const ry = tir ? oy - L * Math.cos(t1) : oy + L * Math.cos(t2)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('medium2', { x: 40, y: oy, width: 420, height: 110, fill: '#0ea5e922' }),
          line('boundary', { x1: 40, y1: oy, x2: 460, y2: oy, stroke: '#38bdf8', strokeWidth: 2 }),
          line('normal', { x1: ox, y1: 40, x2: ox, y2: 260, stroke: '#64748b', strokeDasharray: '4 4', strokeWidth: 1 }),
          line('in', { x1: ix, y1: iy, x2: ox, y2: oy, stroke: '#fbbf24', strokeWidth: 3 }),
          line('out', { x1: ox, y1: oy, x2: rx, y2: ry, stroke: tir ? '#ef4444' : '#22c55e', strokeWidth: 3 }),
          label('snell', 28, 28, tir ? 'Total internal reflection' : `θ₂ = ${theta2Deg.toFixed(1)}°`),
          label('n', 28, 46, `n₁=${n1}  n₂=${n2}  θ₁=${theta1}°`),
        ],
      },
      metrics: { theta2: Number(theta2Deg.toFixed(4)), tir },
      warnings: [],
    }
  },
}
