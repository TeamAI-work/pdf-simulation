import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, ground, label, n, rect, tLoop } from '../stage.js'

export const uniform_motion: SimFile = {
  id: 'uniform_motion',
  domain: 'physics',
  classBand: '6-8',
  label: 'Uniform motion',
  ncertClass: 7,
  description: 'Constant speed along a straight line',
  equations: ['s = v t', 'v = \\text{constant}'],
  keywords: ['uniform motion', 'constant speed', 'constant velocity', 'uniform velocity'],
  params: [
    param('v', 'Speed', 'm/s', 0.5, 40, 0.5, 8),
    param('tMax', 'Duration', 's', 1, 20, 0.5, 6),
  ],
  schema: z.object({
    v: num(0.1, 100, 8),
    tMax: num(0.5, 60, 6),
  }),
  run(params) {
    const { v, tMax } = params
    const t = tLoop(tMax + 0.8, tMax)
    const sMax = v * tMax
    const scale = 380 / Math.max(sMax, 1)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          rect(
            'cart',
            {
              x: { $expr: `${n(40)} + ${n(scale * v)} * (${t})` },
              y: GROUND_Y - 32,
              width: 36,
              height: 22,
              fill: '#0ea5e9',
              rx: 4,
            },
            'projectile'
          ),
          label('s-label', 28, 28, `s = vt = ${sMax.toFixed(1)} m in ${tMax} s`),
          label('v-label', 28, 46, `v = ${v} m/s (constant)`),
        ],
      },
      metrics: { distance: Number(sMax.toFixed(4)) },
      warnings: [],
      caption: `Travels ${sMax.toFixed(1)} m at ${v} m/s`,
    }
  },
}
