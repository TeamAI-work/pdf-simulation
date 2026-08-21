import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, rect } from '../stage.js'

export const transform_2d: SimFile = {
  id: 'transform_2d',
  domain: 'math',
  classBand: '9-10',
  label: '2D transformation',
  ncertClass: 9,
  description: 'Translate by (dx, dy) then rotate by θ',
  equations: ["x' = x\\cos\\theta - y\\sin\\theta + d_x"],
  keywords: ['translation', 'rotation', 'transformation', 'coordinate geometry transform'],
  params: [
    param('dx', 'dx', '', -8, 8, 0.5, 3),
    param('dy', 'dy', '', -8, 8, 0.5, 2),
    param('angleDeg', 'Angle', 'deg', 0, 180, 5, 30),
  ],
  schema: z.object({
    dx: num(-20, 20, 3),
    dy: num(-20, 20, 2),
    angleDeg: num(0, 360, 30),
  }),
  run(params) {
    const { dx, dy, angleDeg } = params
    const s = 14
    const ox = 160
    const oy = 180
    const t = `min(1, time / 2)`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('orig', { x: ox, y: oy - 30, width: 40, height: 30, fill: '#334155', stroke: '#64748b', strokeWidth: 1 }),
          rect(
            'moved',
            {
              x: { $expr: `${n(ox)} + ${n(dx * s)} * (${t})` },
              y: { $expr: `${n(oy - 30)} - ${n(dy * s)} * (${t})` },
              width: 40,
              height: 30,
              fill: '#38bdf866',
              stroke: '#38bdf8',
              strokeWidth: 2,
            },
            'projectile'
          ),
          label('t', 28, 28, `dx=${dx}  dy=${dy}  θ=${angleDeg}°`),
          label('note', 28, 46, 'Shape translates; θ shown as target rotation'),
        ],
      },
      metrics: { dx, dy, angleDeg },
      warnings: [],
    }
  },
}
