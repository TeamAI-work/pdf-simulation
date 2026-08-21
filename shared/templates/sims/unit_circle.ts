import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, pathEl } from '../stage.js'

export const unit_circle: SimFile = {
  id: 'unit_circle',
  domain: 'math',
  classBand: '9-10',
  label: 'Unit circle',
  ncertClass: 10,
  description: 'Point P(cos θ, sin θ) rotates on the unit circle; sine unrolls to the right',
  equations: ['x = \\cos\\theta', 'y = \\sin\\theta', '\\theta = \\theta_0 + \\omega t'],
  keywords: ['unit circle', 'sine cosine', 'trig', 'radians'],
  params: [
    param('angleDeg', 'Start θ', 'deg', 0, 360, 1, 60),
    param('omega', 'ω', 'rad/s', 0.2, 4, 0.1, 0.8),
  ],
  schema: z.object({
    angleDeg: num(0, 360, 60),
    omega: num(0.05, 12, 0.8),
  }),
  run(params) {
    const angleDeg = ((params.angleDeg % 360) + 360) % 360
    const omega = params.omega
    const th0 = (angleDeg * Math.PI) / 180
    const th = `${n(th0)} + ${n(omega)} * time`
    const c0 = Math.cos(th0)
    const s0 = Math.sin(th0)
    const cx = 148
    const cy = 168
    const r = 96
    const px = `${n(cx)} + ${n(r)} * cos(${th})`
    const py = `${n(cy)} - ${n(r)} * sin(${th})`
    const wx0 = 300
    const ww = 170
    const sinPts: string[] = []
    for (let i = 0; i <= 48; i++) {
      const a = (2 * Math.PI * i) / 48
      const x = wx0 + (i / 48) * ww
      const y = cy - r * Math.sin(a)
      sinPts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
    }
    const waveX = `${n(wx0)} + ${n(ww)} * mod(${th}, ${n(2 * Math.PI)}) / ${n(2 * Math.PI)}`
    const waveY = py
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          {
            id: 'eq',
            type: 'text' as const,
            role: 'none' as const,
            props: { x: 28, y: 22, fill: '#334155', fontSize: 12 },
            text: {
              $expr: `concat('θ = ', round(mod((${th}) * 180 / pi + 360, 360), 0), '°')`,
            },
          },
          {
            id: 'cs',
            type: 'text' as const,
            role: 'none' as const,
            props: { x: 28, y: 40, fill: '#334155', fontSize: 12 },
            text: {
              $expr: `concat('cos θ = ', round(cos(${th}), 2), '    sin θ = ', round(sin(${th}), 2))`,
            },
          },
          line('x-axis', { x1: cx - r - 18, y1: cy, x2: cx + r + 22, y2: cy, stroke: '#475569', strokeWidth: 1 }),
          line('y-axis', { x1: cx, y1: cy - r - 18, x2: cx, y2: cy + r + 18, stroke: '#475569', strokeWidth: 1 }),
          arrow('x-arr', {
            x1: cx + r + 14,
            y1: cy,
            x2: cx + r + 28,
            y2: cy,
            stroke: '#475569',
            strokeWidth: 1,
          }),
          arrow('y-arr', {
            x1: cx,
            y1: cy - r - 10,
            x2: cx,
            y2: cy - r - 24,
            stroke: '#475569',
            strokeWidth: 1,
          }),
          circle('circ', { cx, cy, r, fill: 'none', stroke: '#334155', strokeWidth: 2 }),
          label('one-x', cx + r + 6, cy + 16, '1'),
          label('one-y', cx + 8, cy - r - 4, '1'),
          label('xl', cx + r + 20, cy + 16, 'x'),
          label('yl', cx + 8, cy - r - 20, 'y'),
          line('radius', {
            x1: cx,
            y1: cy,
            x2: { $expr: px },
            y2: { $expr: py },
            stroke: '#0f172a',
            strokeWidth: 2,
          }),
          line('cos', {
            x1: cx,
            y1: cy,
            x2: { $expr: px },
            y2: cy,
            stroke: '#2563eb',
            strokeWidth: 3,
          }),
          line('sin', {
            x1: { $expr: px },
            y1: cy,
            x2: { $expr: px },
            y2: { $expr: py },
            stroke: '#dc2626',
            strokeWidth: 3,
          }),
          circle(
            'P',
            {
              cx: { $expr: px },
              cy: { $expr: py },
              r: 6,
              fill: '#7c3aed',
            },
            'projectile'
          ),
          circle('O', { cx, cy, r: 3, fill: '#0f172a' }),
          {
            id: 'Ptag',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: `(${px}) + 8` },
              y: { $expr: `(${py}) - 8` },
              fill: '#334155',
              fontSize: 12,
            },
            text: 'P',
          },
          label('costag', cx - 8, cy + 16, 'cos', '#2563eb'),
          {
            id: 'sintag',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: `(${px}) + 8` },
              y: { $expr: `((${n(cy)}) + (${py})) / 2` },
              fill: '#dc2626',
              fontSize: 12,
            },
            text: 'sin',
          },
          line('wave-x', { x1: wx0, y1: cy, x2: wx0 + ww, y2: cy, stroke: '#475569', strokeWidth: 1 }),
          pathEl('sine', { d: sinPts.join(' '), fill: 'none', stroke: '#dc2626', strokeWidth: 2 }),
          line('link', {
            x1: { $expr: px },
            y1: { $expr: py },
            x2: { $expr: waveX },
            y2: { $expr: waveY },
            stroke: '#a78bfa',
            strokeWidth: 1,
            strokeDasharray: '4 4',
          }),
          line('wave-now', {
            x1: { $expr: waveX },
            y1: cy - r,
            x2: { $expr: waveX },
            y2: cy + r,
            stroke: '#cbd5e1',
            strokeWidth: 1,
            strokeDasharray: '3 3',
          }),
          circle('sin-pt', {
            cx: { $expr: waveX },
            cy: { $expr: waveY },
            r: 5,
            fill: '#dc2626',
          }),
          label('sinl', wx0 + ww - 28, cy + r + 16, 'sin θ'),
        ],
      },
      metrics: {
        angleDeg: Number(angleDeg.toFixed(4)),
        omega,
        theta: Number(th0.toFixed(6)),
        cos: Number(c0.toFixed(6)),
        sin: Number(s0.toFixed(6)),
      },
      warnings: [],
    }
  },
}
