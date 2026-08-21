import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line } from '../stage.js'

export const reflection_plane: SimFile = {
  id: 'reflection_plane',
  domain: 'physics',
  classBand: '6-10',
  label: 'Plane mirror reflection',
  ncertClass: 8,
  description: 'Angle of incidence equals angle of reflection',
  equations: ['i = r', '\\text{incident ray, normal, reflected ray}'],
  keywords: ['reflection', 'plane mirror', 'angle of incidence', 'mirror'],
  params: [param('angleDeg', 'Incidence i', 'deg', 5, 80, 1, 40)],
  schema: z.object({
    angleDeg: num(1, 85, 40),
  }),
  run(params) {
    const i = params.angleDeg
    const rad = (i * Math.PI) / 180
    const ox = 250
    const oy = 230
    const L = 140
    const ix = ox - L * Math.sin(rad)
    const iy = oy - L * Math.cos(rad)
    const rx = ox + L * Math.sin(rad)
    const ry = oy - L * Math.cos(rad)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('mirror', { x1: 80, y1: oy, x2: 420, y2: oy, stroke: '#94a3b8', strokeWidth: 6 }),
          line('normal', { x1: ox, y1: oy, x2: ox, y2: 60, stroke: '#64748b', strokeDasharray: '4 4', strokeWidth: 1.5 }),
          line('incident', { x1: ix, y1: iy, x2: ox, y2: oy, stroke: '#38bdf8', strokeWidth: 3 }),
          line('reflected', { x1: ox, y1: oy, x2: rx, y2: ry, stroke: '#f472b6', strokeWidth: 3 }),
          label('law', 28, 28, `i = r = ${i.toFixed(0)}°`),
        ],
      },
      metrics: { i, r: i },
      warnings: [],
      caption: `i = r = ${i}°`,
    }
  },
}
