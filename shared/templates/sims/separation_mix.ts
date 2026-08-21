import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, particles, pathEl, rect, tLoop } from '../stage.js'

export const separation_mix: SimFile = {
  id: 'separation_mix',
  domain: 'chemistry',
  classBand: '6-8',
  ncertClass: 6,
  label: 'Separating mixtures',
  description: 'Method 0 sedimentation, 1 filtration, 2 magnetic separation',
  equations: ['\\text{heterogeneous mixture} \\rightarrow \\text{components}'],
  keywords: ['sedimentation', 'filtration', 'magnetic separation', 'separating mixtures', 'heterogeneous mixture'],
  params: [
    choice('method', 'Method', [
      { value: 0, label: 'Sedimentation' },
      { value: 1, label: 'Filtration' },
      { value: 2, label: 'Magnetic' },
    ], 0),
  ],
  schema: z.object({
    method: num(0, 2, 0),
  }),
  run(params) {
    const method = Math.round(Math.max(0, Math.min(2, params.method)))
    const names = ['sedimentation', 'filtration', 'magnetic separation'] as const
    const ink = '#334155'
    const sand = '#a16207'
    const water = '#7dd3fc'
    const t = tLoop(3.6, 3.2)
    const frac = `(${t}) / 3.2`
    const elements = [label('m', 24, 22, names[method], ink)]

    if (method === 0) {
      const x = 170
      const yTop = 52
      const yBot = 252
      const w = 160
      elements.push(
        rect('water', {
          x: x + 4,
          y: yTop + 28,
          width: w - 8,
          height: yBot - yTop - 32,
          fill: water,
        }),
        pathEl('beaker', {
          d: `M ${x} ${yTop} L ${x} ${yBot} L ${x + w} ${yBot} L ${x + w} ${yTop}`,
          fill: 'none',
          stroke: ink,
          strokeWidth: 2.5,
        }),
        rect('sediment', {
          x: x + 5,
          y: { $expr: `${n(yBot - 12)} - ${n(40)} * (${frac})` },
          width: w - 10,
          height: { $expr: `${n(8)} + ${n(40)} * (${frac})` },
          fill: sand,
        }),
        particles('sand', {
          cx: x + w / 2,
          cy: { $expr: `${n(130)} + ${n(85)} * (${frac})` },
          width: w - 28,
          height: { $expr: `${n(120)} - ${n(88)} * (${frac})` },
          count: 16,
          speed: { $expr: `0.55 - 0.4 * (${frac})` },
          r: 4.5,
          fill: sand,
          time: { $expr: 'time' },
        }),
        label('lw', x + w + 16, 100, 'water', ink),
        label('ls', x + w + 16, 238, 'sand', ink)
      )
    } else if (method === 1) {
      const fx = 250
      elements.push(
        pathEl('funnel', {
          d: 'M 155 48 L 236 142 L 236 188 M 264 188 L 264 142 L 345 48',
          fill: 'none',
          stroke: ink,
          strokeWidth: 2.5,
        }),
        pathEl('paper', {
          d: 'M 168 62 L 250 138 L 332 62',
          fill: 'none',
          stroke: ink,
          strokeWidth: 1.5,
          strokeDasharray: '5 4',
        }),
        particles('residue', {
          cx: fx,
          cy: 108,
          width: 90,
          height: 36,
          count: 12,
          speed: 0.12,
          r: 4.5,
          fill: sand,
          time: { $expr: 'time' },
        }),
        pathEl('beaker', {
          d: 'M 190 198 L 190 268 L 310 268 L 310 198',
          fill: 'none',
          stroke: ink,
          strokeWidth: 2.5,
        }),
        rect('filtrate', {
          x: 194,
          y: { $expr: `${n(264)} - (${n(18)} + ${n(42)} * (${frac}))` },
          width: 112,
          height: { $expr: `${n(18)} + ${n(42)} * (${frac})` },
          fill: water,
        }),
        circle('drop', {
          cx: fx,
          cy: { $expr: `${n(155)} + ${n(38)} * min(1, mod(time, 0.9) / 0.7)` },
          r: 4,
          fill: '#0369a1',
        }),
        label('lr', 28, 70, 'residue', ink),
        label('lf', 324, 250, 'filtrate', ink)
      )
    } else {
      elements.push(
        rect('dish', {
          x: 70,
          y: 188,
          width: 240,
          height: 14,
          fill: '#e2e8f0',
          stroke: ink,
          strokeWidth: 1.5,
        }),
        particles('sand', {
          cx: 160,
          cy: 178,
          width: 150,
          height: 22,
          count: 14,
          speed: 0.08,
          r: 4,
          fill: sand,
          time: { $expr: 'time' },
        }),
        particles('iron', {
          cx: { $expr: `${n(150)} + ${n(170)} * (${frac})` },
          cy: { $expr: `${n(176)} - ${n(62)} * (${frac})` },
          width: { $expr: `${n(90)} - ${n(40)} * (${frac})` },
          height: { $expr: `${n(24)} + ${n(16)} * (${frac})` },
          count: 12,
          speed: 0.2,
          r: 4.5,
          fill: ink,
          time: { $expr: 'time' },
        }),
        rect('mag', {
          x: 338,
          y: 92,
          width: 88,
          height: 32,
          fill: '#f8fafc',
          stroke: ink,
          strokeWidth: 2,
          rx: 4,
        }),
        line('mag-split', { x1: 382, y1: 92, x2: 382, y2: 124, stroke: ink, strokeWidth: 1.5 }),
        label('N', 350, 114, 'N', ink),
        label('S', 396, 114, 'S', ink),
        label('ls', 70, 172, 'sand', ink),
        label('li', 70, 70, 'iron', ink)
      )
    }

    return {
      stage: { viewBox: VIEW, elements },
      metrics: { method, name: names[method] },
      warnings: [],
    }
  },
}
