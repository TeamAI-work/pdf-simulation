import { z } from 'zod'
import { mirrorImage } from '../physics.js'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line } from '../stage.js'

export const mirror_ray: SimFile = {
  id: 'mirror_ray',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Spherical mirror',
  description: 'Concave (kind 0) or convex (kind 1) image from object distance u and |f|',
  equations: ['\\frac{1}{v} + \\frac{1}{u} = \\frac{1}{f}', 'm = -v/u'],
  keywords: ['concave mirror', 'convex mirror', 'mirror formula', 'focal length mirror', 'spherical mirror'],
  params: [
    param('u', 'Object distance u', 'cm', 4, 80, 1, 30),
    param('f', '|f|', 'cm', 4, 40, 1, 10),
    choice('kind', 'Mirror', [
      { value: 0, label: 'Concave' },
      { value: 1, label: 'Convex' },
    ], 0),
  ],
  schema: z.object({
    u: num(1, 200, 30),
    f: num(1, 80, 10),
    kind: num(0, 1, 0),
  }),
  run(params) {
    const { u, f } = params
    const convex = params.kind >= 0.5
    const { v, m, real } = mirrorImage(u, f, convex ? 1 : 0)
    const mx = 380
    const axisY = 160
    const scale = 3.2
    const objX = mx - u * scale
    const imgX = mx - v * scale
    const objH = 40
    const imgH = Math.max(8, Math.min(70, Math.abs(m) * objH))
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('axis', { x1: 20, y1: axisY, x2: 480, y2: axisY, stroke: '#64748b', strokeWidth: 1 }),
          line('mirror', {
            x1: mx,
            y1: 70,
            x2: mx,
            y2: 250,
            stroke: convex ? '#a78bfa' : '#38bdf8',
            strokeWidth: 5,
          }),
          circle('F', { cx: mx - (convex ? -1 : 1) * Math.abs(f) * scale, cy: axisY, r: 4, fill: '#fbbf24' }),
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
          label('kind', 28, 28, convex ? 'Convex mirror' : 'Concave mirror'),
          label('vm', 28, 46, `v = ${v.toFixed(1)} cm   m = ${m.toFixed(2)}   ${real ? 'real' : 'virtual'}`),
        ],
      },
      metrics: {
        u,
        f,
        kind: convex ? 1 : 0,
        v: Number(v.toFixed(4)),
        m: Number(m.toFixed(4)),
        real,
      },
      warnings: [],
    }
  },
}
