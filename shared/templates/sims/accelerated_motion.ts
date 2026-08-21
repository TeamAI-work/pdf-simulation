import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, ground, label, n, rect, tLoop } from '../stage.js'

export const accelerated_motion: SimFile = {
  id: 'accelerated_motion',
  domain: 'physics',
  classBand: '9-10',
  label: 'Accelerated motion',
  ncertClass: 9,
  description: 'Constant acceleration from initial speed u',
  equations: ['v = u + at', 's = ut + \\tfrac12 a t^2'],
  keywords: ['accelerated motion', 'equations of motion', 'u + at', 'constant acceleration'],
  params: [
    param('u', 'Initial speed', 'm/s', 0, 40, 0.5, 0),
    param('a', 'Acceleration', 'm/s²', 0.1, 20, 0.1, 4),
    param('tMax', 'Duration', 's', 1, 12, 0.5, 4),
  ],
  schema: z.object({
    u: num(0, 100, 0),
    a: num(-20, 40, 4),
    tMax: num(0.5, 30, 4),
  }),
  run(params) {
    const { u, a, tMax } = params
    const t = tLoop(tMax + 0.8, tMax)
    const s = `${n(u)} * (${t}) + 0.5 * ${n(a)} * (${t})^2`
    const sMax = u * tMax + 0.5 * a * tMax * tMax
    const vEnd = u + a * tMax
    const scale = 380 / Math.max(Math.abs(sMax), 1)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          rect(
            'block',
            {
              x: { $expr: `${n(40)} + ${n(scale)} * (${s})` },
              y: GROUND_Y - 34,
              width: 34,
              height: 24,
              fill: '#8b5cf6',
              rx: 4,
            },
            'projectile'
          ),
          label('eq', 28, 28, `v = u+at → ${vEnd.toFixed(1)} m/s`),
          label('s', 28, 46, `s = ${sMax.toFixed(1)} m`),
        ],
      },
      metrics: { sMax: Number(sMax.toFixed(4)), vEnd: Number(vEnd.toFixed(4)) },
      warnings: [],
    }
  },
}
