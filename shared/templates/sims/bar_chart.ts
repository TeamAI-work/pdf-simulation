import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, rect } from '../stage.js'

export const bar_chart: SimFile = {
  id: 'bar_chart',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 6,
  label: 'Bar chart',
  description: 'Up to five bars from a data table; a bar with value 0 is hidden',
  equations: ['total = v_1 + \\cdots + v_5'],
  keywords: ['bar graph', 'bar chart', 'pictograph', 'tally chart', 'data handling'],
  params: [
    param('v1', 'v₁', '', 0, 50, 1, 8),
    param('v2', 'v₂', '', 0, 50, 1, 12),
    param('v3', 'v₃', '', 0, 50, 1, 5),
    param('v4', 'v₄', '', 0, 50, 1, 0),
    param('v5', 'v₅', '', 0, 50, 1, 0),
  ],
  schema: z.object({
    v1: num(0, 200, 8),
    v2: num(0, 200, 12),
    v3: num(0, 200, 5),
    v4: num(0, 200, 0),
    v5: num(0, 200, 0),
  }),
  run(params) {
    const values = [params.v1, params.v2, params.v3, params.v4, params.v5]
    const total = values.reduce((s, v) => s + v, 0)
    const max = Math.max(...values, 1)
    const colors = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa']
    const baseY = 250
    const maxH = 190
    const elements = [
      label('title', 28, 28, `total = ${total}, max = ${max}`),
    ]
    values.forEach((v, i) => {
      if (v <= 0) return
      const h = (v / max) * maxH
      const x = 60 + i * 80
      elements.push(
        rect(`b${i + 1}`, {
          x,
          y: baseY - h,
          width: 48,
          height: h,
          fill: colors[i],
          rx: 3,
        })
      )
      elements.push(label(`n${i + 1}`, x + 12, baseY + 18, String(v)))
    })
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { total, max, v1: params.v1, v2: params.v2, v3: params.v3, v4: params.v4, v5: params.v5 },
      warnings: [],
    }
  },
}
