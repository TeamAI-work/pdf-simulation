import { z } from 'zod'
import { ohmCurrent } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, pathEl } from '../stage.js'

function resistorZigzag(x0: number, y: number, x1: number, amp = 18): string {
  const teeth = 6
  const lead = 8
  const inner = x1 - x0 - 2 * lead
  const pitch = inner / teeth
  const parts = [`M ${x0} ${y}`, `L ${x0 + lead} ${y}`]
  for (let i = 0; i < teeth; i++) {
    const x = x0 + lead + (i + 0.5) * pitch
    const yy = i % 2 === 0 ? y - amp : y + amp
    parts.push(`L ${x.toFixed(1)} ${yy}`)
  }
  parts.push(`L ${x1 - lead} ${y}`, `L ${x1} ${y}`)
  return parts.join(' ')
}

function onLoop(speed: number, offset: number, xL: number, xR: number, yT: number, yB: number) {
  const W = xR - xL
  const H = yB - yT
  const P = 2 * (W + H)
  const s1 = W
  const s2 = W + H
  const s3 = 2 * W + H
  const u = `mod(${n(speed)} * time + ${n(offset)}, ${n(P)})`
  const cx = `(${u} < ${n(s1)}) ? (${n(xL)} + (${u})) : ((${u} < ${n(s2)}) ? ${n(xR)} : ((${u} < ${n(s3)}) ? (${n(xR)} - ((${u}) - ${n(s2)})) : ${n(xL)}))`
  const cy = `(${u} < ${n(s1)}) ? ${n(yT)} : ((${u} < ${n(s2)}) ? (${n(yT)} + ((${u}) - ${n(s1)})) : ((${u} < ${n(s3)}) ? ${n(yB)} : (${n(yB)} - ((${u}) - ${n(s3)}))))`
  return { cx, cy }
}

export const ohm_circuit: SimFile = {
  id: 'ohm_circuit',
  domain: 'physics',
  classBand: '7-10',
  label: 'Ohm’s law',
  ncertClass: 8,
  description: 'Current I = V/R in a simple loop',
  equations: ['V = IR', 'I = V/R'],
  keywords: ['ohm', 'ohms law', "ohm's law", 'voltage', 'resistance', 'current in circuit'],
  params: [
    param('V', 'Voltage', 'V', 1, 24, 0.5, 6),
    param('R', 'Resistance', 'Ω', 1, 50, 0.5, 3),
  ],
  schema: z.object({
    V: num(0.1, 100, 6),
    R: num(0.1, 200, 3),
  }),
  run(params) {
    const { V, R } = params
    const I = ohmCurrent(V, R)
    const xL = 100
    const xR = 400
    const yT = 108
    const yB = 232
    const midX = (xL + xR) / 2
    const r0 = 188
    const r1 = 312
    const speed = Math.abs(I) < 1e-6 ? 0 : 70 + Math.min(360, Math.abs(I) * 85)
    const loop = 2 * (xR - xL + yB - yT)
    const charges = [0, 1, 2, 3, 4].map((k) => {
      const { cx, cy } = onLoop(speed, (k * loop) / 5, xL, xR, yT, yB)
      return circle(
        `q${k}`,
        { cx: { $expr: cx }, cy: { $expr: cy }, r: 6, fill: '#0284c7' },
        'projectile'
      )
    })
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 28, 28, `I = V/R = ${I.toFixed(2)} A`),
          label('vr', 28, 46, `V = ${V} V    R = ${R} Ω    V = IR`),
          line('top-l', { x1: xL, y1: yT, x2: r0, y2: yT, stroke: '#334155', strokeWidth: 3 }),
          line('top-r', { x1: r1, y1: yT, x2: xR, y2: yT, stroke: '#334155', strokeWidth: 3 }),
          line('right', { x1: xR, y1: yT, x2: xR, y2: yB, stroke: '#334155', strokeWidth: 3 }),
          line('bot', { x1: xR, y1: yB, x2: xL, y2: yB, stroke: '#334155', strokeWidth: 3 }),
          line('left-top', { x1: xL, y1: yT, x2: xL, y2: 148, stroke: '#334155', strokeWidth: 3 }),
          line('left-bot', { x1: xL, y1: 176, x2: xL, y2: yB, stroke: '#334155', strokeWidth: 3 }),
          line('cell-plus', { x1: 78, y1: 152, x2: 122, y2: 152, stroke: '#0f172a', strokeWidth: 5 }),
          line('cell-minus', { x1: 90, y1: 168, x2: 110, y2: 168, stroke: '#0f172a', strokeWidth: 3 }),
          label('plus', 128, 156, '+', '#dc2626'),
          label('minus', 128, 176, '−', '#2563eb'),
          label('Vtag', 52, 166, `${V} V`),
          pathEl('resistor', {
            d: resistorZigzag(r0, yT, r1, 18),
            fill: 'none',
            stroke: '#b45309',
            strokeWidth: 3,
          }),
          label('Rtag', midX - 18, yT - 28, `${R} Ω`),
          arrow('I-top', {
            x1: 330,
            y1: yT - 14,
            x2: 368,
            y2: yT - 14,
            stroke: '#0f766e',
            strokeWidth: 2,
            label: 'I',
          }),
          arrow('I-right', {
            x1: xR + 16,
            y1: 140,
            x2: xR + 16,
            y2: 178,
            stroke: '#0f766e',
            strokeWidth: 2,
          }),
          arrow('I-bot', {
            x1: 250,
            y1: yB + 16,
            x2: 210,
            y2: yB + 16,
            stroke: '#0f766e',
            strokeWidth: 2,
          }),
          ...charges,
        ],
      },
      metrics: { I: Number(I.toFixed(4)), V, R },
      warnings: [],
    }
  },
}
