import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, pathEl } from '../stage.js'

function arcPath(ox: number, oy: number, startDeg: number, endDeg: number, radius: number): string {
  const a0 = (startDeg * Math.PI) / 180
  const a1 = (endDeg * Math.PI) / 180
  const steps = Math.max(8, Math.round(Math.abs(endDeg - startDeg) / 6))
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = a0 + ((a1 - a0) * i) / steps
    const x = ox + radius * Math.cos(t)
    const y = oy + radius * Math.sin(t)
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function chevron(id: string, x: number, y: number): ReturnType<typeof pathEl> {
  return pathEl(id, {
    d: `M ${x - 7} ${y - 5} L ${x} ${y} L ${x - 7} ${y + 5} M ${x + 1} ${y - 5} L ${x + 8} ${y} L ${x + 1} ${y + 5}`,
    fill: 'none',
    stroke: '#334155',
    strokeWidth: 2,
  })
}

export const parallel_transversal: SimFile = {
  id: 'parallel_transversal',
  domain: 'math',
  classBand: '6-8',
  ncertClass: 7,
  label: 'Parallel lines and transversal',
  description: 'A transversal cuts two parallel lines; corresponding and alternate interior angles are equal',
  equations: ['\\text{corresponding } = \\text{alternate interior}', '\\text{co-interior } = 180^\\circ'],
  keywords: ['parallel lines', 'transversal', 'corresponding angles', 'alternate interior'],
  params: [param('angleDeg', 'Angle', 'deg', 20, 80, 1, 60)],
  schema: z.object({
    angleDeg: num(10, 85, 60),
  }),
  run(params) {
    const A = params.angleDeg
    const adj = 180 - A
    const rad = (A * Math.PI) / 180
    const y1 = 112
    const y2 = 208
    const midX = 250
    const midY = (y1 + y2) / 2
    const ux = Math.cos(rad)
    const uy = Math.sin(rad)
    const halfGap = (y2 - y1) / 2
    const ix1 = midX - halfGap / Math.tan(rad)
    const ix2 = midX + halfGap / Math.tan(rad)
    const extra = 78
    const tx1 = ix1 - extra * ux
    const ty1 = y1 - extra * uy
    const tx2 = ix2 + extra * ux
    const ty2 = y2 + extra * uy
    const rArc = 28
    const bisA = A / 2
    const lab = (ix: number, iy: number, deg: number, radius: number) => ({
      x: ix + radius * Math.cos((deg * Math.PI) / 180) - 8,
      y: iy + radius * Math.sin((deg * Math.PI) / 180) + 4,
    })
    const c1 = lab(ix1, y1, bisA, 42)
    const c2 = lab(ix2, y2, bisA, 42)
    const alt = lab(ix2, y2, 180 + bisA, 42)
    const co = lab(ix1, y1, (A + 180) / 2, 44)
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 28, 24, `corr. = alt. int. = ${A}°`),
          label('co', 28, 42, `co-interior = ${A}° + ${adj}° = 180°`),
          line('p1', { x1: 40, y1: y1, x2: 460, y2: y1, stroke: '#334155', strokeWidth: 3 }),
          line('p2', { x1: 40, y1: y2, x2: 460, y2: y2, stroke: '#334155', strokeWidth: 3 }),
          chevron('m1', 86, y1),
          chevron('m2', 86, y2),
          line('tr', { x1: tx1, y1: ty1, x2: tx2, y2: ty2, stroke: '#2563eb', strokeWidth: 3 }),
          circle('v1', { cx: ix1, cy: y1, r: 4, fill: '#0f172a' }),
          circle('v2', { cx: ix2, cy: y2, r: 4, fill: '#0f172a' }),
          pathEl('corr1', { d: arcPath(ix1, y1, 0, A, rArc), fill: 'none', stroke: '#16a34a', strokeWidth: 2.5 }),
          pathEl('corr2', { d: arcPath(ix2, y2, 0, A, rArc), fill: 'none', stroke: '#16a34a', strokeWidth: 2.5 }),
          pathEl('alt2', { d: arcPath(ix2, y2, 180, 180 + A, rArc), fill: 'none', stroke: '#d97706', strokeWidth: 2.5 }),
          pathEl('co1', { d: arcPath(ix1, y1, A, 180, rArc + 6), fill: 'none', stroke: '#7c3aed', strokeWidth: 2 }),
          label('a1', c1.x, c1.y, `${A}°`, '#16a34a'),
          label('a2', c2.x, c2.y, `${A}°`, '#16a34a'),
          label('a3', alt.x, alt.y, `${A}°`, '#d97706'),
          label('a4', co.x, co.y, `${adj}°`, '#7c3aed'),
          label('l1', 42, y1 - 10, 'l₁'),
          label('l2', 42, y2 + 18, 'l₂'),
          label('t', tx2 - 8, ty2 + 6, 't', '#2563eb'),
        ],
      },
      metrics: {
        angleDeg: A,
        corresponding: A,
        alternateInterior: A,
        coInterior: 180,
        adjacent: adj,
      },
      warnings: [],
    }
  },
}
