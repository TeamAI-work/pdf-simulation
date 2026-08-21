import { z } from 'zod'
import { choice, num, param, type SimFile } from '../contract.js'
import { VIEW, arrow, label, line, n, pathEl, rect, tLoop } from '../stage.js'

function ellipseD(cx: number, cy: number, rx: number, ry: number): string {
  const rxf = rx.toFixed(1)
  const ryf = ry.toFixed(1)
  return `M ${(cx - rx).toFixed(1)} ${cy.toFixed(1)} A ${rxf} ${ryf} 0 0 0 ${(cx + rx).toFixed(1)} ${cy.toFixed(1)} A ${rxf} ${ryf} 0 0 0 ${(cx - rx).toFixed(1)} ${cy.toFixed(1)}`
}

export const volume_fill: SimFile = {
  id: 'volume_fill',
  domain: 'math',
  classBand: '8-10',
  label: 'Volume fill',
  ncertClass: 9,
  description: 'Fill a cylinder (0) or cone (1) whose size is set by r and h',
  equations: ['V_{cyl} = \\pi r^2 h', 'V_{cone} = \\tfrac13 \\pi r^2 h'],
  keywords: ['volume of cylinder', 'volume of cone', 'capacity', 'fill tank'],
  params: [
    param('r', 'Radius', '', 0.5, 8, 0.1, 2),
    param('h', 'Height', '', 1, 12, 0.1, 5),
    choice('shape', 'Shape', [
      { value: 0, label: 'Cylinder' },
      { value: 1, label: 'Cone' },
    ], 0),
  ],
  schema: z.object({
    r: num(0.2, 20, 2),
    h: num(0.5, 30, 5),
    shape: num(0, 1, 0),
  }),
  run(params) {
    const { r, h, shape } = params
    const isCone = shape >= 0.5
    const V = Math.PI * r * r * h * (isCone ? 1 / 3 : 1)
    const scale = Math.min(88 / Math.max(r, 0.4), 186 / Math.max(h, 0.4))
    const R = r * scale
    const H = h * scale
    const cx = 250
    const baseY = 256
    const topY = baseY - H
    const ry = Math.max(7, Math.min(14, R * 0.2))
    const t = tLoop(3.4, 3)
    const frac = `min(1, (${t}) / 3)`
    const dimX = cx + R + 22
    const elements = [
      label('kind', 28, 22, isCone ? 'Cone' : 'Cylinder'),
      label('V', 28, 40, isCone ? `V = ⅓πr²h = ${V.toFixed(1)}` : `V = πr²h = ${V.toFixed(1)}`),
      label('rh', 28, 58, `r = ${r}    h = ${h}`),
      arrow('h-arr', { x1: dimX, y1: baseY, x2: dimX, y2: topY, stroke: '#334155', strokeWidth: 1.5 }),
      label('h-tag', dimX + 6, (topY + baseY) / 2, 'h'),
      arrow('r-arr', {
        x1: cx,
        y1: topY - 16,
        x2: cx + R,
        y2: topY - 16,
        stroke: '#334155',
        strokeWidth: 1.5,
      }),
      label('r-tag', cx + R / 2 - 4, topY - 22, 'r'),
    ]
    if (isCone) {
      const u = `${n(H)} * (${frac})`
      const half = `${n(R)} * (${frac})`
      elements.push(
        pathEl('fill', {
          d: {
            $expr: `concat('M ', ${n(cx)} - (${half}), ' ', ${n(baseY)} - (${u}), ' L ', ${n(cx)} + (${half}), ' ', ${n(baseY)} - (${u}), ' L ', ${n(cx)}, ' ', ${n(baseY)}, ' Z')`,
          },
          fill: '#38bdf8',
          opacity: 0.55,
        }),
        pathEl('cone', {
          d: `M ${cx - R} ${topY} L ${cx + R} ${topY} L ${cx} ${baseY} Z`,
          fill: 'none',
          stroke: '#334155',
          strokeWidth: 3,
        }),
        pathEl('rim', { d: ellipseD(cx, topY, R, ry), fill: 'none', stroke: '#334155', strokeWidth: 2 })
      )
    } else {
      elements.push(
        pathEl('bottom', { d: ellipseD(cx, baseY, R, ry), fill: '#bae6fd', stroke: '#334155', strokeWidth: 2 }),
        line('left', { x1: cx - R, y1: topY, x2: cx - R, y2: baseY, stroke: '#334155', strokeWidth: 3 }),
        line('right', { x1: cx + R, y1: topY, x2: cx + R, y2: baseY, stroke: '#334155', strokeWidth: 3 }),
        rect(
          'fill',
          {
            x: cx - R + 1,
            y: { $expr: `${n(baseY)} - ${n(H)} * (${frac})` },
            width: Math.max(2, 2 * R - 2),
            height: { $expr: `${n(H)} * (${frac})` },
            fill: '#38bdf8',
            opacity: 0.55,
          },
          'projectile'
        ),
        pathEl('rim', { d: ellipseD(cx, topY, R, ry), fill: 'none', stroke: '#334155', strokeWidth: 2 })
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { r, h, shape: isCone ? 1 : 0, volume: Number(V.toFixed(4)) },
      warnings: [],
    }
  },
}
