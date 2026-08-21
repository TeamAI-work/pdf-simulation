import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, circle, ground, label, n, rect, tLoop } from '../stage.js'

export const free_fall: SimFile = {
  id: 'free_fall',
  domain: 'physics',
  classBand: '9-10',
  label: 'Free fall',
  ncertClass: 9,
  description: 'Object dropped from rest under gravity',
  equations: ['h = h_0 - \\tfrac12 g t^2', 't = \\sqrt{2 h_0 / g}'],
  keywords: ['free fall', 'dropped', 'falling', 'from rest', 'drop'],
  params: [
    param('h0', 'Height', 'm', 1, 80, 0.5, 20),
    param('g', 'Gravity', 'm/s²', 1.6, 20, 0.01, 9.81),
  ],
  schema: z.object({
    h0: num(0.1, 500, 20),
    g: num(0.1, 30, 9.81),
  }),
  run(params) {
    const { h0, g } = params
    const T = Math.sqrt((2 * h0) / g)
    const scale = Math.min(220 / Math.max(h0, 1), 8) * 0.9
    const t = tLoop(T + 0.8, T)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          rect('tower', {
            x: 70,
            y: GROUND_Y - scale * h0,
            width: 14,
            height: scale * h0,
            fill: '#334155',
          }),
          circle(
            'ball',
            {
              cx: 140,
              cy: { $expr: `${n(GROUND_Y - scale * h0)} + ${n(scale)} * 0.5 * ${n(g)} * (${t})^2` },
              r: 10,
              fill: '#f97316',
            },
            'projectile'
          ),
          label('t-label', 28, 28, `t_fall = ${T.toFixed(2)} s`),
          label('h-label', 28, 46, `h = ${h0.toFixed(1)} m`),
        ],
      },
      metrics: { flightTime: Number(T.toFixed(4)), impactSpeed: Number((g * T).toFixed(4)) },
      warnings: [],
      caption: `Time to ground ${T.toFixed(2)} s from ${h0} m`,
    }
  },
}
