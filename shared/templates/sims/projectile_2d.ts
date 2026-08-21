import { z } from 'zod'
import { analyticFlatRange, solveProjectile } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, ORIGIN_X, VIEW, circle, ground, label, n, pathEl, tLoop } from '../stage.js'

function buildParabolaPath(
  sol: { flightTime: number; vx: number; vy: number },
  scale: number,
  h0: number,
  g: number
): string {
  const steps = 24
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (sol.flightTime * i) / steps
    const x = ORIGIN_X + scale * sol.vx * t
    const yPhys = Math.max(0, h0 + sol.vy * t - 0.5 * g * t * t)
    const y = GROUND_Y - scale * yPhys
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

export const projectile_2d: SimFile = {
  id: 'projectile_2d',
  domain: 'physics',
  classBand: '9-10',
  label: 'Projectile motion',
  ncertClass: 9,
  description: 'Ballistic trajectory under constant gravity',
  equations: [
    'x = v_0 \\cos\\theta\\, t',
    'y = h_0 + v_0 \\sin\\theta\\, t - \\tfrac12 g t^2',
    'R = v_0^2 \\sin 2\\theta / g',
  ],
  keywords: ['projectile', 'trajectory', 'thrown', 'launch', 'cannon', 'ballistic', 'parabola'],
  params: [
    param('v0', 'Launch speed', 'm/s', 1, 80, 0.5, 20),
    param('angleDeg', 'Angle', 'deg', 5, 85, 1, 45),
    param('h0', 'Height', 'm', 0, 50, 0.5, 0),
    param('g', 'Gravity', 'm/s²', 1.6, 20, 0.01, 9.81),
  ],
  schema: z.object({
    v0: num(0.1, 200, 20),
    angleDeg: num(0, 90, 45),
    h0: num(0, 200, 0),
    g: num(0.1, 30, 9.81),
  }),
  run(params) {
    const { v0, angleDeg, h0, g } = params
    const sol = solveProjectile(v0, angleDeg, h0, g)
    const warnings: string[] = []
    if (h0 < 1e-6) {
      const flat = analyticFlatRange(v0, angleDeg, g)
      if (Math.abs(flat - sol.range) > 0.05) {
        warnings.push(`Range gate failed: solver ${sol.range.toFixed(3)} m vs analytic ${flat.toFixed(3)} m`)
      }
    }
    const scale = Math.min(420 / Math.max(sol.range, 1), 200 / Math.max(sol.maxHeight, 0.5)) * 0.88
    const period = sol.flightTime + 0.6
    const t = tLoop(period, sol.flightTime)
    const yPhys = `${n(h0)} + ${n(sol.vy)} * (${t}) - 0.5 * ${n(g)} * (${t})^2`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          pathEl(
            'trajectory-hint',
            {
              d: buildParabolaPath(sol, scale, h0, g),
              stroke: '#64748b',
              strokeDasharray: '5 4',
              fill: 'none',
              strokeWidth: 1.5,
            },
            'trajectory'
          ),
          circle(
            'ball',
            {
              cx: { $expr: `${n(ORIGIN_X)} + ${n(scale * sol.vx)} * (${t})` },
              cy: { $expr: `${n(GROUND_Y)} - ${n(scale)} * (${yPhys})` },
              r: 9,
              fill: '#38bdf8',
              stroke: '#0ea5e9',
              strokeWidth: 2,
            },
            'projectile'
          ),
          label('metrics-range', 28, 28, `R = ${sol.range.toFixed(2)} m`),
          label('metrics-time', 28, 46, `T = ${sol.flightTime.toFixed(2)} s`),
          label('scale-bar', 28, GROUND_Y + 22, `scale ${scale.toFixed(1)} px/m`, '#64748b'),
        ],
      },
      metrics: {
        range: Number(sol.range.toFixed(4)),
        flightTime: Number(sol.flightTime.toFixed(4)),
        maxHeight: Number(sol.maxHeight.toFixed(4)),
        scalePxPerM: Number(scale.toFixed(4)),
      },
      warnings,
      caption: `Range ${sol.range.toFixed(2)} m, flight ${sol.flightTime.toFixed(2)} s, max height ${sol.maxHeight.toFixed(2)} m`,
    }
  },
}
