import { z } from 'zod'
import { ohmCurrent } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, tLoop } from '../stage.js'

export const vi_graph: SimFile = {
  id: 'vi_graph',
  domain: 'physics',
  classBand: '8-10',
  ncertClass: 10,
  label: 'V–I graph',
  description: 'Ohm’s law as a straight V–I line through the origin; slope = 1/R',
  equations: ['V = IR', 'I = V/R'],
  keywords: ['V-I graph', 'ohm\'s law graph', 'voltage current graph', 'VI graph'],
  params: [
    param('R', 'Resistance R', 'Ω', 1, 50, 0.5, 4),
    param('Vmax', 'Max voltage', 'V', 1, 24, 0.5, 12),
  ],
  schema: z.object({
    R: num(0.1, 200, 4),
    Vmax: num(0.5, 100, 12),
  }),
  run(params) {
    const { R, Vmax } = params
    const Imax = ohmCurrent(Vmax, R)
    const slope = 1 / Math.max(R, 1e-9)
    const x0 = 70
    const y0 = 250
    const w = 360
    const h = 190
    const t = tLoop(4, 3.5)
    const frac = `(${t}) / 3.5`

    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('x-axis', { x1: x0, y1: y0, x2: x0 + w, y2: y0, stroke: '#475569', strokeWidth: 1 }),
          line('y-axis', { x1: x0, y1: y0 - h, x2: x0, y2: y0, stroke: '#475569', strokeWidth: 1 }),
          line('vi', {
            x1: x0,
            y1: y0,
            x2: x0 + w,
            y2: y0 - h,
            stroke: '#38bdf8',
            strokeWidth: 3,
          }),
          circle(
            'pt',
            {
              cx: { $expr: `${n(x0)} + (${frac}) * ${n(w)}` },
              cy: { $expr: `${n(y0)} - (${frac}) * ${n(h)}` },
              r: 6,
              fill: '#fbbf24',
            },
            'projectile'
          ),
          label('xl', x0 + w - 24, y0 + 18, 'V'),
          label('yl', x0 - 18, y0 - h + 12, 'I'),
          label('eq', 28, 28, `I = V/${R}   slope = ${slope.toFixed(3)} A/V`),
          label('end', 28, 46, `at ${Vmax} V, I = ${Imax.toFixed(2)} A`),
        ],
      },
      metrics: { R, Vmax, slope: Number(slope.toFixed(6)), I_at_Vmax: Number(Imax.toFixed(4)) },
      warnings: [],
    }
  },
}
