import { z } from 'zod'
import { pendulumPeriod } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n } from '../stage.js'

export const pendulum: SimFile = {
  id: 'pendulum',
  domain: 'physics',
  classBand: '6-8',
  label: 'Simple pendulum',
  ncertClass: 7,
  description: 'Small-angle SHM pendulum',
  equations: ['T = 2\\pi \\sqrt{L/g}', '\\theta(t) = \\theta_0 \\cos(\\omega t)'],
  keywords: ['pendulum', 'oscillat', 'swing', 'bob'],
  params: [
    param('length', 'Length', 'm', 0.2, 5, 0.05, 1),
    param('g', 'Gravity', 'm/s²', 1.6, 20, 0.01, 9.81),
    param('theta0', 'Amplitude', 'deg', 2, 40, 1, 20),
  ],
  schema: z.object({
    length: num(0.1, 20, 1),
    g: num(0.1, 30, 9.81),
    theta0: num(1, 60, 20),
  }),
  run(params) {
    const L = params.length
    const g = params.g
    const theta0 = (params.theta0 * Math.PI) / 180
    const T = pendulumPeriod(L, g)
    const pivotX = 250
    const pivotY = 36
    const pxPerM = Math.min(180 / Math.max(L, 0.3), 160)
    const omega = (2 * Math.PI) / T
    const th = `${n(theta0)} * cos(${n(omega)} * time)`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          circle('pivot', { cx: pivotX, cy: pivotY, r: 6, fill: '#e2e8f0' }),
          line('rod', {
            x1: pivotX,
            y1: pivotY,
            x2: { $expr: `${n(pivotX)} + ${n(pxPerM * L)} * sin(${th})` },
            y2: { $expr: `${n(pivotY)} + ${n(pxPerM * L)} * cos(${th})` },
            stroke: '#94a3b8',
            strokeWidth: 3,
          }),
          circle(
            'bob',
            {
              cx: { $expr: `${n(pivotX)} + ${n(pxPerM * L)} * sin(${th})` },
              cy: { $expr: `${n(pivotY)} + ${n(pxPerM * L)} * cos(${th})` },
              r: 14,
              fill: '#f59e0b',
            },
            'projectile'
          ),
          label('period', 28, 28, `T = ${T.toFixed(2)} s`),
        ],
      },
      metrics: { period: Number(T.toFixed(4)), omega: Number(omega.toFixed(4)) },
      warnings: [],
    }
  },
}
