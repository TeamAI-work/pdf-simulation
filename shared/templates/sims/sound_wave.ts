import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, n, wave } from '../stage.js'

export const sound_wave: SimFile = {
  id: 'sound_wave',
  domain: 'physics',
  classBand: '8-9',
  label: 'Sound wave',
  ncertClass: 9,
  description: 'Travelling transverse sketch of a sound wave',
  equations: ['v = f \\lambda', 'y = A \\sin(2\\pi f t)'],
  keywords: ['sound wave', 'frequency', 'amplitude of wave', 'longitudinal wave', 'tuning fork'],
  params: [
    param('A', 'Amplitude', 'units', 4, 50, 1, 20),
    param('f', 'Frequency', 'Hz', 0.2, 8, 0.1, 1.5),
  ],
  schema: z.object({
    A: num(1, 80, 20),
    f: num(0.1, 20, 1.5),
  }),
  run(params) {
    const { A, f } = params
    const wavelength = Math.max(40, 180 / Math.max(f, 0.2))
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          wave('wave', {
            x1: 40,
            y1: 160,
            x2: 460,
            amplitude: A,
            wavelength,
            phase: { $expr: `${n(2 * Math.PI * f)} * time` },
            stroke: '#38bdf8',
            strokeWidth: 2.5,
          }),
          label('Af', 28, 28, `A = ${A}    f = ${f} Hz`),
          label('l', 28, 46, `Higher f → shorter wavelength sketch`),
        ],
      },
      metrics: { A, f, wavelength: Number(wavelength.toFixed(2)) },
      warnings: [],
    }
  },
}
