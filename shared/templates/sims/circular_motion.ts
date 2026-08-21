import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n } from '../stage.js'

export const circular_motion: SimFile = {
  id: 'circular_motion',
  domain: 'physics',
  classBand: '9-10',
  label: 'Uniform circular motion',
  ncertClass: 9,
  description: 'Particle on a circle with angular speed ω',
  equations: ['v = \\omega r', 'a_c = \\omega^2 r', 'T = 2\\pi / \\omega'],
  keywords: ['circular motion', 'centripetal', 'angular speed', 'uniform circular'],
  params: [
    param('r', 'Radius', 'm', 0.2, 8, 0.1, 2),
    param('omega', 'ω', 'rad/s', 0.2, 8, 0.1, 1.5),
  ],
  schema: z.object({
    r: num(0.05, 20, 2),
    omega: num(0.05, 20, 1.5),
  }),
  run(params) {
    const { r, omega } = params
    const T = (2 * Math.PI) / omega
    const v = omega * r
    const ac = omega * omega * r
    const px = Math.min(110, 90 / Math.max(r, 0.3)) * r
    const cx = 250
    const cy = 160
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          circle('orbit', { cx, cy, r: px, fill: 'none', stroke: '#64748b', strokeWidth: 1.5, strokeDasharray: '4 4' }),
          circle('center', { cx, cy, r: 4, fill: '#e2e8f0' }),
          circle(
            'particle',
            {
              cx: { $expr: `${n(cx)} + ${n(px)} * cos(${n(omega)} * time)` },
              cy: { $expr: `${n(cy)} + ${n(px)} * sin(${n(omega)} * time)` },
              r: 10,
              fill: '#38bdf8',
            },
            'projectile'
          ),
          label('T', 28, 28, `T = ${T.toFixed(2)} s   v = ${v.toFixed(2)} m/s`),
          label('a', 28, 46, `a_c = ω²r = ${ac.toFixed(2)} m/s²`),
        ],
      },
      metrics: { period: Number(T.toFixed(4)), speed: Number(v.toFixed(4)), centripetal: Number(ac.toFixed(4)) },
      warnings: [],
    }
  },
}
