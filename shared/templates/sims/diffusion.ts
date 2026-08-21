import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, particles, rect, tLoop } from '../stage.js'

export const diffusion: SimFile = {
  id: 'diffusion',
  domain: 'chemistry',
  classBand: '7-10',
  label: 'Diffusion',
  ncertClass: 9,
  description: 'Two gases mix; particles spread faster at higher temperature',
  equations: ['v_{\\mathrm{rms}} \\propto \\sqrt{T}', '\\text{rate of diffusion} \\propto \\sqrt{T}'],
  keywords: ['diffusion', 'perfume', 'spreading of particles', 'mix of gases'],
  params: [param('temperature', 'Temperature', 'K', 200, 600, 10, 300)],
  schema: z.object({
    temperature: num(100, 800, 300),
  }),
  run(params) {
    const T = params.temperature
    const speed = Math.sqrt(T / 300)
    const tMix = 6.5 / Math.max(speed, 0.25)
    const t = tLoop(tMix + 1.8, tMix)
    const frac = `(${t}) / ${n(tMix)}`
    const w0 = 130
    const w1 = 310
    const h = 150
    const cy = 158
    const w = `${n(w0)} + ${n(w1 - w0)} * (${frac})`
    const cxA = `${n(160)} + ${n(90)} * (${frac})`
    const cxB = `${n(340)} - ${n(90)} * (${frac})`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('T', 28, 24, `T = ${T} K`),
          label('rate', 28, 42, `rate ∝ √T`),
          rect('jar', {
            x: 64,
            y: 54,
            width: 372,
            height: 208,
            fill: '#f8fafc',
            stroke: '#334155',
            strokeWidth: 3,
            rx: 6,
          }),
          line('partition', {
            x1: 250,
            y1: 58,
            x2: 250,
            y2: 258,
            stroke: '#94a3b8',
            strokeWidth: 2,
            strokeDasharray: '6 6',
          }),
          particles('gasA', {
            cx: { $expr: cxA },
            cy,
            width: { $expr: w },
            height: h,
            count: 14,
            speed: 0.5 + speed,
            r: 5,
            fill: '#7c3aed',
            time: { $expr: 'time' },
          }),
          particles('gasB', {
            cx: { $expr: cxB },
            cy,
            width: { $expr: w },
            height: h,
            count: 14,
            speed: 0.5 + speed,
            r: 5,
            fill: '#0284c7',
            time: { $expr: 'time' },
          }),
          circle('legA', { cx: 28, cy: 268, r: 5, fill: '#7c3aed' }),
          circle('legB', { cx: 108, cy: 268, r: 5, fill: '#0284c7' }),
          label('nameA', 38, 272, 'A'),
          label('nameB', 118, 272, 'B'),
        ],
      },
      metrics: { temperature: T, speed: Number(speed.toFixed(4)) },
      warnings: [],
    }
  },
}
