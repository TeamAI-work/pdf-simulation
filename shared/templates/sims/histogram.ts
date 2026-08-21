import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl, rect } from '../stage.js'

export const histogram: SimFile = {
  id: 'histogram',
  domain: 'math',
  classBand: '9-10',
  ncertClass: 9,
  label: 'Histogram',
  description: 'Frequency histogram with equal class width; optional cumulative polyline',
  equations: ['n = \\sum f_i'],
  keywords: ['histogram', 'frequency distribution', 'class interval', 'ogive'],
  params: [
    param('binStart', 'First class start', '', 0, 100, 1, 0),
    param('binWidth', 'Class width', '', 1, 40, 1, 10),
    param('f1', 'f₁', '', 0, 40, 1, 4),
    param('f2', 'f₂', '', 0, 40, 1, 8),
    param('f3', 'f₃', '', 0, 40, 1, 6),
    param('f4', 'f₄', '', 0, 40, 1, 3),
    param('f5', 'f₅', '', 0, 40, 1, 1),
  ],
  schema: z.object({
    binStart: num(-50, 400, 0),
    binWidth: num(0.5, 100, 10),
    f1: num(0, 200, 4),
    f2: num(0, 200, 8),
    f3: num(0, 200, 6),
    f4: num(0, 200, 3),
    f5: num(0, 200, 1),
  }),
  run(params) {
    const freqs = [params.f1, params.f2, params.f3, params.f4, params.f5]
    const n = freqs.reduce((s, v) => s + v, 0)
    const fMax = Math.max(...freqs, 1)
    const x0 = 50
    const y0 = 250
    const plotW = 400
    const plotH = 190
    const barW = plotW / 5
    const colors = ['#38bdf8', '#7dd3fc', '#38bdf8', '#7dd3fc', '#38bdf8']
    const elements = [
      line('x-axis', { x1: x0, y1: y0, x2: x0 + plotW, y2: y0, stroke: '#475569', strokeWidth: 1 }),
      line('y-axis', { x1: x0, y1: y0 - plotH, x2: x0, y2: y0, stroke: '#475569', strokeWidth: 1 }),
      label('title', 28, 28, `n = ${n}   width = ${params.binWidth}`),
    ]
    const ogive: string[] = []
    let cum = 0
    freqs.forEach((f, i) => {
      const h = (f / fMax) * plotH
      const x = x0 + i * barW
      elements.push(
        rect(`h${i + 1}`, {
          x,
          y: y0 - h,
          width: barW,
          height: h,
          fill: colors[i],
          stroke: '#0f172a',
          strokeWidth: 1,
        })
      )
      const lo = params.binStart + i * params.binWidth
      elements.push(label(`c${i + 1}`, x + 4, y0 + 16, String(lo)))
      cum += f
      const ox = x + barW
      const oy = y0 - (cum / Math.max(n, 1)) * plotH
      ogive.push(`${i === 0 ? 'M' : 'L'} ${ox.toFixed(1)} ${oy.toFixed(1)}`)
    })
    elements.push(pathEl('ogive', { d: ogive.join(' '), stroke: '#f472b6', fill: 'none', strokeWidth: 2 }))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: {
        n,
        binStart: params.binStart,
        binWidth: params.binWidth,
        f1: params.f1,
        f2: params.f2,
        f3: params.f3,
        f4: params.f4,
        f5: params.f5,
      },
      warnings: [],
    }
  },
}
