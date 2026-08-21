import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const inverse_graph: SimFile = {
  id: 'inverse_graph',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 8,
  label: 'Inverse proportion',
  description: 'xy = k drawn as y = k/x in the first quadrant',
  equations: ['xy = k', 'y = k/x'],
  keywords: ['inverse proportion', 'inverse variation', 'xy = k', 'y = k/x'],
  params: [param('k', 'Constant k', '', 1, 40, 0.5, 12)],
  schema: z.object({
    k: num(0.25, 80, 12),
  }),
  run(params) {
    const { k } = params
    const ox = 50
    const oy = 260
    const scale = 18
    const pts: string[] = []
    const xMax = 18
    for (let i = 1; i <= 36; i++) {
      const x = 0.5 + ((xMax - 0.5) * (i - 1)) / 35
      const y = k / x
      const px = ox + x * scale
      const py = oy - y * scale
      pts.push(`${i === 1 ? 'M' : 'L'} ${px.toFixed(1)} ${Math.max(20, py).toFixed(1)}`)
    }
    const sampleX = Math.sqrt(k)
    const sampleY = k / sampleX
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('x-axis', { x1: ox, y1: oy, x2: 470, y2: oy, stroke: '#475569', strokeWidth: 1 }),
          line('y-axis', { x1: ox, y1: 20, x2: ox, y2: oy, stroke: '#475569', strokeWidth: 1 }),
          pathEl('curve', { d: pts.join(' '), stroke: '#a78bfa', fill: 'none', strokeWidth: 2.5 }),
          circle('sample', { cx: ox + sampleX * scale, cy: oy - sampleY * scale, r: 6, fill: '#f472b6' }),
          label('eq', 28, 28, `xy = ${k}`),
          label('pt', 28, 46, `example (${sampleX.toFixed(1)}, ${sampleY.toFixed(1)})`),
        ],
      },
      metrics: { k, sampleX: Number(sampleX.toFixed(4)), sampleY: Number(sampleY.toFixed(4)) },
      warnings: [],
    }
  },
}
