import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, pathEl, tLoop } from '../stage.js'

export const probability_spinner: SimFile = {
  id: 'probability_spinner',
  domain: 'math',
  classBand: '8-10',
  ncertClass: 8,
  label: 'Probability spinner',
  description: 'P(E) = favourable / total equally likely outcomes',
  equations: ['P(E) = n(E)/n(S)'],
  keywords: ['probability', 'equally likely', 'spinner', 'favourable outcomes'],
  params: [
    param('favorable', 'Favourable', '', 1, 12, 1, 2),
    param('total', 'Total', '', 2, 12, 1, 6),
  ],
  schema: z.object({
    favorable: num(0, 40, 2),
    total: num(1, 40, 6),
  }),
  run(params) {
    const total = Math.max(1, Math.round(params.total))
    const favorable = Math.min(total, Math.max(0, Math.round(params.favorable)))
    const P = favorable / total
    const cx = 250
    const cy = 160
    const R = 90
    const slice = (2 * Math.PI) / total
    const elements = [
      circle('disk', { cx, cy, r: R, fill: '#1e293b', stroke: '#64748b', strokeWidth: 2 }),
      label('eq', 28, 28, `P = ${favorable}/${total} = ${P.toFixed(3)}`),
    ]
    for (let i = 0; i < total; i++) {
      const a0 = -Math.PI / 2 + i * slice
      const a1 = a0 + slice
      const x1 = cx + R * Math.cos(a0)
      const y1 = cy + R * Math.sin(a0)
      const x2 = cx + R * Math.cos(a1)
      const y2 = cy + R * Math.sin(a1)
      const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`
      elements.push(
        pathEl(`s${i}`, {
          d,
          fill: i < favorable ? '#38bdf8' : '#334155',
          stroke: '#0f172a',
          strokeWidth: 1,
        })
      )
    }
    const spin = tLoop(4, 4)
    const ang = `(-1.5708 + 6.2832 * (${spin}) / 4)`
    elements.push(
      line('needle', {
        x1: cx,
        y1: cy,
        x2: { $expr: `${n(cx)} + ${n(R - 8)} * cos(${ang})` },
        y2: { $expr: `${n(cy)} + ${n(R - 8)} * sin(${ang})` },
        stroke: '#fbbf24',
        strokeWidth: 3,
      })
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { favorable, total, P: Number(P.toFixed(4)) },
      warnings: params.favorable > params.total ? ['favourable clamped to total'] : [],
    }
  },
}
