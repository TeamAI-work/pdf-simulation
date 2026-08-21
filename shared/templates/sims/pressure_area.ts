import { z } from 'zod'
import { pressure } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, label, rect } from '../stage.js'

export const pressure_area: SimFile = {
  id: 'pressure_area',
  domain: 'physics',
  classBand: '6-8',
  ncertClass: 8,
  label: 'Pressure = F/A',
  description: 'Pressure on a surface from a downward force and contact area',
  equations: ['P = F/A'],
  keywords: ['pressure', 'force over area', 'pascal', 'contact area', 'thrust', 'acts on an area'],
  params: [
    param('force', 'Force', 'N', 1, 200, 1, 10),
    param('area', 'Area', 'm²', 0.2, 20, 0.2, 2),
  ],
  schema: z.object({
    force: num(0.01, 1e5, 10),
    area: num(0.01, 200, 2),
  }),
  run(params) {
    const { force, area } = params
    const P = pressure(force, area)
    const w = Math.max(24, Math.min(220, 40 * Math.sqrt(area)))
    const h = Math.max(20, Math.min(80, 8 + force * 0.25))
    const x = 250 - w / 2
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('ground', { x: 80, y: 220, width: 340, height: 16, fill: '#334155', rx: 2 }),
          rect('block', { x, y: 220 - h, width: w, height: h, fill: '#6366f1', rx: 4 }),
          arrow('F', { x1: 250, y1: 80, x2: 250, y2: 220 - h - 8, stroke: '#22c55e', strokeWidth: 3 }),
          label('P', 28, 28, `P = F/A = ${P.toFixed(2)} Pa`),
          label('vals', 28, 46, `F = ${force} N    A = ${area} m²`),
        ],
      },
      metrics: { force, area, P: Number(P.toFixed(4)) },
      warnings: [],
    }
  },
}
