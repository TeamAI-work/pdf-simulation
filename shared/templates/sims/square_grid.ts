import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const square_grid: SimFile = {
  id: 'square_grid',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 8,
  label: 'Square grid',
  description: 'An n × n square of unit cells; n² and √n when n is a perfect square',
  equations: ['n^2', '\\sqrt{n^2} = n'],
  keywords: ['square number', 'square root', '8×8', 'perfect square'],
  params: [param('n', 'n', '', 1, 12, 1, 5)],
  schema: z.object({
    n: num(1, 20, 5),
  }),
  run(params) {
    const n = Math.max(1, Math.round(params.n))
    const n2 = n * n
    const root = Math.sqrt(n)
    const perfect = Number.isInteger(root)
    const shown = Math.min(n, 10)
    const cell = 180 / shown
    const x0 = 160
    const y0 = 60
    const elements = [
      label('eq', 28, 28, `n² = ${n2}`),
      label('rt', 28, 46, perfect ? `√${n2} = ${n}` : `√${n} ≈ ${root.toFixed(3)} (not a perfect square)`),
    ]
    for (let r = 0; r < shown; r++) {
      for (let c = 0; c < shown; c++) {
        elements.push(
          rect(`c${r}-${c}`, {
            x: x0 + c * cell,
            y: y0 + r * cell,
            width: cell - 1,
            height: cell - 1,
            fill: '#38bdf8',
            stroke: '#0f172a',
            strokeWidth: 1,
          })
        )
      }
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { n, n2, sqrt: Number(root.toFixed(4)), perfect },
      warnings: n > 10 ? [`grid drawn as ${shown}×${shown} for clarity`] : [],
    }
  },
}
