import { z } from 'zod'
import { solveCollision1d } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, circle, ground, label, n } from '../stage.js'

export const collision_1d: SimFile = {
  id: 'collision_1d',
  domain: 'physics',
  classBand: '9-10',
  label: '1D collision',
  ncertClass: 9,
  description: 'Two masses collide along a line with restitution e',
  equations: ['m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2', 'e = (v_2 - v_1)/(u_1 - u_2)'],
  keywords: ['collision', 'collide', 'momentum', 'elastic', 'inelastic', 'cart'],
  params: [
    param('m1', 'Mass 1', 'kg', 0.1, 50, 0.1, 2),
    param('m2', 'Mass 2', 'kg', 0.1, 50, 0.1, 2),
    param('u1', 'u₁', 'm/s', -30, 30, 0.5, 8),
    param('u2', 'u₂', 'm/s', -30, 30, 0.5, -4),
    param('e', 'Restitution e', '', 0, 1, 0.05, 1),
  ],
  schema: z.object({
    m1: num(0.01, 1e5, 2),
    m2: num(0.01, 1e5, 2),
    u1: num(-100, 100, 8),
    u2: num(-100, 100, -4),
    e: num(0, 1, 1),
  }),
  run(params) {
    const { m1, m2, u1, u2, e } = params
    const gap = 8
    const sol = solveCollision1d(m1, m2, u1, u2, e, gap)
    const warnings: string[] = []
    const keExpected = 0.5 * m1 * sol.v1 * sol.v1 + 0.5 * m2 * sol.v2 * sol.v2
    if (Math.abs(keExpected - sol.keAfter) > 1e-6) warnings.push('Collision energy gate failed')
    const tCol = Math.min(sol.timeToCollision, 8)
    const after = 2.2
    const period = tCol + after
    const t = `mod(time, ${n(period)})`
    const scale = 380 / Math.max(gap + 4, 8)
    const xPx = (expr: string) => `${n(60)} + ${n(scale)} * (${expr})`
    const x1 = `(${t} < ${n(tCol)}) ? (${n(0)} + ${n(u1)} * (${t})) : (${n(u1 * tCol)} + ${n(sol.v1)} * ((${t}) - ${n(tCol)}))`
    const x2 = `(${t} < ${n(tCol)}) ? (${n(gap)} + ${n(u2)} * (${t})) : (${n(gap + u2 * tCol)} + ${n(sol.v2)} * ((${t}) - ${n(tCol)}))`
    const r1 = 8 + Math.min(12, Math.sqrt(m1) * 3)
    const r2 = 8 + Math.min(12, Math.sqrt(m2) * 3)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          circle('mass1', { cx: { $expr: xPx(x1) }, cy: GROUND_Y - r1, r: r1, fill: '#38bdf8' }, 'projectile'),
          circle('mass2', { cx: { $expr: xPx(x2) }, cy: GROUND_Y - r2, r: r2, fill: '#f472b6' }),
          label('ke', 28, 28, `ΔKE = ${sol.energyLoss.toFixed(2)} J`),
          label('v', 28, 46, `v₁=${sol.v1.toFixed(2)}  v₂=${sol.v2.toFixed(2)} m/s`),
        ],
      },
      metrics: {
        v1: Number(sol.v1.toFixed(4)),
        v2: Number(sol.v2.toFixed(4)),
        keBefore: Number(sol.keBefore.toFixed(4)),
        keAfter: Number(sol.keAfter.toFixed(4)),
        energyLoss: Number(sol.energyLoss.toFixed(4)),
        timeToCollision: Number(tCol.toFixed(4)),
      },
      warnings,
    }
  },
}
