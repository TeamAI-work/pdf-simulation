import { z } from 'zod'
import { bounceTimes } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, circle, ground, label, n } from '../stage.js'

export const bounce_energy: SimFile = {
  id: 'bounce_energy',
  domain: 'physics',
  classBand: '9-10',
  label: 'Bouncing ball',
  ncertClass: 9,
  description: 'Drop with restitution; kinetic energy lost each bounce',
  equations: ['v = e \\sqrt{2gh}', 'h_{n+1} = e^2 h_n'],
  keywords: ['bounce', 'restitution', 'energy loss', 'bouncing'],
  params: [
    param('h0', 'Drop height', 'm', 0.5, 20, 0.1, 8),
    param('e', 'Restitution e', '', 0, 1, 0.05, 0.7),
    param('g', 'Gravity', 'm/s²', 1.6, 20, 0.01, 9.81),
  ],
  schema: z.object({
    h0: num(0.1, 100, 8),
    e: num(0, 1, 0.7),
    g: num(0.1, 30, 9.81),
  }),
  run(params) {
    const { h0, e, g } = params
    const b = bounceTimes(h0, e, g)
    const scale = Math.min(200 / Math.max(h0, 1), 20)
    const tA = b.tDown
    const tB = b.tBounce1
    const t = `mod(time, ${n(b.total + 0.4)})`
    const t1 = `(${t})`
    const t2 = `((${t}) - ${n(tA)})`
    const t3 = `((${t}) - ${n(tA + tB)})`
    const y = `(${t} < ${n(tA)}) ? (${n(h0)} - 0.5 * ${n(g)} * (${t1})^2) : ((${t} < ${n(tA + tB)}) ? (${n(b.v1)} * (${t2}) - 0.5 * ${n(g)} * (${t2})^2) : max(0, ${n(b.v2)} * (${t3}) - 0.5 * ${n(g)} * (${t3})^2))`
    const keAfterFirst = 0.5 * (b.v1 * b.v1)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          circle(
            'ball',
            {
              cx: 250,
              cy: { $expr: `${n(GROUND_Y)} - ${n(scale)} * (${y})` },
              r: 11,
              fill: '#e11d48',
            },
            'projectile'
          ),
          label('e-label', 28, 28, `e = ${e}   h₁ = ${b.h1.toFixed(2)} m`),
          label('ke-label', 28, 46, `KE after bounce ≈ ${keAfterFirst.toFixed(2)} J (m=1 kg)`),
        ],
      },
      metrics: {
        h1: Number(b.h1.toFixed(4)),
        h2: Number(b.h2.toFixed(4)),
        energyFractionRetained: Number((e * e).toFixed(4)),
      },
      warnings: [],
    }
  },
}
