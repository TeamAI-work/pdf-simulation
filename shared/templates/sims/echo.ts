import { z } from 'zod'
import { echoTime } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, tLoop } from '../stage.js'

function fmt(x: number): string {
  const r = Math.round(x * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

export const echo: SimFile = {
  id: 'echo',
  domain: 'physics',
  classBand: '8-9',
  ncertClass: 9,
  label: 'Echo',
  description: 'Sound goes to a cliff and back; t = 2d / v',
  equations: ['t = 2d / v'],
  keywords: ['echo', 'speed of sound', 'reflection of sound', 'time of echo', 'ranging'],
  params: [
    param('distance', 'Distance d', 'm', 10, 680, 5, 340),
    param('vSound', 'Speed of sound', 'm/s', 100, 500, 5, 340),
  ],
  schema: z.object({
    distance: num(1, 5000, 340),
    vSound: num(50, 2000, 340),
  }),
  run(params) {
    const { distance, vSound } = params
    const t = echoTime(distance, vSound)
    const T = Math.max(t, 0.35)
    const tt = tLoop(T + 0.6, T)
    const ink = '#334155'
    const x0 = 72
    const y = 158
    const ground = 236
    const xWall = 72 + 90 + 300 * (Math.min(Math.max(distance, 10), 680) - 10) / 670
    const travel = xWall - x0
    const u = `(1 - abs(1 - 2 * (${tt}) / ${n(T)}))`
    const cx = `${n(x0)} + ${n(travel)} * (${u})`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 24, 22, `t = 2d/v = ${fmt(t)} s`),
          line('ground', { x1: 36, y1: ground, x2: 470, y2: ground, stroke: ink, strokeWidth: 2 }),
          circle('head', { cx: x0, cy: y, r: 8, fill: ink }),
          line('body', { x1: x0, y1: y + 8, x2: x0, y2: ground, stroke: ink, strokeWidth: 3 }),
          line('wall', { x1: xWall, y1: 48, x2: xWall, y2: ground, stroke: ink, strokeWidth: 6 }),
          line('cliff-top', { x1: xWall, y1: 48, x2: 478, y2: 48, stroke: ink, strokeWidth: 2 }),
          line('path', {
            x1: x0 + 10,
            y1: y,
            x2: xWall,
            y2: y,
            stroke: ink,
            strokeWidth: 1,
            strokeDasharray: '5 4',
          }),
          line('d-seg', {
            x1: x0,
            y1: ground + 16,
            x2: xWall,
            y2: ground + 16,
            stroke: ink,
            strokeWidth: 1.5,
          }),
          label('d', (x0 + xWall) / 2 - 8, ground + 32, `d = ${fmt(distance)} m`, ink),
          label('cliff', xWall + 10, 68, 'cliff', ink),
          circle(
            'pulse',
            {
              cx: { $expr: cx },
              cy: y,
              r: 6,
              fill: ink,
            },
            'projectile'
          ),
          circle('rip', {
            cx: { $expr: cx },
            cy: y,
            r: 14,
            fill: 'none',
            stroke: ink,
            strokeWidth: 1.25,
          }),
        ],
      },
      metrics: { distance, vSound, t: Number(t.toFixed(4)) },
      warnings: [],
    }
  },
}
