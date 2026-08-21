import { z } from 'zod'
import { complement, supplement } from '../math.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

function ray(ox: number, oy: number, deg: number, len: number) {
  const t = (deg * Math.PI) / 180
  return { x: ox + len * Math.cos(t), y: oy - len * Math.sin(t) }
}

function arcD(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = (endDeg * Math.PI) / 180
  const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 5))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps
    const x = ox + radius * Math.cos(t)
    const y = oy - radius * Math.sin(t)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function midLabel(ox: number, oy: number, startDeg: number, endDeg: number, radius: number) {
  const m = ((startDeg + endDeg) / 2) * Math.PI / 180
  return { x: ox + radius * Math.cos(m) - 10, y: oy - radius * Math.sin(m) + 4 }
}

export const angle_pair: SimFile = {
  id: 'angle_pair',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 6,
  label: 'Complement and supplement',
  description: 'Adjacent angles that make 90° (complement) or 180° (supplement)',
  equations: ["A + A' = 90^\\circ", "A + A'' = 180^\\circ"],
  keywords: ['complementary', 'supplementary', 'adjacent angles', 'pair of angles'],
  params: [param('angleDeg', 'Angle', 'deg', 5, 85, 1, 35)],
  schema: z.object({
    angleDeg: num(1, 89, 35),
  }),
  run(params) {
    const A = params.angleDeg
    const comp = complement(A)
    const supp = supplement(A)
    const len = 110
    const cOx = 130
    const cOy = 210
    const sOx = 360
    const sOy = 200
    const c90 = ray(cOx, cOy, 90, len)
    const c0 = ray(cOx, cOy, 0, len)
    const cA = ray(cOx, cOy, A, len)
    const s0 = ray(sOx, sOy, 0, len)
    const s180 = ray(sOx, sOy, 180, len)
    const sA = ray(sOx, sOy, A, len)
    const aLab = midLabel(cOx, cOy, 0, A, 48)
    const cLab = midLabel(cOx, cOy, A, 90, 48)
    const aLab2 = midLabel(sOx, sOy, 0, A, 44)
    const sLab = midLabel(sOx, sOy, A, 180, 52)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 28, 24, `A + A′ = ${A}° + ${comp}° = 90°`),
          label('eq2', 28, 42, `A + A″ = ${A}° + ${supp}° = 180°`),
          label('t1', 88, 72, 'complementary'),
          line('c-base', { x1: cOx, y1: cOy, x2: c0.x, y2: c0.y, stroke: '#334155', strokeWidth: 3 }),
          line('c-up', { x1: cOx, y1: cOy, x2: c90.x, y2: c90.y, stroke: '#334155', strokeWidth: 3 }),
          line('c-ray', { x1: cOx, y1: cOy, x2: cA.x, y2: cA.y, stroke: '#2563eb', strokeWidth: 3 }),
          pathEl('sq', {
            d: `M ${cOx + 12} ${cOy} L ${cOx + 12} ${cOy - 12} L ${cOx} ${cOy - 12}`,
            fill: 'none',
            stroke: '#64748b',
            strokeWidth: 1.5,
          }),
          pathEl('arcA', { d: arcD(cOx, cOy, 0, A, 28), fill: 'none', stroke: '#2563eb', strokeWidth: 2.5 }),
          pathEl('arcC', { d: arcD(cOx, cOy, A, 90, 34), fill: 'none', stroke: '#16a34a', strokeWidth: 2.5 }),
          label('la', aLab.x, aLab.y, `${A}°`, '#2563eb'),
          label('lc', cLab.x, cLab.y, `${comp}°`, '#16a34a'),
          label('t2', 310, 72, 'supplementary'),
          line('s-left', { x1: sOx, y1: sOy, x2: s180.x, y2: s180.y, stroke: '#334155', strokeWidth: 3 }),
          line('s-right', { x1: sOx, y1: sOy, x2: s0.x, y2: s0.y, stroke: '#334155', strokeWidth: 3 }),
          line('s-ray', { x1: sOx, y1: sOy, x2: sA.x, y2: sA.y, stroke: '#2563eb', strokeWidth: 3 }),
          pathEl('arcA2', { d: arcD(sOx, sOy, 0, A, 26), fill: 'none', stroke: '#2563eb', strokeWidth: 2.5 }),
          pathEl('arcS', { d: arcD(sOx, sOy, A, 180, 32), fill: 'none', stroke: '#d97706', strokeWidth: 2.5 }),
          label('la2', aLab2.x, aLab2.y, `${A}°`, '#2563eb'),
          label('ls', sLab.x, sLab.y, `${supp}°`, '#d97706'),
        ],
      },
      metrics: { angleDeg: A, complement: comp, supplement: supp },
      warnings: [],
    }
  },
}
