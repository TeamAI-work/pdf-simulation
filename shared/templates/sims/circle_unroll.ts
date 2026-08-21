import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, tLoop } from '../stage.js'

export const circle_unroll: SimFile = {
  id: 'circle_unroll',
  domain: 'math',
  classBand: '6-8',
  label: 'Circle unroll',
  ncertClass: 7,
  description: 'A circle of radius r rolls one turn; the path is the circumference 2πr',
  equations: ['C = 2\\pi r'],
  keywords: ['circumference', 'unroll', '2 pi r', 'circle length'],
  params: [param('r', 'Radius', '', 0.5, 8, 0.1, 2)],
  schema: z.object({
    r: num(0.2, 20, 2),
  }),
  run(params) {
    const r = params.r
    const C = 2 * Math.PI * r
    const k = Math.min(28, 400 / (r * (2 + 2 * Math.PI)))
    const R = Math.max(14, r * k)
    const Cpx = 2 * Math.PI * R
    const ground = 248
    const x0 = 48 + R
    const cy = ground - R
    const t = tLoop(4.4, 3.8)
    const frac = `min(1, (${t}) / 3.8)`
    const s = `${n(Cpx)} * (${frac})`
    const th = `(${s}) / ${n(R)}`
    const cx = `${n(x0)} + (${s})`
    const mx = `(${cx}) + ${n(R)} * sin(${th})`
    const my = `${n(cy)} + ${n(R)} * cos(${th})`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 28, 24, `C = 2πr = ${C.toFixed(2)}`),
          label('rv', 28, 42, `r = ${r}`),
          line('ground', { x1: 24, y1: ground, x2: 486, y2: ground, stroke: '#334155', strokeWidth: 2 }),
          line('fullC', {
            x1: x0,
            y1: ground + 10,
            x2: x0 + Cpx,
            y2: ground + 10,
            stroke: '#cbd5e1',
            strokeWidth: 2,
          }),
          line('unrolled', {
            x1: x0,
            y1: ground,
            x2: { $expr: `${n(x0)} + (${s})` },
            y2: ground,
            stroke: '#d97706',
            strokeWidth: 6,
          }),
          circle(
            'disk',
            {
              cx: { $expr: cx },
              cy,
              r: R,
              fill: '#dbeafe',
              stroke: '#2563eb',
              strokeWidth: 3,
            },
            'projectile'
          ),
          line('spoke', {
            x1: { $expr: cx },
            y1: cy,
            x2: { $expr: mx },
            y2: { $expr: my },
            stroke: '#1d4ed8',
            strokeWidth: 2.5,
          }),
          line('radius', {
            x1: { $expr: cx },
            y1: cy,
            x2: { $expr: cx },
            y2: ground,
            stroke: '#64748b',
            strokeWidth: 1.5,
            strokeDasharray: '4 3',
          }),
          circle('mark', {
            cx: { $expr: mx },
            cy: { $expr: my },
            r: 5,
            fill: '#d97706',
          }),
          circle('hub', { cx: { $expr: cx }, cy, r: 3.5, fill: '#1e3a8a' }),
          {
            id: 'rt',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: `(${cx}) + 8` },
              y: (cy + ground) / 2 + 4,
              fill: '#334155',
              fontSize: 12,
            },
            text: 'r',
          },
          label('zero', x0 - 4, ground + 26, '0'),
          label('cend', x0 + Cpx - 8, ground + 26, 'C'),
        ],
      },
      metrics: { r, C: Number(C.toFixed(4)) },
      warnings: [],
    }
  },
}
