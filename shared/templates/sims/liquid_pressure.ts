import { z } from 'zod'
import { liquidPressure } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, label, rect } from '../stage.js'

export const liquid_pressure: SimFile = {
  id: 'liquid_pressure',
  domain: 'physics',
  classBand: '6-8',
  ncertClass: 8,
  label: 'Liquid pressure',
  description: 'Pressure at depth in a liquid column P = hρg',
  equations: ['P = h\\rho g'],
  keywords: ['liquid pressure', 'hydrostatic', 'depth pressure', 'h rho g', 'pressure in liquids'],
  params: [
    param('h', 'Depth h', 'm', 0.2, 12, 0.1, 2),
    param('rho', 'Density ρ', 'kg/m³', 200, 2000, 50, 1000),
    param('g', 'g', 'm/s²', 1, 20, 0.01, 9.81),
  ],
  schema: z.object({
    h: num(0.01, 80, 2),
    rho: num(50, 2e4, 1000),
    g: num(0.1, 40, 9.81),
  }),
  run(params) {
    const { h, rho, g } = params
    const P = liquidPressure(h, rho, g)
    const fillH = Math.min(200, 28 * h)
    const tankW = 160
    const tankX = 170
    const tankBottom = 250
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          rect('tank', {
            x: tankX,
            y: tankBottom - 210,
            width: tankW,
            height: 210,
            fill: 'none',
            stroke: '#94a3b8',
            strokeWidth: 3,
          }),
          rect('liquid', {
            x: tankX + 4,
            y: tankBottom - fillH,
            width: tankW - 8,
            height: fillH,
            fill: '#38bdf866',
          }),
          arrow('P', {
            x1: tankX + tankW / 2,
            y1: tankBottom - 8,
            x2: tankX + tankW / 2 + Math.min(90, P / 400),
            y2: tankBottom - 8,
            stroke: '#f472b6',
            strokeWidth: 3,
          }),
          label('eq', 28, 28, `P = hρg = ${P.toFixed(0)} Pa`),
          label('vals', 28, 46, `h=${h} m   ρ=${rho}   g=${g}`),
        ],
      },
      metrics: { h, rho, g, P: Number(P.toFixed(4)) },
      warnings: [],
    }
  },
}
