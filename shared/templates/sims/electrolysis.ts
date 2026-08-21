import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, n, particles, rect } from '../stage.js'

export const electrolysis: SimFile = {
  id: 'electrolysis',
  domain: 'chemistry',
  classBand: '9-10',
  label: 'Electrolysis',
  ncertClass: 10,
  description: 'Ions move; bubble rate rises with voltage',
  equations: ['Q = It', '\\text{rate increases with } V'],
  keywords: ['electrolysis', 'electrode', 'anode cathode', 'electrolyte', 'ions'],
  params: [param('voltage', 'Voltage', 'V', 1, 12, 0.5, 6)],
  schema: z.object({
    voltage: num(0.5, 24, 6),
  }),
  run(params) {
    const V = params.voltage
    const speed = 0.4 + V / 6
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('cell', { x: 90, y: 50, width: 320, height: 210, fill: '#0ea5e918', stroke: '#38bdf8', strokeWidth: 2, rx: 8 }),
          rect('cathode', { x: 120, y: 70, width: 16, height: 160, fill: '#94a3b8' }),
          rect('anode', { x: 364, y: 70, width: 16, height: 160, fill: '#64748b' }),
          particles('ions', {
            cx: 250,
            cy: 160,
            width: 200,
            height: 140,
            count: 12,
            speed,
            r: 4,
            fill: '#a78bfa',
            time: { $expr: 'time' },
          }),
          circle(
            'bubble',
            {
              cx: 128,
              cy: { $expr: `${n(210)} - ${n(40 + V * 6)} * abs(sin(time * ${n(speed)}))` },
              r: 5,
              fill: '#e2e8f0',
            },
            'projectile'
          ),
          label('V', 28, 28, `V = ${V} V`),
          label('note', 28, 46, 'Higher voltage → faster ion motion / bubbles'),
        ],
      },
      metrics: { voltage: V, speed: Number(speed.toFixed(4)) },
      warnings: [],
    }
  },
}
