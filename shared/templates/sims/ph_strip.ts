import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

function phColor(pH: number): string {
  if (pH < 3) return '#ef4444'
  if (pH < 5) return '#f97316'
  if (pH < 6.5) return '#eab308'
  if (pH < 7.5) return '#22c55e'
  if (pH < 9) return '#38bdf8'
  if (pH < 11) return '#6366f1'
  return '#a855f7'
}

function phKind(pH: number): 'acid' | 'base' | 'neutral' {
  if (pH < 7) return 'acid'
  if (pH > 7) return 'base'
  return 'neutral'
}

export const ph_strip: SimFile = {
  id: 'ph_strip',
  domain: 'chemistry',
  classBand: '7-10',
  ncertClass: 7,
  label: 'pH strip',
  description: 'Universal indicator colour and acid / base / neutral from pH',
  equations: ['\\text{acid } pH < 7,\\; \\text{neutral } pH = 7,\\; \\text{base } pH > 7'],
  keywords: ['ph scale', 'ph value', 'ph strip', 'universal indicator', 'acids bases salts', 'litmus'],
  params: [param('pH', 'pH', '', 0, 14, 0.5, 7)],
  schema: z.object({
    pH: num(0, 14, 7),
  }),
  run(params) {
    const pH = params.pH
    const kind = phKind(pH)
    const bands = [
      { pH: 1, fill: '#ef4444' },
      { pH: 3, fill: '#f97316' },
      { pH: 5, fill: '#eab308' },
      { pH: 7, fill: '#22c55e' },
      { pH: 9, fill: '#38bdf8' },
      { pH: 11, fill: '#6366f1' },
      { pH: 13, fill: '#a855f7' },
    ]
    const x0 = 80
    const w = 48
    const elements = [
      label('eq', 28, 28, `pH = ${pH}  →  ${kind}`),
      label('note', 28, 46, 'Universal indicator scale'),
      rect('dip', { x: 420, y: 80, width: 36, height: 160, fill: phColor(pH), stroke: '#94a3b8', strokeWidth: 2, rx: 4 }),
    ]
    bands.forEach((b, i) => {
      elements.push(
        rect(`band-${i}`, {
          x: x0 + i * w,
          y: 110,
          width: w - 4,
          height: 90,
          fill: b.fill,
          rx: 3,
        }),
        label(`n-${i}`, x0 + i * w + 8, 220, String(b.pH), '#94a3b8')
      )
    })
    const markerX = x0 + (pH / 14) * (bands.length * w)
    elements.push(rect('tick', { x: markerX - 2, y: 96, width: 4, height: 118, fill: '#e2e8f0' }))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { pH, kind },
      warnings: [],
    }
  },
}
