import { z } from 'zod'
import { buoyancyResult } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, ground, label, n, rect, tLoop } from '../stage.js'

export const buoyancy: SimFile = {
  id: 'buoyancy',
  domain: 'physics',
  classBand: '9-10',
  label: 'Float or sink',
  ncertClass: 9,
  description: 'Archimedes: compare object and fluid density',
  equations: ['F_b = \\rho_f V g', '\\text{floats if } \\rho_o < \\rho_f'],
  keywords: ['buoyan', 'float', 'sink', 'archimedes', 'density', 'displac'],
  params: [
    param('densityObject', 'Object density', 'kg/m³', 50, 15000, 10, 700),
    param('densityFluid', 'Fluid density', 'kg/m³', 50, 15000, 10, 1000),
    param('volume', 'Volume', 'm³', 0.0001, 1, 0.0001, 0.001),
  ],
  schema: z.object({
    densityObject: num(10, 20000, 700),
    densityFluid: num(10, 20000, 1000),
    volume: num(1e-6, 10, 0.001),
  }),
  run(params) {
    const { densityObject, densityFluid, volume } = params
    const r = buoyancyResult(densityObject, densityFluid, volume)
    const waterY = 170
    const t = tLoop(3.2, 3)
    const sinkExpr = r.willFloat
      ? `${n(waterY - 18)} + 6 * sin(time * 2)`
      : `${n(waterY - 20)} + min(${n(GROUND_Y - 28 - (waterY - 20))}, 40 * (${t})^2)`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          rect('water', {
            x: 40,
            y: waterY,
            width: 420,
            height: GROUND_Y - waterY,
            fill: '#0ea5e933',
            stroke: '#38bdf8',
            strokeWidth: 1,
          }),
          rect(
            'object',
            {
              x: 230,
              y: { $expr: sinkExpr },
              width: 40,
              height: 28,
              fill: r.willFloat ? '#22c55e' : '#a16207',
              rx: 4,
            },
            'projectile'
          ),
          label('result', 28, 28, r.willFloat ? 'FLOATS  ρ_object < ρ_fluid' : 'SINKS  ρ_object > ρ_fluid'),
          label('forces', 28, 46, `W=${r.weight.toFixed(2)} N   Fb=${r.buoyantForce.toFixed(2)} N`),
        ],
      },
      metrics: {
        weight: Number(r.weight.toFixed(4)),
        buoyantForce: Number(r.buoyantForce.toFixed(4)),
        willFloat: r.willFloat,
      },
      warnings: [],
    }
  },
}
