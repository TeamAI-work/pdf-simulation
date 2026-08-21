import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, particles, rect } from '../stage.js'

export const states_of_matter: SimFile = {
  id: 'states_of_matter',
  domain: 'chemistry',
  classBand: '6-8',
  label: 'States of matter',
  ncertClass: 6,
  description: 'Solid, liquid, or gas from temperature (°C)',
  equations: ['\\text{solid } T < 0,\\; \\text{liquid } 0\\le T < 100,\\; \\text{gas } T \\ge 100'],
  keywords: ['states of matter', 'solid liquid gas', 'melting', 'boiling', 'change of state'],
  params: [param('temperature', 'Temperature', '°C', -20, 150, 1, 25)],
  schema: z.object({
    temperature: num(-50, 300, 25),
  }),
  run(params) {
    const T = params.temperature
    const state = T < 0 ? 'solid' : T < 100 ? 'liquid' : 'gas'
    const speed = state === 'solid' ? 0.15 : state === 'liquid' ? 0.7 : 1.8
    const count = state === 'gas' ? 14 : 16
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('beaker', { x: 140, y: 50, width: 220, height: 210, fill: '#0f172a', stroke: '#94a3b8', strokeWidth: 2, rx: 6 }),
          particles('matter', {
            cx: 250,
            cy: state === 'gas' ? 140 : 180,
            width: state === 'solid' ? 80 : 160,
            height: state === 'solid' ? 80 : 120,
            count,
            speed,
            r: state === 'gas' ? 4 : 7,
            fill: state === 'solid' ? '#38bdf8' : state === 'liquid' ? '#22c55e' : '#f472b6',
            time: { $expr: 'time' },
          }),
          label('state', 28, 28, state.toUpperCase()),
          label('T', 28, 46, `T = ${T} °C`),
        ],
      },
      metrics: { temperature: T, state },
      warnings: [],
    }
  },
}
