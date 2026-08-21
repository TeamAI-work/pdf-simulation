import { z } from 'zod'
import { shmPeriod } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, rect, spring } from '../stage.js'

export const spring_shm: SimFile = {
  id: 'spring_shm',
  domain: 'physics',
  classBand: '9-10',
  label: 'Spring SHM',
  ncertClass: 9,
  description: 'Mass on a horizontal spring, x = A cos(ωt)',
  equations: ['T = 2\\pi \\sqrt{m/k}', 'x = A \\cos(\\omega t)', '\\omega = \\sqrt{k/m}'],
  keywords: ['spring', 'hooke', 'shm', 'simple harmonic', 'oscillating mass'],
  params: [
    param('k', 'Spring k', 'N/m', 1, 200, 1, 20),
    param('m', 'Mass', 'kg', 0.1, 20, 0.1, 1),
    param('A', 'Amplitude', 'm', 0.05, 2, 0.05, 0.4),
  ],
  schema: z.object({
    k: num(0.1, 500, 20),
    m: num(0.05, 50, 1),
    A: num(0.01, 5, 0.4),
  }),
  run(params) {
    const { k, m, A } = params
    const T = shmPeriod(k, m)
    const omega = (2 * Math.PI) / T
    const scale = 80
    const eq = 220
    const x = `${n(eq)} + ${n(scale * A)} * cos(${n(omega)} * time)`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('wall', { x: 30, y: 110, width: 16, height: 80, fill: '#475569' }),
          spring('coil', {
            x1: 46,
            y1: 150,
            x2: { $expr: x },
            y2: 150,
            coils: 8,
            radius: 12,
            stroke: '#94a3b8',
            strokeWidth: 2,
          }),
          circle(
            'mass',
            { cx: { $expr: `(${x}) + 18` }, cy: 150, r: 18, fill: '#f97316' },
            'projectile'
          ),
          label('T', 28, 28, `T = ${T.toFixed(2)} s`),
          label('w', 28, 46, `ω = ${omega.toFixed(2)} rad/s   A = ${A} m`),
        ],
      },
      metrics: { period: Number(T.toFixed(4)), omega: Number(omega.toFixed(4)) },
      warnings: [],
    }
  },
}
