import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, label, line, pathEl } from '../stage.js'

function ellipseD(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${(cx - rx).toFixed(1)} ${cy} A ${rx} ${ry} 0 1 1 ${(cx + rx).toFixed(1)} ${cy} A ${rx} ${ry} 0 1 1 ${(cx - rx).toFixed(1)} ${cy}`
}

function fmt(x: number): string {
  const r = Math.round(x * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

export const solenoid: SimFile = {
  id: 'solenoid',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Solenoid field',
  description: 'A long coil: nearly uniform B inside, looping from N to S outside. B ∝ nI',
  equations: ['B \\propto n I'],
  keywords: ['solenoid', 'magnetic field solenoid', 'turns of coil', 'electromagnet', 'field inside solenoid'],
  params: [
    param('I', 'Current', 'A', 0.5, 20, 0.5, 5),
    param('turns', 'Turns', '', 3, 16, 1, 8),
  ],
  schema: z.object({
    I: num(0.1, 80, 5),
    turns: num(2, 40, 8),
  }),
  run(params) {
    const I = params.I
    const turns = Math.max(2, Math.round(params.turns))
    const field = turns * I
    const shown = Math.min(turns, 16)
    const ink = '#334155'
    const xL = 88
    const xR = 400
    const cy = 158
    const ry = 44
    const rx = 8
    const pitch = (xR - xL) / shown
    const nB = Math.max(3, Math.min(6, Math.round(2 + field / 22)))
    const elements = [
      label('eq', 24, 22, `B ∝ nI    nI = ${turns} × ${fmt(I)} = ${fmt(field)}`),
      line('lead-in', { x1: 40, y1: cy + ry + 18, x2: xL, y2: cy + ry, stroke: ink, strokeWidth: 2 }),
      line('lead-out', { x1: xR, y1: cy + ry, x2: 448, y2: cy + ry + 18, stroke: ink, strokeWidth: 2 }),
      arrow('I', {
        x1: 42,
        y1: cy + ry + 18,
        x2: 70,
        y2: cy + ry + 6,
        stroke: ink,
        strokeWidth: 1.5,
        label: 'I',
      }),
      pathEl('Bout-t', {
        d: `M ${xR + 6} ${cy - 10} C ${xR + 78} ${cy - 96}, ${xL - 78} ${cy - 96}, ${xL - 6} ${cy - 10}`,
        fill: 'none',
        stroke: ink,
        strokeWidth: 1.25,
        strokeDasharray: '6 4',
      }),
      pathEl('Bout-b', {
        d: `M ${xR + 6} ${cy + 10} C ${xR + 78} ${cy + 96}, ${xL - 78} ${cy + 96}, ${xL - 6} ${cy + 10}`,
        fill: 'none',
        stroke: ink,
        strokeWidth: 1.25,
        strokeDasharray: '6 4',
      }),
    ]
    const gap = (2 * 28) / Math.max(nB - 1, 1)
    const y0 = cy - 28
    for (let k = 0; k < nB; k++) {
      const y = y0 + k * gap
      elements.push(
        arrow(`B-${k}`, {
          x1: xL + 18,
          y1: y,
          x2: xR - 18,
          y2: y,
          stroke: ink,
          strokeWidth: 1.5 + Math.min(1.2, I / 16),
        })
      )
    }
    for (let k = 0; k < shown; k++) {
      const cx = xL + pitch * (k + 0.5)
      elements.push(
        pathEl(`turn-${k}`, {
          d: ellipseD(cx, cy, rx, ry),
          fill: 'none',
          stroke: ink,
          strokeWidth: 2,
        })
      )
    }
    elements.push(
      label('S', xL - 22, cy + 4, 'S', ink),
      label('N', xR + 10, cy + 4, 'N', ink),
      label('B', (xL + xR) / 2 - 4, cy - 6, 'B', ink)
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { I, turns, field: Number(field.toFixed(4)) },
      warnings: [],
    }
  },
}
