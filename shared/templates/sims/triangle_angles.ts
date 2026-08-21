import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

function heading(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

function arcD(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  let a0 = (startDeg * Math.PI) / 180
  let span = endDeg - startDeg
  while (span < 0) span += 360
  while (span >= 360) span -= 360
  const steps = Math.max(8, Math.round(span / 5))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((span * Math.PI) / 180) * (i / steps)
    pts.push(`${i === 0 ? 'M' : 'L'} ${(ox + radius * Math.cos(t)).toFixed(1)} ${(oy - radius * Math.sin(t)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function rightMark(ox: number, oy: number, d1: number, d2: number, m: number): string {
  const r1x = Math.cos((d1 * Math.PI) / 180)
  const r1y = Math.sin((d1 * Math.PI) / 180)
  const r2x = Math.cos((d2 * Math.PI) / 180)
  const r2y = Math.sin((d2 * Math.PI) / 180)
  const p1x = ox + m * r1x
  const p1y = oy - m * r1y
  const p2x = ox + m * r2x
  const p2y = oy - m * r2y
  const px = ox + m * r1x + m * r2x
  const py = oy - m * r1y - m * r2y
  return `M ${p1x.toFixed(1)} ${p1y.toFixed(1)} L ${px.toFixed(1)} ${py.toFixed(1)} L ${p2x.toFixed(1)} ${p2y.toFixed(1)}`
}

function bisectorLabel(ox: number, oy: number, startDeg: number, span: number, radius: number) {
  const m = ((startDeg + span / 2) * Math.PI) / 180
  return { x: ox + radius * Math.cos(m) - 12, y: oy - radius * Math.sin(m) + 4 }
}

function dist(p: { x: number; y: number }, q: { x: number; y: number }): number {
  return Math.hypot(q.x - p.x, q.y - p.y)
}

export const triangle_angles: SimFile = {
  id: 'triangle_angles',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 7,
  label: 'Triangle angle sum',
  description: 'Interior angles of a triangle add to 180°',
  equations: ['A + B + C = 180^\\circ'],
  keywords: ['angle sum property', 'triangle angles', 'interior angles of a triangle'],
  params: [
    param('A', 'Angle A', 'deg', 20, 140, 1, 50),
    param('B', 'Angle B', 'deg', 20, 140, 1, 60),
  ],
  schema: z.object({
    A: num(5, 170, 50),
    B: num(5, 170, 60),
  }),
  run(params) {
    const A = params.A
    const B = params.B
    const C = 180 - A - B
    const warnings: string[] = []
    if (C <= 0) warnings.push('A + B must be less than 180°')

    const elements = [
      label('eq', 24, 22, `${A}° + ${B}° + ${C}° = 180°`),
    ]

    if (C > 0.5) {
      const Ar = (A * Math.PI) / 180
      const Br = (B * Math.PI) / 180
      const den = Math.cos(Ar) + Math.sin(Ar) / Math.tan(Br)
      const t = den > 1e-8 ? 1 / den : 1
      const Am = { x: 0, y: 0 }
      const Bm = { x: 1, y: 0 }
      const Cm = { x: t * Math.cos(Ar), y: t * Math.sin(Ar) }
      const minX = Math.min(Am.x, Bm.x, Cm.x)
      const maxX = Math.max(Am.x, Bm.x, Cm.x)
      const minY = Math.min(Am.y, Bm.y, Cm.y)
      const maxY = Math.max(Am.y, Bm.y, Cm.y)
      const s = Math.min(388 / Math.max(maxX - minX, 0.05), 200 / Math.max(maxY - minY, 0.05))
      const toScreen = (p: { x: number; y: number }) => ({
        x: 56 + (p.x - minX) * s,
        y: 56 + (maxY - p.y) * s,
      })
      const Av = toScreen(Am)
      const Bv = toScreen(Bm)
      const Cv = toScreen(Cm)
      const aA = heading(Am, Bm)
      const aAc = heading(Am, Cm)
      const bBc = heading(Bm, Cm)
      const bBa = heading(Bm, Am)
      const cCa = heading(Cm, Am)
      const cCb = heading(Cm, Bm)
      const r = Math.min(30, Math.max(14, 0.16 * Math.min(dist(Av, Bv), dist(Bv, Cv), dist(Cv, Av))))
      const ink = '#334155'
      const labA = bisectorLabel(Av.x, Av.y, aA, A, r + 14)
      const labB = bisectorLabel(Bv.x, Bv.y, bBc, B, r + 14)
      const labC = bisectorLabel(Cv.x, Cv.y, cCa, C, r + 14)
      const near90 = (deg: number) => Math.abs(deg - 90) < 0.6

      elements.push(
        line('ab', { x1: Av.x, y1: Av.y, x2: Bv.x, y2: Bv.y, stroke: ink, strokeWidth: 2 }),
        line('bc', { x1: Bv.x, y1: Bv.y, x2: Cv.x, y2: Cv.y, stroke: ink, strokeWidth: 2 }),
        line('ca', { x1: Cv.x, y1: Cv.y, x2: Av.x, y2: Av.y, stroke: ink, strokeWidth: 2 }),
        pathEl('wA', { d: arcD(Av.x, Av.y, aA, aAc, r), fill: 'none', stroke: ink, strokeWidth: 1.5 }),
        pathEl('wB', { d: arcD(Bv.x, Bv.y, bBc, bBa, r), fill: 'none', stroke: ink, strokeWidth: 1.5 }),
        pathEl('wC', { d: arcD(Cv.x, Cv.y, cCa, cCb, r), fill: 'none', stroke: ink, strokeWidth: 1.5 })
      )
      if (near90(A)) {
        elements.push(pathEl('sqA', { d: rightMark(Av.x, Av.y, aA, aAc, 12), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      }
      if (near90(B)) {
        elements.push(pathEl('sqB', { d: rightMark(Bv.x, Bv.y, bBc, bBa, 12), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      }
      if (near90(C)) {
        elements.push(pathEl('sqC', { d: rightMark(Cv.x, Cv.y, cCa, cCb, 12), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      }
      elements.push(
        label('la', labA.x, labA.y, `${A}°`, ink),
        label('lb', labB.x, labB.y, `${B}°`, ink),
        label('lc', labC.x, labC.y, `${C}°`, ink)
      )
    }

    return {
      stage: { viewBox: VIEW, elements },
      metrics: { A, B, C },
      warnings,
    }
  },
}
