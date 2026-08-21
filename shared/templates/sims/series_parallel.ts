import { z } from 'zod'
import { ohmCurrent, parallelReq, seriesReq } from '../physics.js'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, circle, label, line, n, pathEl } from '../stage.js'

function zigzagH(x0: number, y: number, x1: number, amp = 14): string {
  const teeth = 6
  const lead = 8
  const pitch = (x1 - x0 - 2 * lead) / teeth
  const parts = [`M ${x0} ${y}`, `L ${x0 + lead} ${y}`]
  for (let i = 0; i < teeth; i++) {
    parts.push(`L ${(x0 + lead + (i + 0.5) * pitch).toFixed(1)} ${i % 2 === 0 ? y - amp : y + amp}`)
  }
  parts.push(`L ${x1 - lead} ${y}`, `L ${x1} ${y}`)
  return parts.join(' ')
}

function zigzagV(x: number, y0: number, y1: number, amp = 12): string {
  const teeth = 6
  const lead = 10
  const pitch = (y1 - y0 - 2 * lead) / teeth
  const parts = [`M ${x} ${y0}`, `L ${x} ${y0 + lead}`]
  for (let i = 0; i < teeth; i++) {
    parts.push(`L ${i % 2 === 0 ? x - amp : x + amp} ${(y0 + lead + (i + 0.5) * pitch).toFixed(1)}`)
  }
  parts.push(`L ${x} ${y1 - lead}`, `L ${x} ${y1}`)
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

function charges(id: string, speed: number, count: number, xL: number, xR: number, yT: number, yB: number) {
  const loop = 2 * (xR - xL + yB - yT)
  const spd = Math.abs(speed) < 1e-6 ? 0 : speed
  return Array.from({ length: count }, (_, k) => {
    const { cx, cy } = onLoop(spd, (k * loop) / count, xL, xR, yT, yB)
    return circle(`q${id}${k}`, { cx: { $expr: cx }, cy: { $expr: cy }, r: 4.5, fill: '#334155' }, 'projectile')
  })
}

function fmt(x: number): string {
  const r = Math.round(x * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

export const series_parallel: SimFile = {
  id: 'series_parallel',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Series and parallel',
  description: 'Two resistors: mode 0 series, mode 1 parallel. Req, total I, and branch currents',
  equations: ['R_s = R_1+R_2', '1/R_p = 1/R_1+1/R_2', 'I = V/R_{eq}'],
  keywords: ['series circuit', 'parallel circuit', 'equivalent resistance', 'combination of resistors', 'two resistors'],
  params: [
    param('V', 'Voltage', 'V', 1, 24, 0.5, 10),
    param('R1', 'R1', 'Ω', 0.5, 40, 0.5, 2),
    param('R2', 'R2', 'Ω', 0.5, 40, 0.5, 3),
    choice('mode', 'Circuit', [
      { value: 0, label: 'Series' },
      { value: 1, label: 'Parallel' },
    ], 0),
  ],
  schema: z.object({
    V: num(0.1, 200, 10),
    R1: num(0.1, 500, 2),
    R2: num(0.1, 500, 3),
    mode: num(0, 1, 0),
  }),
  run(params) {
    const { V, R1, R2 } = params
    const parallel = params.mode >= 0.5
    const Req = parallel ? parallelReq(R1, R2) : seriesReq(R1, R2)
    const I = ohmCurrent(V, Req)
    const I1 = parallel ? ohmCurrent(V, R1) : I
    const I2 = parallel ? ohmCurrent(V, R2) : I
    const ink = '#334155'
    const spd = (cur: number) => (Math.abs(cur) < 1e-6 ? 0 : 55 + Math.min(260, Math.abs(cur) * 65))

    if (!parallel) {
      const xL = 96
      const xR = 404
      const yT = 112
      const yB = 228
      const a0 = 148
      const a1 = 218
      const b0 = 248
      const b1 = 318
      return {
        stage: {
          viewBox: VIEW,
          elements: [
            label('eq', 24, 22, `Req = R1+R2 = ${fmt(Req)} Ω    I = ${fmt(I)} A`),
            line('top-l', { x1: xL, y1: yT, x2: a0, y2: yT, stroke: ink, strokeWidth: 2 }),
            pathEl('r1', { d: zigzagH(a0, yT, a1), fill: 'none', stroke: ink, strokeWidth: 2 }),
            line('mid', { x1: a1, y1: yT, x2: b0, y2: yT, stroke: ink, strokeWidth: 2 }),
            pathEl('r2', { d: zigzagH(b0, yT, b1), fill: 'none', stroke: ink, strokeWidth: 2 }),
            line('top-r', { x1: b1, y1: yT, x2: xR, y2: yT, stroke: ink, strokeWidth: 2 }),
            line('right', { x1: xR, y1: yT, x2: xR, y2: yB, stroke: ink, strokeWidth: 2 }),
            line('bot', { x1: xR, y1: yB, x2: xL, y2: yB, stroke: ink, strokeWidth: 2 }),
            line('left-t', { x1: xL, y1: yT, x2: xL, y2: 148, stroke: ink, strokeWidth: 2 }),
            line('left-b', { x1: xL, y1: 176, x2: xL, y2: yB, stroke: ink, strokeWidth: 2 }),
            line('cell+', { x1: 78, y1: 152, x2: 114, y2: 152, stroke: ink, strokeWidth: 4 }),
            line('cell−', { x1: 86, y1: 168, x2: 106, y2: 168, stroke: ink, strokeWidth: 2.5 }),
            label('Vtag', 48, 166, `${fmt(V)} V`, ink),
            label('R1t', (a0 + a1) / 2 - 14, yT - 22, `R1 ${fmt(R1)} Ω`, ink),
            label('R2t', (b0 + b1) / 2 - 14, yT - 22, `R2 ${fmt(R2)} Ω`, ink),
            arrow('I', { x1: 250, y1: yB + 16, x2: 210, y2: yB + 16, stroke: ink, strokeWidth: 1.5, label: 'I' }),
            ...charges('', spd(I), 5, xL, xR, yT, yB),
          ],
        },
        metrics: { V, R1, R2, mode: 0, Req: Number(Req.toFixed(4)), I: Number(I.toFixed(4)), I1: Number(I1.toFixed(4)), I2: Number(I2.toFixed(4)) },
        warnings: [],
      }
    }

    const xBat = 108
    const x1 = 248
    const x2 = 378
    const yT = 96
    const yB = 236
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 24, 22, `Req = ${fmt(Req)} Ω    I = I1+I2 = ${fmt(I)} A`),
          line('top', { x1: xBat, y1: yT, x2: x2, y2: yT, stroke: ink, strokeWidth: 2 }),
          line('bot', { x1: xBat, y1: yB, x2: x2, y2: yB, stroke: ink, strokeWidth: 2 }),
          line('left-t', { x1: xBat, y1: yT, x2: xBat, y2: 148, stroke: ink, strokeWidth: 2 }),
          line('left-b', { x1: xBat, y1: 176, x2: xBat, y2: yB, stroke: ink, strokeWidth: 2 }),
          line('cell+', { x1: 90, y1: 152, x2: 126, y2: 152, stroke: ink, strokeWidth: 4 }),
          line('cell−', { x1: 98, y1: 168, x2: 118, y2: 168, stroke: ink, strokeWidth: 2.5 }),
          line('r1-t', { x1: x1, y1: yT, x2: x1, y2: 128, stroke: ink, strokeWidth: 2 }),
          pathEl('r1', { d: zigzagV(x1, 128, 204), fill: 'none', stroke: ink, strokeWidth: 2 }),
          line('r1-b', { x1: x1, y1: 204, x2: x1, y2: yB, stroke: ink, strokeWidth: 2 }),
          line('r2-t', { x1: x2, y1: yT, x2: x2, y2: 128, stroke: ink, strokeWidth: 2 }),
          pathEl('r2', { d: zigzagV(x2, 128, 204), fill: 'none', stroke: ink, strokeWidth: 2 }),
          line('r2-b', { x1: x2, y1: 204, x2: x2, y2: yB, stroke: ink, strokeWidth: 2 }),
          label('Vtag', 58, 166, `${fmt(V)} V`, ink),
          label('R1t', x1 + 16, 168, `R1 ${fmt(R1)} Ω`, ink),
          label('R2t', x2 + 16, 168, `R2 ${fmt(R2)} Ω`, ink),
          arrow('I1', { x1: x1 - 22, y1: 118, x2: x1 - 22, y2: 150, stroke: ink, strokeWidth: 1.5, label: `I1 ${fmt(I1)} A` }),
          arrow('I2', { x1: x2 - 22, y1: 118, x2: x2 - 22, y2: 150, stroke: ink, strokeWidth: 1.5, label: `I2 ${fmt(I2)} A` }),
          ...charges('1', spd(I1), 4, xBat, x1, yT, yB),
          ...charges('2', spd(I2), 4, xBat, x2, yT, yB),
        ],
      },
      metrics: { V, R1, R2, mode: 1, Req: Number(Req.toFixed(4)), I: Number(I.toFixed(4)), I1: Number(I1.toFixed(4)), I2: Number(I2.toFixed(4)) },
      warnings: [],
    }
  },
}
