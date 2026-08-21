import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line } from '../stage.js'

export const similar_triangles: SimFile = {
  id: 'similar_triangles',
  domain: 'math',
  classBand: '9-10',
  label: 'Similar triangles',
  ncertClass: 10,
  description: 'A second triangle scaled by k',
  equations: ['\\Delta ABC \\sim \\Delta A\'B\'C\'', 'k = \\text{scale}'],
  keywords: ['similar triangles', 'similarity', 'scale factor', 'corresponding sides'],
  params: [param('scale', 'Scale k', '', 0.4, 2.5, 0.1, 1.5)],
  schema: z.object({
    scale: num(0.2, 4, 1.5),
  }),
  run(params) {
    const k = params.scale
    const ax = 80
    const ay = 220
    const bx = 180
    const by = 220
    const cx = 110
    const cy = 120
    const ox = 260
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('a1', { x1: ax, y1: ay, x2: bx, y2: by, stroke: '#38bdf8', strokeWidth: 2 }),
          line('a2', { x1: bx, y1: by, x2: cx, y2: cy, stroke: '#38bdf8', strokeWidth: 2 }),
          line('a3', { x1: cx, y1: cy, x2: ax, y2: ay, stroke: '#38bdf8', strokeWidth: 2 }),
          line('b1', { x1: ox, y1: ay, x2: ox + (bx - ax) * k, y2: ay, stroke: '#f472b6', strokeWidth: 2 }),
          line('b2', {
            x1: ox + (bx - ax) * k,
            y1: ay,
            x2: ox + (cx - ax) * k,
            y2: ay - (ay - cy) * k,
            stroke: '#f472b6',
            strokeWidth: 2,
          }),
          line('b3', { x1: ox + (cx - ax) * k, y1: ay - (ay - cy) * k, x2: ox, y2: ay, stroke: '#f472b6', strokeWidth: 2 }),
          label('k', 28, 28, `scale k = ${k}`),
        ],
      },
      metrics: { scale: k },
      warnings: [],
    }
  },
}
