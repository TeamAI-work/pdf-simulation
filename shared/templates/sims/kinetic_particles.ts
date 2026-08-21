import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, particles, rect } from '../stage.js'

export const kinetic_particles: SimFile = {
  id: 'kinetic_particles',
  domain: 'chemistry',
  classBand: '8-10',
  label: 'Kinetic particle theory',
  ncertClass: 9,
  description: 'Particle speed rises with temperature',
  equations: ['KE \\propto T', 'v_{rms} \\propto \\sqrt{T}'],
  keywords: ['kinetic theory', 'gas particles', 'random motion', 'particle speed', 'kelvin temperature'],
  params: [
    param('temperature', 'Temperature', 'K', 100, 600, 10, 300),
    param('count', 'Particle count', '', 4, 20, 1, 12),
  ],
  schema: z.object({
    temperature: num(50, 1000, 300),
    count: num(2, 20, 12),
  }),
  run(params) {
    const { temperature, count } = params
    const speed = Math.sqrt(temperature / 300)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('box', { x: 80, y: 60, width: 340, height: 200, fill: '#0f172a', stroke: '#64748b', strokeWidth: 2, rx: 8 }),
          particles('gas', {
            cx: 250,
            cy: 160,
            width: 300,
            height: 160,
            count,
            speed,
            r: 5,
            fill: '#f472b6',
            time: { $expr: 'time' },
          }),
          label('T', 28, 28, `T = ${temperature} K`),
          label('n', 28, 46, `${count} particles   speed ∝ √T`),
        ],
      },
      metrics: { temperature, count, speed: Number(speed.toFixed(4)) },
      warnings: [],
    }
  },
}
