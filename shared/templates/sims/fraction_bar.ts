import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const fraction_bar: SimFile = {
  id: 'fraction_bar',
  domain: 'math',
  classBand: '6-8',
  label: 'Fraction bar',
  ncertClass: 6,
  description: 'Shaded parts of a bar: numerator / denominator',
  equations: ['\\text{fraction} = a/b'],
  keywords: ['fraction', 'numerator', 'denominator', 'proper fraction', 'shaded parts'],
  params: [
    param('numerator', 'Numerator', '', 0, 12, 1, 3),
    param('denominator', 'Denominator', '', 1, 12, 1, 5),
  ],
  schema: z.object({
    numerator: num(0, 20, 3),
    denominator: num(1, 20, 5),
  }),
  run(params) {
    const den = Math.max(1, Math.round(params.denominator))
    const nume = Math.min(den, Math.max(0, Math.round(params.numerator)))
    const boxW = 400 / den
    const elements = [
      label('f', 28, 28, `${nume}/${den} = ${(nume / den).toFixed(2)}`),
    ]
    for (let i = 0; i < den; i++) {
      elements.push(
        rect(`cell-${i}`, {
          x: 50 + i * boxW,
          y: 110,
          width: boxW - 4,
          height: 70,
          fill: i < nume ? '#38bdf8' : '#1e293b',
          stroke: '#64748b',
          strokeWidth: 1,
        })
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { numerator: nume, denominator: den, value: Number((nume / den).toFixed(4)) },
      warnings: [],
    }
  },
}
