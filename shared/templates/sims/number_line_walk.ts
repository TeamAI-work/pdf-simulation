import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, tLoop } from '../stage.js'

export const number_line_walk: SimFile = {
  id: 'number_line_walk',
  domain: 'math',
  classBand: '6-8',
  label: 'Number line walk',
  ncertClass: 6,
  description: 'A token walks from start by delta on a numbered line',
  equations: ['x = \\text{start} + \\delta'],
  keywords: ['number line', 'integers', 'add on number line', 'directed number'],
  params: [
    param('start', 'Start', '', -20, 20, 1, 0),
    param('delta', 'Delta', '', -15, 15, 1, 5),
  ],
  schema: z.object({
    start: num(-50, 50, 0),
    delta: num(-40, 40, 5),
  }),
  run(params) {
    const start = Math.round(params.start)
    const delta = Math.round(params.delta)
    const end = start + delta
    const lo = Math.min(start, end, 0) - 1
    const hi = Math.max(start, end, 0) + 1
    const span = Math.max(hi - lo, 1)
    const xL = 40
    const xR = 460
    const y = 170
    const xOf = (v: number) => xL + ((v - lo) / span) * (xR - xL)
    const step = span > 40 ? 5 : span > 22 ? 2 : 1
    const x0 = xOf(start)
    const x1 = xOf(end)
    const t = tLoop(2.6, 2.1)
    const elements = [
      label(
        'eq',
        28,
        26,
        `${start} ${delta >= 0 ? '+' : '−'} ${Math.abs(delta)} = ${end}`
      ),
      line('axis', { x1: 28, y1: y, x2: 472, y2: y, stroke: '#334155', strokeWidth: 2.5 }),
      arrow('right', { x1: 468, y1: y, x2: 486, y2: y, stroke: '#334155', strokeWidth: 2.5 }),
      arrow('left', { x1: 32, y1: y, x2: 14, y2: y, stroke: '#334155', strokeWidth: 2.5 }),
    ]
    for (let v = lo; v <= hi; v++) {
      const x = xOf(v)
      const major = v % step === 0
      const isZero = v === 0
      elements.push(
        line(`tick-${v}`, {
          x1: x,
          y1: y - (isZero ? 12 : major ? 8 : 4),
          x2: x,
          y2: y + (isZero ? 12 : major ? 8 : 4),
          stroke: isZero ? '#0f172a' : '#64748b',
          strokeWidth: isZero ? 2.5 : 1.5,
        })
      )
      if (major) {
        elements.push(label(`n-${v}`, x - (v < 0 ? 8 : 4), y + 28, String(v), isZero ? '#0f172a' : '#334155'))
      }
    }
    if (delta !== 0) {
      elements.push(
        arrow('hop', {
          x1: x0,
          y1: y - 36,
          x2: x1,
          y2: y - 36,
          stroke: delta > 0 ? '#16a34a' : '#dc2626',
          strokeWidth: 3,
        })
      )
      elements.push(
        label('d-tag', (x0 + x1) / 2 - 10, y - 48, delta > 0 ? `+${delta}` : String(delta), delta > 0 ? '#16a34a' : '#dc2626')
      )
    }
    elements.push(
      circle('start', { cx: x0, cy: y, r: 5, fill: '#94a3b8' }),
      circle(
        'dot',
        {
          cx: { $expr: `${n(x0)} + (${n(x1 - x0)}) * min(1, (${t}) / 2.1)` },
          cy: y,
          r: 9,
          fill: '#2563eb',
        },
        'projectile'
      )
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { start, delta, end },
      warnings: [],
    }
  },
}
