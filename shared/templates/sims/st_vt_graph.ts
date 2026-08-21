import { z } from 'zod'
import { motionGraphs } from '../math.js'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, pathEl, tLoop } from '../stage.js'

export const st_vt_graph: SimFile = {
  id: 'st_vt_graph',
  domain: 'physics',
  classBand: '7-10',
  ncertClass: 9,
  label: 's–t and v–t graphs',
  description: 'Distance-time and velocity-time graphs for constant acceleration',
  equations: ['v = u + at', 's = ut + \\tfrac12 at^2'],
  keywords: ['distance-time graph', 'velocity-time graph', 's-t graph', 'v-t graph', 's-t and v-t'],
  params: [
    param('u', 'Initial speed u', 'm/s', 0, 40, 0.5, 0),
    param('a', 'Acceleration a', 'm/s²', -10, 20, 0.1, 2),
    param('tMax', 'Duration', 's', 1, 20, 0.5, 5),
  ],
  schema: z.object({
    u: num(0, 80, 0),
    a: num(-20, 40, 2),
    tMax: num(0.5, 40, 5),
  }),
  run(params) {
    const { u, a, tMax } = params
    const { sMax, vEnd } = motionGraphs(u, a, tMax)
    const sAbs = Math.max(Math.abs(sMax), 1)
    const vMin = Math.min(u, vEnd, 0)
    const vMax = Math.max(u, vEnd, 1)
    const vSpan = Math.max(vMax - vMin, 1)

    const left = { x0: 50, y0: 250, w: 180, h: 180 }
    const right = { x0: 280, y0: 250, w: 180, h: 180 }
    const steps = 24
    const sPts: string[] = []
    const vPts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const t = (tMax * i) / steps
      const s = u * t + 0.5 * a * t * t
      const v = u + a * t
      const tx = left.x0 + (t / tMax) * left.w
      const ty = left.y0 - (s / sAbs) * left.h
      const vx = right.x0 + (t / tMax) * right.w
      const vy = right.y0 - ((v - vMin) / vSpan) * right.h
      sPts.push(`${i === 0 ? 'M' : 'L'} ${tx.toFixed(1)} ${ty.toFixed(1)}`)
      vPts.push(`${i === 0 ? 'M' : 'L'} ${vx.toFixed(1)} ${vy.toFixed(1)}`)
    }

    const tExpr = tLoop(tMax + 0.8, tMax)
    const tFrac = `(${tExpr}) / ${n(tMax)}`
    const sExpr = `${n(u)} * (${tExpr}) + 0.5 * ${n(a)} * (${tExpr})^2`
    const vExpr = `${n(u)} + ${n(a)} * (${tExpr})`

    return {
      stage: {
        viewBox: VIEW,
        elements: [
          line('sx', { x1: left.x0, y1: left.y0, x2: left.x0 + left.w, y2: left.y0, stroke: '#475569', strokeWidth: 1 }),
          line('sy', { x1: left.x0, y1: left.y0 - left.h, x2: left.x0, y2: left.y0, stroke: '#475569', strokeWidth: 1 }),
          pathEl('s-curve', { d: sPts.join(' '), stroke: '#38bdf8', fill: 'none', strokeWidth: 2.5 }),
          circle(
            's-dot',
            {
              cx: { $expr: `${n(left.x0)} + (${tFrac}) * ${n(left.w)}` },
              cy: { $expr: `${n(left.y0)} - ((${sExpr}) / ${n(sAbs)}) * ${n(left.h)}` },
              r: 5,
              fill: '#38bdf8',
            },
            'projectile'
          ),
          line('vx', { x1: right.x0, y1: right.y0, x2: right.x0 + right.w, y2: right.y0, stroke: '#475569', strokeWidth: 1 }),
          line('vy', { x1: right.x0, y1: right.y0 - right.h, x2: right.x0, y2: right.y0, stroke: '#475569', strokeWidth: 1 }),
          pathEl('v-curve', { d: vPts.join(' '), stroke: '#f472b6', fill: 'none', strokeWidth: 2.5 }),
          circle('v-dot', {
            cx: { $expr: `${n(right.x0)} + (${tFrac}) * ${n(right.w)}` },
            cy: { $expr: `${n(right.y0)} - ((${vExpr}) - ${n(vMin)}) / ${n(vSpan)} * ${n(right.h)}` },
            r: 5,
            fill: '#f472b6',
          }),
          label('sl', left.x0, 28, 's–t'),
          label('vl', right.x0, 28, 'v–t'),
          label('eq', 28, 46, `s = ${sMax.toFixed(1)} m, v = ${vEnd.toFixed(1)} m/s`),
        ],
      },
      metrics: { sMax: Number(sMax.toFixed(4)), vEnd: Number(vEnd.toFixed(4)), u, a, tMax },
      warnings: [],
    }
  },
}
