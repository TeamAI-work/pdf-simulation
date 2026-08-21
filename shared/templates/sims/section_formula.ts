import { z } from 'zod'
import { sectionPoint } from '../math.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

function fmt(x: number): string {
  const r = Math.round(x * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

function coord(x: number, y: number): string {
  return `(${fmt(x)}, ${fmt(y)})`
}

export const section_formula: SimFile = {
  id: 'section_formula',
  domain: 'math',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Section formula',
  description: 'Point dividing the segment joining A and B internally in the ratio m : n',
  equations: ['x = (m x_2 + n x_1)/(m+n)', 'y = (m y_2 + n y_1)/(m+n)', 'AP:PB = m:n'],
  keywords: ['section formula', 'divides internally', 'ratio m:n', 'section formula internally', 'internally in the ratio'],
  params: [
    param('x1', 'x₁', '', -8, 8, 0.5, 0),
    param('y1', 'y₁', '', -8, 8, 0.5, 0),
    param('x2', 'x₂', '', -8, 8, 0.5, 4),
    param('y2', 'y₂', '', -8, 8, 0.5, 2),
    param('m', 'm', '', 1, 8, 1, 1),
    param('n', 'n', '', 1, 8, 1, 1),
  ],
  schema: z.object({
    x1: num(-20, 20, 0),
    y1: num(-20, 20, 0),
    x2: num(-20, 20, 4),
    y2: num(-20, 20, 2),
    m: num(0.1, 20, 1),
    n: num(0.1, 20, 1),
  }),
  run(params) {
    const { x1, y1, x2, y2, m, n } = params
    const { x, y } = sectionPoint(x1, y1, x2, y2, m, n)
    const ink = '#334155'
    const pts = [
      { x: x1, y: y1 },
      { x: x2, y: y2 },
      { x, y },
    ]
    let minX = Math.min(x1, x2, x)
    let maxX = Math.max(x1, x2, x)
    let minY = Math.min(y1, y2, y)
    let maxY = Math.max(y1, y2, y)
    const abW = Math.max(maxX - minX, 0.4)
    const abH = Math.max(maxY - minY, 0.4)
    const oW = Math.max(maxX, 0) - Math.min(minX, 0)
    const oH = Math.max(maxY, 0) - Math.min(minY, 0)
    const includeO = oW * oH <= abW * abH * 4
    if (includeO) {
      minX = Math.min(minX, 0)
      maxX = Math.max(maxX, 0)
      minY = Math.min(minY, 0)
      maxY = Math.max(maxY, 0)
    }
    if (maxX - minX < 1) {
      minX -= 0.8
      maxX += 0.8
    }
    if (maxY - minY < 1) {
      minY -= 0.8
      maxY += 0.8
    }
    const s = Math.min(380 / (maxX - minX), 210 / (maxY - minY))
    const to = (p: { x: number; y: number }) => ({
      x: 60 + (p.x - minX) * s,
      y: 44 + (maxY - p.y) * s,
    })
    const A = to(pts[0])
    const B = to(pts[1])
    const P = to(pts[2])
    const O = to({ x: 0, y: 0 })
    const dx = B.x - A.x
    const dy = B.y - A.y
    const len = Math.hypot(dx, dy) || 1
    let nx = -dy / len
    let ny = dx / len
    if (ny > 0) {
      nx = -nx
      ny = -ny
    }
    const along = (from: { x: number; y: number }, away: { x: number; y: number }, dist: number) => {
      const ux = from.x - away.x
      const uy = from.y - away.y
      const l = Math.hypot(ux, uy) || 1
      return { x: from.x + (ux / l) * dist, y: from.y + (uy / l) * dist }
    }
    const aLab = along(A, B, 22)
    const bLab = along(B, A, 22)
    const mLab = { x: (A.x + P.x) / 2 + nx * 14 - 6, y: (A.y + P.y) / 2 + ny * 14 + 4 }
    const nLab = { x: (P.x + B.x) / 2 + nx * 14 - 6, y: (P.y + B.y) / 2 + ny * 14 + 4 }
    const pLab = { x: P.x - nx * 16 - 10, y: P.y - ny * 16 + 4 }
    const oInView = O.x > 24 && O.x < 476 && O.y > 28 && O.y < 286
    const elements = [
      label('eq', 24, 22, `AP : PB = ${fmt(m)} : ${fmt(n)}    P${coord(x, y)}`),
    ]
    if (includeO && oInView) {
      elements.push(
        line('xaxis', { x1: 36, y1: O.y, x2: 470, y2: O.y, stroke: '#94a3b8', strokeWidth: 1 }),
        line('yaxis', { x1: O.x, y1: 32, x2: O.x, y2: 280, stroke: '#94a3b8', strokeWidth: 1 })
      )
    }
    elements.push(
      line('seg', { x1: A.x, y1: A.y, x2: B.x, y2: B.y, stroke: ink, strokeWidth: 2 }),
      circle('A', { cx: A.x, cy: A.y, r: 3.5, fill: ink }),
      circle('B', { cx: B.x, cy: B.y, r: 3.5, fill: ink }),
      circle('R', { cx: P.x, cy: P.y, r: 5, fill: ink }),
      label('nA', aLab.x - 18, aLab.y + 4, `A${coord(x1, y1)}`, ink),
      label('nB', bLab.x - 18, bLab.y + 4, `B${coord(x2, y2)}`, ink),
      label('nP', pLab.x, pLab.y, 'P', ink),
      label('lm', mLab.x, mLab.y, fmt(m), ink),
      label('ln', nLab.x, nLab.y, fmt(n), ink)
    )
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)), x1, y1, x2, y2, m, n },
      warnings: [],
    }
  },
}
