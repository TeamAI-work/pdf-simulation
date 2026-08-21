import { z } from 'zod'
import { heatEnergy } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, rect, tLoop } from '../stage.js'

export const heating_effect: SimFile = {
  id: 'heating_effect',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Heating effect of current',
  description: 'Joule heat H = I²Rt in a resistor',
  equations: ['H = I^2 R t'],
  keywords: ['heating effect', 'joule heating', 'I squared R t', 'electric heater', 'heat produced'],
  params: [
    param('I', 'Current', 'A', 0.2, 12, 0.1, 2),
    param('R', 'Resistance', 'Ω', 0.5, 40, 0.5, 3),
    param('t', 'Time', 's', 0.5, 20, 0.5, 4),
  ],
  schema: z.object({
    I: num(0.01, 80, 2),
    R: num(0.1, 500, 3),
    t: num(0.1, 120, 4),
  }),
  run(params) {
    const { I, R, t } = params
    const H = heatEnergy(I, R, t)
    const glow = Math.min(1, H / 80)
    const tmax = Math.max(t, 0.5)
    const tt = tLoop(tmax + 0.4, tmax)
    const fillW = 280
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('coil', { x: 110, y: 120, width: 280, height: 36, fill: '#1e293b', rx: 6 }),
          rect(
            'hot',
            {
              x: 110,
              y: 120,
              width: { $expr: `${n(fillW)} * ((${tt}) / ${n(tmax)})` },
              height: 36,
              fill: glow > 0.6 ? '#ef4444' : '#f97316',
              rx: 6,
            },
            'projectile'
          ),
          label('H', 28, 28, `H = I²Rt = ${H.toFixed(1)} J`),
          label('vals', 28, 46, `I=${I} A   R=${R} Ω   t=${t} s`),
        ],
      },
      metrics: { I, R, t, H: Number(H.toFixed(4)) },
      warnings: [],
    }
  },
}
