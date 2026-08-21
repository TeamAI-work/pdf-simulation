import { z } from 'zod'
import { workFs } from '../physics.js'
import { num, param, type SimFile } from '../contract.js'
import { GROUND_Y, VIEW, arrow, label, line, n, rect, tLoop } from '../stage.js'

function fmt(x: number): string {
  const r = Math.round(x * 100) / 100
  return Number.isInteger(r) ? String(r) : r.toFixed(2)
}

export const work_fs: SimFile = {
  id: 'work_fs',
  domain: 'physics',
  classBand: '9-10',
  ncertClass: 9,
  label: 'Work W = Fs cosθ',
  description: 'Work done by a constant force over a displacement: W = F s cosθ',
  equations: ['W = F s \\cos\\theta'],
  keywords: ['work done', 'fs cos', 'work energy', 'constant force work', 'displacement work'],
  params: [
    param('force', 'Force', 'N', 1, 80, 1, 10),
    param('s', 'Displacement', 'm', 0.5, 20, 0.5, 2),
    param('angleDeg', 'Angle θ', 'deg', 0, 180, 5, 0),
  ],
  schema: z.object({
    force: num(0, 1e4, 10),
    s: num(0, 200, 2),
    angleDeg: num(0, 180, 0),
  }),
  run(params) {
    const { force, s, angleDeg } = params
    const W = workFs(force, s, angleDeg)
    const ink = '#334155'
    const tMax = 2.4
    const tt = tLoop(tMax + 0.5, tMax)
    const scale = 260 / Math.max(s, 0.5)
    const rad = (angleDeg * Math.PI) / 180
    const c = Math.cos(rad)
    const sn = Math.sin(rad)
    const x0 = 56
    const blockW = 36
    const blockH = 26
    const yBlock = GROUND_Y - blockH
    const midY = yBlock + blockH / 2
    const travel = scale * s
    const bx = `${n(x0)} + ${n(travel)} * ((${tt}) / ${n(tMax)})`
    const cx = `(${bx}) + ${n(blockW / 2)}`
    const fLen = 42 + Math.min(50, force * 1.1)
    const fx2 = `(${cx}) + ${n(fLen * c)}`
    const fy2 = midY - fLen * sn
    const showTheta = angleDeg >= 4
    const showComp = Math.abs(c) > 0.12 && Math.abs(c) < 0.97
    const xEnd = x0 + travel
    const elements = [
      label('W', 24, 22, `W = Fs cosθ = ${fmt(W)} J`),
      line('ground', { x1: 24, y1: GROUND_Y, x2: 476, y2: GROUND_Y, stroke: ink, strokeWidth: 2 }),
      arrow('s', {
        x1: x0,
        y1: GROUND_Y + 16,
        x2: xEnd,
        y2: GROUND_Y + 16,
        stroke: ink,
        strokeWidth: 1.5,
        label: 's',
      }),
      rect(
        'block',
        {
          x: { $expr: bx },
          y: yBlock,
          width: blockW,
          height: blockH,
          fill: '#e2e8f0',
          stroke: ink,
          strokeWidth: 1.5,
          rx: 3,
        },
        'projectile'
      ),
      arrow('F', {
        x1: { $expr: cx },
        y1: midY,
        x2: { $expr: fx2 },
        y2: fy2,
        stroke: ink,
        strokeWidth: 2.5,
        label: 'F',
      }),
    ]
    if (showComp) {
      elements.push(
        arrow('Fpar', {
          x1: { $expr: cx },
          y1: midY + 1,
          x2: { $expr: `(${cx}) + ${n(fLen * c)}` },
          y2: midY + 1,
          stroke: ink,
          strokeWidth: 1.25,
          label: 'F cosθ',
        })
      )
    }
    if (showTheta) {
      elements.push(
        {
          id: 'th-arc',
          type: 'arc' as const,
          role: 'none' as const,
          props: {
            cx: { $expr: cx },
            cy: midY,
            r: 26,
            startAngle: -rad,
            endAngle: 0,
            stroke: ink,
            strokeWidth: 1.5,
            fill: 'none',
          },
        },
        {
          id: 'th',
          type: 'text' as const,
          role: 'none' as const,
          props: {
            x: { $expr: `(${cx}) + ${n(38 * Math.cos(rad / 2))}` },
            y: midY - 38 * Math.sin(rad / 2) + 4,
            fill: ink,
            fontSize: 12,
          },
          text: 'θ',
        }
      )
    }
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { force, s, angleDeg, W: Number(W.toFixed(4)) },
      warnings: [],
    }
  },
}
