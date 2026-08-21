import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

export const angle_of_elevation: SimFile = {
  id: 'angle_of_elevation',
  domain: 'math',
  classBand: '9-10',
  label: 'Angle of elevation',
  ncertClass: 10,
  description: 'Line of sight to the top of a tower makes angle θ with the horizontal; h = d tan θ',
  equations: ['h = d \\tan\\theta', '\\tan\\theta = h / d'],
  keywords: ['angle of elevation', 'angle of depression', 'tan theta', 'height and distance'],
  params: [
    param('angleDeg', 'Angle', 'deg', 10, 70, 1, 30),
    param('distance', 'Distance', 'm', 5, 80, 1, 20),
  ],
  schema: z.object({
    angleDeg: num(5, 80, 30),
    distance: num(1, 200, 20),
  }),
  run(params) {
    const { angleDeg, distance } = params
    const rad = (angleDeg * Math.PI) / 180
    const h = distance * Math.tan(rad)
    const scale = Math.min(300 / Math.max(distance, 1), 140 / Math.max(h, 0.5))
    const x0 = 78
    const ground = 248
    const eyeY = ground - 22
    const x1 = x0 + distance * scale
    const yTop = eyeY - h * scale
    const arcR = Math.min(46, 0.3 * (x1 - x0))
    const arc: string[] = []
    const steps = Math.max(8, Math.round(angleDeg / 4))
    for (let i = 0; i <= steps; i++) {
      const t = (rad * i) / steps
      arc.push(
        `${i === 0 ? 'M' : 'L'} ${(x0 + arcR * Math.cos(t)).toFixed(1)} ${(eyeY - arcR * Math.sin(t)).toFixed(1)}`
      )
    }
    const mid = rad / 2
    const sq = 11
    const ink = '#334155'
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 24, 22, `h = d tan θ = ${h.toFixed(1)}`),
          line('ground', { x1: 36, y1: ground, x2: 470, y2: ground, stroke: ink, strokeWidth: 2 }),
          line('tower', { x1: x1, y1: ground, x2: x1, y2: yTop, stroke: ink, strokeWidth: 2 }),
          line('horiz', {
            x1: x0,
            y1: eyeY,
            x2: x1,
            y2: eyeY,
            stroke: ink,
            strokeWidth: 1,
            strokeDasharray: '5 4',
          }),
          line('sight', { x1: x0, y1: eyeY, x2: x1, y2: yTop, stroke: ink, strokeWidth: 2 }),
          pathEl('arc', { d: arc.join(' '), fill: 'none', stroke: ink, strokeWidth: 1.5 }),
          pathEl('right', {
            d: `M ${x1 - sq} ${eyeY} L ${x1 - sq} ${eyeY - sq} L ${x1} ${eyeY - sq}`,
            fill: 'none',
            stroke: ink,
            strokeWidth: 1.25,
          }),
          circle('eye', { cx: x0, cy: eyeY, r: 3, fill: ink }),
          label('th', x0 + (arcR + 14) * Math.cos(mid) - 4, eyeY - (arcR + 14) * Math.sin(mid), 'θ', ink),
          label('d-tag', (x0 + x1) / 2 - 4, eyeY + 16, 'd', ink),
          label('h-tag', x1 + 10, (eyeY + yTop) / 2 + 4, 'h', ink),
        ],
      },
      metrics: {
        angleDeg,
        distance,
        height: Number(h.toFixed(4)),
      },
      warnings: [],
    }
  },
}
