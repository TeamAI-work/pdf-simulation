import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, rect } from '../stage.js'

export const equation_balance: SimFile = {
  id: 'equation_balance',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 7,
  label: 'Equation balance',
  description: 'Solve ax + b = c by keeping both pans equal',
  equations: ['ax + b = c', 'x = (c - b)/a'],
  keywords: ['simple equation', 'linear equation one variable', 'pan balance', 'solve for x', 'ax + b'],
  params: [
    param('coeff', 'Coefficient a', '', 1, 12, 1, 2),
    param('addend', 'Addend b', '', -20, 20, 1, 3),
    param('rhs', 'Right side c', '', -20, 40, 1, 11),
  ],
  schema: z.object({
    coeff: num(-20, 20, 2),
    addend: num(-80, 80, 3),
    rhs: num(-80, 80, 11),
  }),
  run(params) {
    const coeff = params.coeff
    const addend = params.addend
    const rhs = params.rhs
    const warnings: string[] = []
    let x = 0
    if (Math.abs(coeff) < 1e-9) {
      warnings.push('Coefficient a cannot be 0')
    } else {
      x = (rhs - addend) / coeff
    }
    const tilt = Math.max(-12, Math.min(12, (rhs - (coeff * x + addend)) * 2))
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('beam', { x1: 90, y1: 140 + tilt, x2: 410, y2: 140 - tilt, stroke: '#94a3b8', strokeWidth: 6 }),
          line('post', { x1: 250, y1: 80, x2: 250, y2: 140, stroke: '#64748b', strokeWidth: 4 }),
          rect('left', { x: 70, y: 150 + tilt, width: 90, height: 50, fill: '#38bdf8', rx: 4 }),
          rect('right', { x: 340, y: 150 - tilt, width: 90, height: 50, fill: '#f472b6', rx: 4 }),
          label('L', 88, 180 + tilt, `${coeff}x+${addend}`),
          label('R', 360, 180 - tilt, String(rhs)),
          label('eq', 28, 28, `${coeff}x + ${addend} = ${rhs}`),
          label('sol', 28, 46, `x = ${x}`),
        ],
      },
      metrics: { coeff, addend, rhs, x: Number(x.toFixed(4)) },
      warnings,
    }
  },
}
