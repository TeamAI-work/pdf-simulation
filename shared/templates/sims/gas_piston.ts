import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, particles, rect } from '../stage.js'

export const gas_piston: SimFile = {
  id: 'gas_piston',
  domain: 'chemistry',
  classBand: '9-10',
  label: 'Gas piston (Charles / Boyle)',
  ncertClass: 9,
  description: 'Piston height rises with T (Charles) or falls with P (Boyle)',
  equations: ['V/T = \\text{const (P fixed)}', 'PV = \\text{const (T fixed)}'],
  keywords: ['charles law', 'boyle', 'piston', 'gas volume', 'ideal gas'],
  params: [
    param('T', 'Temperature', 'K', 200, 500, 10, 300),
    param('P', 'Pressure', 'atm', 0.5, 3, 0.1, 1),
  ],
  schema: z.object({
    T: num(100, 800, 300),
    P: num(0.2, 5, 1),
  }),
  run(params) {
    const { T, P } = params
    const V = T / 300 / P
    const h = Math.max(42, Math.min(192, 96 * V))
    const speed = Math.sqrt(T / 300)
    const hot = (T - 200) / 300
    const gasFill = hot < 0.35 ? '#bae6fd' : hot < 0.7 ? '#fdba74' : '#fb923c'
    const molFill = hot < 0.35 ? '#0369a1' : hot < 0.7 ? '#c2410c' : '#9a3412'
    const innerX = 190
    const innerW = 140
    const cx = innerX + innerW / 2
    const baseY = 254
    const gasTop = baseY - h
    const pistonH = 16
    const pistonY = gasTop - pistonH
    const nW = Math.max(1, Math.round(P * 2))
    const wW = 64
    const wH = 12
    const weights = Array.from({ length: nW }, (_, i) =>
      rect(`w${i}`, {
        x: cx - wW / 2,
        y: pistonY - (i + 1) * (wH + 2),
        width: wW,
        height: wH,
        fill: i % 2 === 0 ? '#57534e' : '#78716c',
        rx: 2,
      })
    )
    const thermoH = 150
    const thermoBottom = 230
    const mercury = 18 + ((T - 100) / 700) * (thermoH - 28)
    const ticks = [0.5, 1, 1.5, 2].flatMap((mark) => {
      const y = baseY - 96 * mark
      if (y < 44) return []
      return [
        line(`tick${mark}`, {
          x1: innerX + innerW + 14,
          y1: y,
          x2: innerX + innerW + 24,
          y2: y,
          stroke: '#64748b',
          strokeWidth: 2,
        }),
        label(`vl${mark}`, innerX + innerW + 28, y + 4, String(mark)),
      ]
    })
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('vals', 28, 24, `T = ${T} K    P = ${P} atm`),
          label('vol', 28, 42, `V = ${V.toFixed(2)}    V ∝ T/P`),
          rect('left-wall', {
            x: innerX - 12,
            y: 32,
            width: 12,
            height: baseY - 32 + 14,
            fill: '#475569',
          }),
          rect('right-wall', {
            x: innerX + innerW,
            y: 32,
            width: 12,
            height: baseY - 32 + 14,
            fill: '#475569',
          }),
          rect('base', {
            x: innerX - 12,
            y: baseY,
            width: innerW + 24,
            height: 16,
            fill: '#334155',
            rx: 2,
          }),
          rect('gas', {
            x: innerX,
            y: gasTop,
            width: innerW,
            height: h,
            fill: gasFill,
            opacity: 0.85,
          }),
          particles('mol', {
            cx,
            cy: gasTop + h / 2,
            width: innerW - 28,
            height: Math.max(16, h - 18),
            count: 12,
            speed: 0.45 + speed,
            r: 5,
            fill: molFill,
            time: { $expr: 'time' },
          }),
          rect('piston', {
            x: innerX - 6,
            y: pistonY,
            width: innerW + 12,
            height: pistonH,
            fill: '#1e293b',
            rx: 2,
          }),
          rect('rod', {
            x: cx - 7,
            y: 16,
            width: 14,
            height: Math.max(8, pistonY - 16),
            fill: '#64748b',
          }),
          ...weights,
          rect('thermo-tube', {
            x: 46,
            y: thermoBottom - thermoH,
            width: 14,
            height: thermoH,
            fill: '#e2e8f0',
            stroke: '#64748b',
            strokeWidth: 1,
            rx: 7,
          }),
          rect('mercury', {
            x: 49,
            y: thermoBottom - mercury,
            width: 8,
            height: mercury,
            fill: '#dc2626',
            rx: 4,
          }),
          circle('bulb', { cx: 53, cy: thermoBottom + 4, r: 12, fill: '#dc2626' }),
          label('thermo-t', 38, thermoBottom - thermoH - 8, 'T'),
          ...ticks,
          label('vaxis', innerX + innerW + 28, 56, 'V'),
        ],
      },
      metrics: { T, P, V: Number(V.toFixed(4)), height: Number(h.toFixed(2)) },
      warnings: [],
    }
  },
}
