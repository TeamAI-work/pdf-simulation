import { z } from 'zod'
import { apSum, apTerm } from '../math.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const ap_graph: SimFile = {
  id: 'ap_graph',
  domain: 'math',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Arithmetic progression',
  description: 'Terms of an A.P. as dots on a number line, with t_n and S_n',
  equations: ['t_n = a+(n-1)d', 'S_n = \\tfrac n2 [2a+(n-1)d]'],
  keywords: ['arithmetic progression', 'A.P.', 'nth term', 'common difference'],
  params: [
    param('a', 'First term a', '', -20, 20, 1, 2),
    param('d', 'Common difference d', '', -10, 10, 1, 3),
    param('n', 'Number of terms n', '', 2, 12, 1, 5),
  ],
  schema: z.object({
    a: num(-80, 80, 2),
    d: num(-40, 40, 3),
    n: num(1, 30, 5),
  }),
  run(params) {
    const a = params.a
    const d = params.d
    const n = Math.max(1, Math.round(params.n))
    const tn = apTerm(a, d, n)
    const Sn = apSum(a, d, n)
    const terms: number[] = []
    for (let i = 1; i <= n; i++) terms.push(apTerm(a, d, i))
    const minT = Math.min(...terms)
    const maxT = Math.max(...terms)
    const span = Math.max(maxT - minT, 1)
    const x0 = 40
    const x1 = 460
    const y = 160
    const xOf = (t: number) => x0 + ((t - minT) / span) * (x1 - x0)
    const elements = [
      line('axis', { x1: x0, y1: y, x2: x1, y2: y, stroke: '#475569', strokeWidth: 2 }),
      label('eq', 28, 28, `t_n = ${tn},  S_n = ${Sn}`),
      label('ad', 28, 46, `a = ${a}, d = ${d}, n = ${n}`),
    ]
    terms.forEach((t, i) => {
      const x = xOf(t)
      const isLast = i === terms.length - 1
      elements.push(
        circle(`t${i + 1}`, { cx: x, cy: y, r: isLast ? 8 : 6, fill: isLast ? '#fbbf24' : '#38bdf8' })
      )
      elements.push(label(`l${i + 1}`, x - 8, y - 18, String(t)))
    })
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { a, d, n, tn, Sn },
      warnings: [],
    }
  },
}
