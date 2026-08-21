import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, rect } from '../stage.js'

export const heat_conduction: SimFile = {
  id: 'heat_conduction',
  domain: 'physics',
  classBand: '6-8',
  label: 'Heat conduction',
  ncertClass: 7,
  description: 'Heat front travels along a rod; faster for higher conductivity',
  equations: ['Q/t = k A \\Delta T / L'],
  keywords: ['conduction', 'heat transfer', 'thermal conductivity', 'metal rod heat'],
  params: [param('conductivity', 'Conductivity k', '', 0.2, 8, 0.1, 2)],
  schema: z.object({
    conductivity: num(0.05, 20, 2),
  }),
  run(params) {
    const k = params.conductivity
    const speed = 20 + k * 35
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('rod-cold', { x: 60, y: 130, width: 380, height: 36, fill: '#1e3a5f', rx: 4 }),
          rect(
            'rod-hot',
            {
              x: 60,
              y: 130,
              width: { $expr: `${n(speed)} * min(time, ${n(380 / Math.max(speed, 1))})` },
              height: 36,
              fill: '#f97316',
              rx: 4,
            },
            'projectile'
          ),
          rect('flame', { x: 40, y: 118, width: 24, height: 60, fill: '#ef4444', rx: 6 }),
          label('k', 28, 28, `k = ${k}`),
          label('note', 28, 46, 'Heat front moves faster for larger k'),
        ],
      },
      metrics: { conductivity: k, speed: Number(speed.toFixed(2)) },
      warnings: [],
    }
  },
}
