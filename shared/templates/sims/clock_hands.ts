import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const clock_hands: SimFile = {
  id: 'clock_hands',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 4,
  label: 'Clock hands',
  description: 'Angle between hour and minute hands',
  equations: ['\\theta = |30H - 5.5M|', '\\theta = \\min(\\theta, 360-\\theta)'],
  keywords: ['clock', 'elapsed time', '12-hour', 'angle between hands'],
  params: [
    param('hours', 'Hours', '', 0, 12, 1, 3),
    param('minutes', 'Minutes', '', 0, 59, 1, 0),
  ],
  schema: z.object({
    hours: num(0, 23, 3),
    minutes: num(0, 59, 0),
  }),
  run(params) {
    const hours = ((Math.round(params.hours) % 12) + 12) % 12
    const minutes = Math.max(0, Math.min(59, Math.round(params.minutes)))
    const raw = Math.abs(30 * hours - 5.5 * minutes)
    const angle = Math.min(raw, 360 - raw)
    const cx = 250
    const cy = 155
    const R = 90
    const minAng = (minutes / 60) * 2 * Math.PI - Math.PI / 2
    const hourAng = ((hours + minutes / 60) / 12) * 2 * Math.PI - Math.PI / 2
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          circle('face', { cx, cy, r: R, fill: 'none', stroke: '#94a3b8', strokeWidth: 3 }),
          circle('hub', { cx, cy, r: 5, fill: '#fbbf24' }),
          line('hour', {
            x1: cx,
            y1: cy,
            x2: cx + 50 * Math.cos(hourAng),
            y2: cy + 50 * Math.sin(hourAng),
            stroke: '#38bdf8',
            strokeWidth: 5,
          }),
          line('minute', {
            x1: cx,
            y1: cy,
            x2: cx + 75 * Math.cos(minAng),
            y2: cy + 75 * Math.sin(minAng),
            stroke: '#f472b6',
            strokeWidth: 3,
          }),
          label('eq', 28, 28, `angle = ${angle.toFixed(1)}°`),
          label('t', 28, 46, `${hours === 0 ? 12 : hours}:${String(minutes).padStart(2, '0')}`),
        ],
      },
      metrics: { hours, minutes, angle: Number(angle.toFixed(4)) },
      warnings: [],
    }
  },
}
