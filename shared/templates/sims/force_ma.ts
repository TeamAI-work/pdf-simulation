import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, arrow, ground, label, n, rect, tLoop } from '../stage.js'

export const force_ma: SimFile = {
  id: 'force_ma',
  domain: 'physics',
  classBand: '9-10',
  label: 'F = ma',
  ncertClass: 9,
  description: 'A push F on mass m produces acceleration a = F/m on a smooth table',
  equations: ['F = ma', 'a = F/m', 's = \\tfrac12 a t^2'],
  keywords: ['f = ma', 'f=ma', 'net force', 'accelerat', 'newton second law'],
  params: [
    param('mass', 'Mass', 'kg', 0.5, 20, 0.5, 2),
    param('force', 'Force', 'N', -40, 40, 0.5, 10),
  ],
  schema: z.object({
    mass: num(0.01, 1e4, 2),
    force: num(-1e5, 1e5, 10),
  }),
  run(params) {
    const { mass, force } = params
    const a = force / Math.max(mass, 1e-9)
    const dir = force >= 0 ? 1 : -1
    const moving = Math.abs(force) > 1e-6
    const tMax = 3
    const t = tLoop(tMax + 0.8, tMax)
    const s = moving ? `0.5 * ${n(a)} * (${t})^2` : '0'
    const sMax = 0.5 * a * tMax * tMax
    const scale = 280 / Math.max(Math.abs(sMax), 1)
    const blockW = Math.round(32 + Math.min(44, Math.sqrt(Math.max(mass, 0.2)) * 12))
    const blockH = Math.round(22 + Math.min(26, Math.sqrt(Math.max(mass, 0.2)) * 7))
    const xStart = dir >= 0 ? 110 : 360
    const yBlock = GROUND_Y - blockH
    const midY = yBlock + blockH / 2
    const bx = `${n(xStart)} + ${n(scale)} * (${s})`
    const cx = `(${bx}) + ${n(blockW / 2)}`
    const fLen = 36 + Math.min(70, Math.abs(force) * 1.8)
    const fX1 = dir >= 0 ? `${bx} - ${n(10 + fLen)}` : `${bx} + ${n(blockW + 10 + fLen)}`
    const fX2 = dir >= 0 ? `${bx} - 10` : `${bx} + ${n(blockW + 10)}`
    const vLen = moving ? `min(${n(90)}, 12 + ${n(Math.abs(a) * 8)} * (${t}))` : '0'
    const vX2 = `(${cx}) + ${n(dir)} * (${vLen})`
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          ground(),
          label('vals', 28, 28, `F = ${force} N    m = ${mass} kg    a = ${a.toFixed(2)} m/s²`),
          rect('table', {
            x: 24,
            y: GROUND_Y - 6,
            width: 452,
            height: 10,
            fill: '#cbd5e1',
            rx: 2,
          }),
          rect(
            'block',
            {
              x: { $expr: bx },
              y: yBlock,
              width: blockW,
              height: blockH,
              fill: '#2563eb',
              rx: 5,
            },
            'projectile'
          ),
          {
            id: 'mass-tag',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: cx },
              y: yBlock + blockH / 2 + 4,
              fill: '#ffffff',
              fontSize: 11,
              fontWeight: 700,
              textAnchor: 'middle',
            },
            text: mass >= 1 ? `${mass} kg` : 'm',
          },
          ...(moving
            ? [
                arrow('force-arrow', {
                  x1: { $expr: fX1 },
                  y1: midY,
                  x2: { $expr: fX2 },
                  y2: midY,
                  stroke: '#dc2626',
                  strokeWidth: 4 + Math.min(4, Math.abs(force) / 12),
                  label: 'F',
                }),
                rect('hand', {
                  x: { $expr: dir >= 0 ? `(${fX1}) - 14` : `(${fX1}) - 2` },
                  y: midY - 12,
                  width: 16,
                  height: 24,
                  fill: '#f59e0b',
                  rx: 8,
                }),
                arrow('vel-arrow', {
                  x1: { $expr: cx },
                  y1: yBlock - 18,
                  x2: { $expr: vX2 },
                  y2: yBlock - 18,
                  stroke: '#0f766e',
                  strokeWidth: 2.5,
                  label: 'v',
                }),
              ]
            : []),
        ],
      },
      metrics: {
        force,
        mass,
        acceleration: Number(a.toFixed(4)),
      },
      warnings: [],
    }
  },
}
