import { z } from 'zod'
import { lensImageDistance } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line } from '../stage.js'

export const convex_lens: SimFile = {
  id: 'convex_lens',
  domain: 'physics',
  classBand: '9-10',
  label: 'Convex lens',
  ncertClass: 10,
  description: 'Real/virtual image from object distance u and focal length f',
  equations: ['\\frac{1}{v} - \\frac{1}{u} = \\frac{1}{f}', 'm = -v/u'],
  keywords: ['convex lens', 'focal length', 'image distance', 'lens formula', 'real image'],
  params: [
    param('u', 'Object distance u', 'cm', 4, 80, 1, 30),
    param('f', 'Focal length f', 'cm', 4, 40, 1, 15),
  ],
  schema: z.object({
    u: num(1, 200, 30),
    f: num(1, 80, 15),
  }),
  run(params) {
    const { u, f } = params
    const { v, real, m } = lensImageDistance(u, f)
    const lensX = 250
    const axisY = 160
    const scale = 4
    const objX = lensX - u * scale
    const imgX = real ? lensX + Math.min(Math.abs(v), 55) * scale : lensX - Math.min(Math.abs(v), 40) * scale
    const objH = 40
    const imgH = Math.max(8, Math.min(70, Math.abs(m) * objH))
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('axis', { x1: 20, y1: axisY, x2: 480, y2: axisY, stroke: '#64748b', strokeWidth: 1 }),
          line('lens', { x1: lensX, y1: 70, x2: lensX, y2: 250, stroke: '#38bdf8', strokeWidth: 4 }),
          circle('F', { cx: lensX + f * scale, cy: axisY, r: 4, fill: '#fbbf24' }),
          arrow('object', {
            x1: objX,
            y1: axisY,
            x2: objX,
            y2: axisY - objH,
            stroke: '#22c55e',
            strokeWidth: 3,
          }),
          arrow('image', {
            x1: imgX,
            y1: axisY,
            x2: imgX,
            y2: real ? axisY + imgH : axisY - imgH,
            stroke: real ? '#f472b6' : '#a78bfa',
            strokeWidth: 3,
          }),
          label('v', 28, 28, real ? `v = ${v.toFixed(1)} cm (real)` : `v = ${v.toFixed(1)} cm (virtual)`),
          label('m', 28, 46, `m = ${m.toFixed(2)}   u=${u} cm  f=${f} cm`),
        ],
      },
      metrics: { v: Number(v.toFixed(4)), real, magnification: Number(m.toFixed(4)) },
      warnings: [],
    }
  },
}
