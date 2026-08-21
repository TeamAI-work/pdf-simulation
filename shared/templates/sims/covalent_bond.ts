import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, tLoop } from '../stage.js'

export const covalent_bond: SimFile = {
  id: 'covalent_bond',
  domain: 'chemistry',
  classBand: '9-10',
  label: 'Covalent bond',
  ncertClass: 9,
  description: 'Shared electron pair between two atoms',
  equations: ['\\text{shared pair in the overlap region}'],
  keywords: ['covalent bond', 'covalent bonding', 'shared electrons', 'molecule H2', 'overlap'],
  params: [param('duration', 'Duration', 's', 1, 8, 0.5, 3)],
  schema: z.object({
    duration: num(0.5, 12, 3),
  }),
  run(params) {
    const d = params.duration
    const t = tLoop(d + 0.8, d)
    const frac = `(${t}) / ${n(d)}`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          circle('a', { cx: { $expr: `${n(180)} + ${n(30)} * (${frac})` }, cy: 160, r: 28, fill: '#22c55e88' }),
          circle('b', { cx: { $expr: `${n(320)} - ${n(30)} * (${frac})` }, cy: 160, r: 28, fill: '#38bdf888' }),
          circle(
            'e1',
            {
              cx: { $expr: `250 + 18 * cos(time * 3)` },
              cy: { $expr: `160 + 12 * sin(time * 3)` },
              r: 5,
              fill: '#fbbf24',
            },
            'projectile'
          ),
          circle('e2', {
            cx: { $expr: `250 + 18 * cos(time * 3 + 3.14)` },
            cy: { $expr: `160 + 12 * sin(time * 3 + 3.14)` },
            r: 5,
            fill: '#fbbf24',
          }),
          label('title', 28, 28, 'Shared pair (covalent)'),
          label('d', 28, 46, `duration = ${d} s`),
        ],
      },
      metrics: { duration: d },
      warnings: [],
    }
  },
}
