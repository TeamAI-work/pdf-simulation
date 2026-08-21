import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const ratio_bars: SimFile = {
  id: 'ratio_bars',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 7,
  label: 'Ratio bars',
  description: 'Two quantities as bars and as percentages of the whole',
  equations: ['A:B', '\\%A = 100A/(A+B)'],
  keywords: ['comparing quantities', 'percentage', 'ratio', 'percent of a quantity'],
  params: [
    param('partA', 'Part A', '', 1, 80, 1, 30),
    param('partB', 'Part B', '', 1, 80, 1, 70),
  ],
  schema: z.object({
    partA: num(0, 400, 30),
    partB: num(0, 400, 70),
  }),
  run(params) {
    const { partA, partB } = params
    const whole = Math.max(partA + partB, 1e-9)
    const pctA = (100 * partA) / whole
    const pctB = (100 * partB) / whole
    const maxH = 180
    const maxV = Math.max(partA, partB, 1)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('barA', {
            x: 140,
            y: 250 - (partA / maxV) * maxH,
            width: 70,
            height: (partA / maxV) * maxH,
            fill: '#38bdf8',
            rx: 4,
          }),
          rect('barB', {
            x: 280,
            y: 250 - (partB / maxV) * maxH,
            width: 70,
            height: (partB / maxV) * maxH,
            fill: '#f472b6',
            rx: 4,
          }),
          label('eq', 28, 28, `A:B = ${partA}:${partB}`),
          label('pct', 28, 46, `A = ${pctA.toFixed(1)}%    B = ${pctB.toFixed(1)}%`),
          label('la', 155, 268, 'A'),
          label('lb', 295, 268, 'B'),
        ],
      },
      metrics: {
        partA,
        partB,
        pctA: Number(pctA.toFixed(4)),
        pctB: Number(pctB.toFixed(4)),
      },
      warnings: [],
    }
  },
}
