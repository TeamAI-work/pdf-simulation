import { z } from 'zod'
import { rampAcceleration } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, ground, label, line, n, pathEl, rect, tLoop } from '../stage.js'

export const ramp_friction: SimFile = {
  id: 'ramp_friction',
  domain: 'physics',
  classBand: '6-8',
  label: 'Ramp and friction',
  ncertClass: 8,
  description: 'Block starts at the top of an incline and slides down if tan θ > μ',
  equations: ['a = g(\\sin\\theta - \\mu \\cos\\theta)', '\\text{slides if } \\tan\\theta > \\mu'],
  keywords: ['ramp', 'incline', 'friction', 'slide', 'μ', 'mu'],
  params: [
    param('angleDeg', 'Angle', 'deg', 5, 70, 1, 30),
    param('mu', 'μ', '', 0, 1.2, 0.02, 0.2),
    param('mass', 'Mass', 'kg', 0.1, 50, 0.1, 5),
  ],
  schema: z.object({
    angleDeg: num(1, 80, 30),
    mu: num(0, 1.5, 0.2),
    mass: num(0.01, 1e4, 5),
  }),
  run(params) {
    const { angleDeg, mu, mass } = params
    const g = 9.81
    const { a, willSlide } = rampAcceleration(angleDeg, mu, g)
    const theta = (angleDeg * Math.PI) / 180
    const cos = Math.cos(theta)
    const sin = Math.sin(theta)
    const xLeft = 70
    const yBot = GROUND_Y
    const maxW = 400
    const maxH = 175
    const lengthPx = Math.min(maxW / Math.max(cos, 0.08), maxH / Math.max(sin, 0.08))
    const xBot = xLeft + lengthPx * cos
    const yTop = yBot - lengthPx * sin
    const lengthM = 5
    const pxPerM = lengthPx / lengthM
    const tMax = willSlide ? Math.sqrt((2 * lengthM) / Math.max(a, 1e-6)) : 4
    const t = tLoop(tMax + 0.6, tMax)
    const sExpr = willSlide ? `min(0.5 * ${n(a)} * (${t})^2, ${n(lengthM)})` : '0'
    const bw = 28
    const bh = 16
    const lift = bh / 2 + 4
    const nx = sin
    const ny = -cos
    const cxExpr = `${n(xLeft)} + ${n(pxPerM * cos)} * (${sExpr}) + ${n(nx * lift)}`
    const cyExpr = `${n(yTop)} + ${n(pxPerM * sin)} * (${sExpr}) + ${n(ny * lift)}`
    const N = mass * g * cos
    const f = mu * N
    const downPlane = mass * g * sin
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          pathEl('wedge', {
            d: `M ${xLeft.toFixed(1)} ${yTop.toFixed(1)} L ${xLeft.toFixed(1)} ${yBot} L ${xBot.toFixed(1)} ${yBot} Z`,
            fill: '#1e293b',
            stroke: '#64748b',
            strokeWidth: 2,
          }),
          line('ramp', {
            x1: xLeft,
            y1: yTop,
            x2: xBot,
            y2: yBot,
            stroke: '#94a3b8',
            strokeWidth: 5,
          }),
          rect(
            'block',
            {
              x: { $expr: `(${cxExpr}) - ${n(bw / 2)}` },
              y: { $expr: `(${cyExpr}) - ${n(bh / 2)}` },
              width: bw,
              height: bh,
              fill: willSlide ? '#22c55e' : '#ef4444',
              rx: 3,
              transform: {
                $expr: `concat("rotate(", ${n(angleDeg)}, " ", (${cxExpr}), " ", (${cyExpr}), ")")`,
              },
            },
            'projectile'
          ),
          label(
            'a-label',
            28,
            28,
            willSlide ? `a = g(sinθ − μ cosθ) = ${a.toFixed(2)} m/s²` : 'at rest: tan θ ≤ μ'
          ),
          label('f-label', 28, 46, `θ=${angleDeg}°  μ=${mu}  m=${mass} kg`),
          label('comp', 28, 64, `mg sinθ=${downPlane.toFixed(1)} N   f=${f.toFixed(1)} N`),
        ],
      },
      metrics: {
        acceleration: Number(a.toFixed(4)),
        willSlide,
        theta: angleDeg,
        mgSin: Number(downPlane.toFixed(4)),
        friction: Number(f.toFixed(4)),
      },
      warnings: [],
    }
  },
}
