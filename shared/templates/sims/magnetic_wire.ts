import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n } from '../stage.js'

export const magnetic_wire: SimFile = {
  id: 'magnetic_wire',
  domain: 'physics',
  classBand: '9-10',
  label: 'Magnetic field of a wire',
  ncertClass: 10,
  description: 'Concentric field circles; spacing tighter for larger I',
  equations: ['B = \\mu_0 I / (2\\pi r)'],
  keywords: ['magnetic field', 'current wire', 'right hand thumb', 'concentric circles', 'straight conductor'],
  params: [param('I', 'Current', 'A', 0.5, 20, 0.5, 5)],
  schema: z.object({
    I: num(0.1, 50, 5),
  }),
  run(params) {
    const I = params.I
    const rings = Math.max(3, Math.min(8, Math.round(2 + I / 3)))
    const elements = [
      circle('wire', { cx: 250, cy: 160, r: 10, fill: '#f97316' }),
      label('I', 28, 28, `I = ${I} A`),
      label('B', 28, 46, `More current → denser field circles`),
    ]
    for (let k = 1; k <= rings; k++) {
      const r = 28 + k * Math.max(14, 36 - I)
      elements.push(
        circle(`ring-${k}`, {
          cx: 250,
          cy: 160,
          r,
          fill: 'none',
          stroke: '#38bdf8',
          strokeWidth: 1.5,
          opacity: { $expr: `0.35 + 0.35 * sin(time * ${n(0.8 + I * 0.15)} + ${n(k)})` },
        })
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { I, rings },
      warnings: [],
    }
  },
}
