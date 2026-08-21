import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, label, line, pathEl } from '../stage.js'

type Pt = { x: number; y: number }

function heading(from: Pt, to: Pt): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
}

function dist(p: Pt, q: Pt): number {
  return Math.hypot(q.x - p.x, q.y - p.y)
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

function convexQuad(A: number, B: number, C: number): { A: Pt; B: Pt; C: Pt; D: Pt } | null {
  const Ar = (A * Math.PI) / 180
  const Br = (B * Math.PI) / 180
  const Cr = (C * Math.PI) / 180
  const sinA = Math.sin(Ar)
  if (Math.abs(sinA) < 1e-6) return null
  const cotA = Math.cos(Ar) / sinA
  const sinB = Math.sin(Br)
  const cosB = Math.cos(Br)
  const sinBC = Math.sin(Br + Cr)
  const cosBC = Math.cos(Br + Cr)
  const den = sinBC * cotA + cosBC
  if (Math.abs(den) < 1e-8) return null
  for (const s of [1, 0.6, 0.8, 1.2, 1.5, 2, 2.5, 0.4, 3, 3.5]) {
    const u = (s * (sinB * cotA + cosB) - 1) / den
    const t = (s * sinB - u * sinBC) / sinA
    if (t > 0.08 && u > 0.08) {
      return {
        A: { x: 0, y: 0 },
        B: { x: 1, y: 0 },
        C: { x: 1 - s * cosB, y: s * sinB },
        D: { x: t * Math.cos(Ar), y: t * sinA },
      }
    }
  }
  return null
}

export const quadrilateral_live: SimFile = {
  id: 'quadrilateral_live',
  domain: 'math',
  classBand: '8-10',
  ncertClass: 8,
  label: 'Quadrilateral angles',
  description: 'Interior angles of a convex quadrilateral add to 360°',
  equations: ['A + B + C + D = 360^\\circ'],
  keywords: ['quadrilateral', 'opposite angles', 'sum of interior angles 360'],
  params: [
    param('A', 'Angle A', 'deg', 40, 160, 1, 80),
    param('B', 'Angle B', 'deg', 40, 160, 1, 100),
    param('C', 'Angle C', 'deg', 40, 160, 1, 90),
  ],
  schema: z.object({
    A: num(10, 200, 80),
    B: num(10, 200, 100),
    C: num(10, 200, 90),
  }),
  run(params) {
    const A = params.A
    const B = params.B
    const C = params.C
    const D = 360 - A - B - C
    const warnings: string[] = []
    if (D <= 0) warnings.push('A + B + C must be less than 360°')
    else if (D >= 180) warnings.push('each interior angle of a convex quadrilateral must be less than 180°')

    const elements = [
      label('eq', 24, 22, `${A}° + ${B}° + ${C}° + ${D}° = 360°`),
    ]

    const pts = D > 0.5 && D < 179.5 ? convexQuad(A, B, C) : null
    if (!pts) {
      if (D > 0.5 && D < 179.5) warnings.push('cannot form a simple quadrilateral with these angles')
    } else {
      const minX = Math.min(pts.A.x, pts.B.x, pts.C.x, pts.D.x)
      const maxX = Math.max(pts.A.x, pts.B.x, pts.C.x, pts.D.x)
      const minY = Math.min(pts.A.y, pts.B.y, pts.C.y, pts.D.y)
      const maxY = Math.max(pts.A.y, pts.B.y, pts.C.y, pts.D.y)
      const scale = Math.min(380 / Math.max(maxX - minX, 0.05), 196 / Math.max(maxY - minY, 0.05))
      const toScreen = (p: Pt) => ({
        x: 60 + (p.x - minX) * scale,
        y: 58 + (maxY - p.y) * scale,
      })
      const Av = toScreen(pts.A)
      const Bv = toScreen(pts.B)
      const Cv = toScreen(pts.C)
      const Dv = toScreen(pts.D)
      const aAb = heading(pts.A, pts.B)
      const aAd = heading(pts.A, pts.D)
      const bBc = heading(pts.B, pts.C)
      const bBa = heading(pts.B, pts.A)
      const cCd = heading(pts.C, pts.D)
      const cCb = heading(pts.C, pts.B)
      const dDa = heading(pts.D, pts.A)
      const dDc = heading(pts.D, pts.C)
      const r = Math.min(28, Math.max(14, 0.14 * Math.min(dist(Av, Bv), dist(Bv, Cv), dist(Cv, Dv), dist(Dv, Av))))
      const ink = '#334155'
      const labA = bisectorLabel(Av.x, Av.y, aAb, A, r + 12)
      const labB = bisectorLabel(Bv.x, Bv.y, bBc, B, r + 12)
      const labC = bisectorLabel(Cv.x, Cv.y, cCd, C, r + 12)
      const labD = bisectorLabel(Dv.x, Dv.y, dDa, D, r + 12)
      const near90 = (deg: number) => Math.abs(deg - 90) < 0.6
      elements.push(
        line('ab', { x1: Av.x, y1: Av.y, x2: Bv.x, y2: Bv.y, stroke: ink, strokeWidth: 2 }),
        line('bc', { x1: Bv.x, y1: Bv.y, x2: Cv.x, y2: Cv.y, stroke: ink, strokeWidth: 2 }),
        line('cd', { x1: Cv.x, y1: Cv.y, x2: Dv.x, y2: Dv.y, stroke: ink, strokeWidth: 2 }),
        line('da', { x1: Dv.x, y1: Dv.y, x2: Av.x, y2: Av.y, stroke: ink, strokeWidth: 2 }),
        pathEl('wA', { d: arcD(Av.x, Av.y, aAb, aAd, r), fill: 'none', stroke: ink, strokeWidth: 1.5 }),
        pathEl('wB', { d: arcD(Bv.x, Bv.y, bBc, bBa, r), fill: 'none', stroke: ink, strokeWidth: 1.5 }),
        pathEl('wC', { d: arcD(Cv.x, Cv.y, cCd, cCb, r), fill: 'none', stroke: ink, strokeWidth: 1.5 }),
        pathEl('wD', { d: arcD(Dv.x, Dv.y, dDa, dDc, r), fill: 'none', stroke: ink, strokeWidth: 1.5 })
      )
      if (near90(A)) elements.push(pathEl('sqA', { d: rightMark(Av.x, Av.y, aAb, aAd, 11), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      if (near90(B)) elements.push(pathEl('sqB', { d: rightMark(Bv.x, Bv.y, bBc, bBa, 11), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      if (near90(C)) elements.push(pathEl('sqC', { d: rightMark(Cv.x, Cv.y, cCd, cCb, 11), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      if (near90(D)) elements.push(pathEl('sqD', { d: rightMark(Dv.x, Dv.y, dDa, dDc, 11), fill: 'none', stroke: ink, strokeWidth: 1.25 }))
      elements.push(
        label('la', labA.x, labA.y, `${A}°`, ink),
        label('lb', labB.x, labB.y, `${B}°`, ink),
        label('lc', labC.x, labC.y, `${C}°`, ink),
        label('ld', labD.x, labD.y, `${D}°`, ink)
      )
    }

    return {
      stage: { viewBox: VIEW, elements },
      metrics: { A, B, C, D },
      warnings,
    }
  },
}
