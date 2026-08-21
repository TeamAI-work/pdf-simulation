import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, particles, pathEl, rect, tLoop } from '../stage.js'

const METALS = ['Na', 'Mg', 'Zn', 'Fe', 'Cu'] as const

/** Strip colour: silver → iron grey → copper. */
const METAL_FILL = ['#f8fafc', '#e2e8f0', '#cbd5e1', '#94a3b8', '#b45309'] as const
/** Salt solution: CuSO₄ blue, FeSO₄ pale green, others nearly colourless. */
const SALT_FILL = ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#bbf7d0', '#7dd3fc'] as const

function salt(name: string): string {
  return name === 'Na' ? 'Na₂SO₄' : `${name}SO₄`
}

function ion(name: string): string {
  return name === 'Na' ? 'Na⁺' : `${name}²⁺`
}

export const reactivity_swap: SimFile = {
  id: 'reactivity_swap',
  domain: 'chemistry',
  classBand: '9-10',
  ncertClass: 10,
  label: 'Displacement reaction',
  description:
    'Metals ranked 0–4: 0 Na, 1 Mg, 2 Zn, 3 Fe, 4 Cu (lower rank = more reactive). metalA displaces metalB from its salt if rankA < rankB',
  equations: ['A + BX \\rightarrow AX + B \\quad (A\\text{ more reactive than }B)'],
  keywords: ['displacement reaction', 'reactivity series', 'more reactive metal', 'zinc copper sulphate', 'activity series'],
  params: [
    choice(
      'metalA',
      'Metal A',
      METALS.map((name, i) => ({ value: i, label: name })),
      2
    ),
    choice(
      'metalB',
      'Metal B',
      METALS.map((name, i) => ({ value: i, label: name })),
      4
    ),
  ],
  schema: z.object({
    metalA: num(0, 4, 2),
    metalB: num(0, 4, 4),
  }),
  run(params) {
    const a = Math.max(0, Math.min(4, Math.round(params.metalA)))
    const b = Math.max(0, Math.min(4, Math.round(params.metalB)))
    const nameA = METALS[a]
    const nameB = METALS[b]
    const willDisplace = a < b
    const same = a === b
    const ink = '#334155'
    const eq = willDisplace
      ? `${nameA} + ${salt(nameB)} → ${salt(nameA)} + ${nameB}`
      : `${nameA} + ${salt(nameB)} → no reaction`

    const x0 = 168
    const x1 = 348
    const yLip = 58
    const yBot = 248
    const yLiq = 112
    const stripX = 236
    const stripW = 20
    const stripY = 52
    const stripH = 168
    const liqW = x1 - x0 - 8
    const liqH = yBot - yLiq - 4
    const t = tLoop(5.2, 3.8)
    const frac = `(${t}) / 3.8`

    const elements = [
      label('eq', 24, 24, eq),
      line('table', { x1: 48, y1: yBot + 4, x2: 430, y2: yBot + 4, stroke: ink, strokeWidth: 2 }),
      line('stand', { x1: 92, y1: 36, x2: 92, y2: yBot + 4, stroke: ink, strokeWidth: 2.5 }),
      line('base', { x1: 64, y1: yBot + 4, x2: 128, y2: yBot + 4, stroke: ink, strokeWidth: 5 }),
      line('arm', { x1: 92, y1: 48, x2: stripX + stripW / 2, y2: 48, stroke: ink, strokeWidth: 2 }),
      rect('clamp', { x: 84, y: 42, width: 16, height: 12, fill: '#e2e8f0', stroke: ink, strokeWidth: 1.5, rx: 1 }),
      rect('solB', {
        x: x0 + 4,
        y: yLiq,
        width: liqW,
        height: liqH,
        fill: SALT_FILL[b],
        opacity: willDisplace ? { $expr: `1 - 0.85 * (${frac})` } : 1,
      }),
      rect('solA', {
        x: x0 + 4,
        y: yLiq,
        width: liqW,
        height: liqH,
        fill: SALT_FILL[a],
        opacity: willDisplace ? { $expr: `0.85 * (${frac})` } : 0,
      }),
      pathEl('beaker', {
        d: `M ${x0 - 10} ${yLip} L ${x0} ${yLip + 12} L ${x0} ${yBot} L ${x1} ${yBot} L ${x1} ${yLip + 12} L ${x1 + 10} ${yLip}`,
        fill: 'none',
        stroke: ink,
        strokeWidth: 2.5,
      }),
      particles('ions', {
        cx: 304,
        cy: yLiq + liqH / 2,
        width: 72,
        height: liqH - 28,
        count: willDisplace ? 10 : 8,
        speed: willDisplace ? { $expr: `0.7 - 0.55 * (${frac})` } : 0.35,
        r: 4,
        fill: METAL_FILL[b],
        time: { $expr: 'time' },
      }),
      rect('strip', {
        x: stripX,
        y: stripY,
        width: stripW,
        height: stripH,
        fill: METAL_FILL[a],
        stroke: ink,
        strokeWidth: 1.5,
        rx: 2,
      }),
    ]

    if (willDisplace) {
      const spots = [
        { x: stripX - 5, y: 128, r: 5 },
        { x: stripX + stripW + 5, y: 136, r: 6 },
        { x: stripX - 6, y: 158, r: 6 },
        { x: stripX + stripW + 4, y: 168, r: 5 },
        { x: stripX - 4, y: 186, r: 7 },
        { x: stripX + stripW + 6, y: 194, r: 5 },
        { x: stripX - 5, y: 210, r: 5 },
        { x: stripX + stripW + 3, y: 216, r: 6 },
      ]
      spots.forEach((s, i) => {
        const delay = (i * 0.09).toFixed(2)
        elements.push(
          circle(`dep${i}`, {
            cx: s.x,
            cy: s.y,
            r: s.r,
            fill: METAL_FILL[b],
            stroke: ink,
            strokeWidth: 0.75,
            opacity: { $expr: `min(1, max(0, (${frac}) - ${delay}) / 0.22)` },
          })
        )
      })
      elements.push(
        circle(
          'ion-in',
          {
            cx: { $expr: `${n(318)} - ${n(64)} * (${frac})` },
            cy: { $expr: `${n(168)} + 6 * sin(2 * (${frac}) * 3.14159)` },
            r: 5,
            fill: METAL_FILL[b],
            stroke: ink,
            strokeWidth: 0.75,
            opacity: { $expr: `1 - ${frac}` },
          },
          'projectile'
        )
      )
    }

    elements.push(
      label('A', stripX - 2, 42, nameA),
      label('sol', x1 + 18, yLiq + 36, salt(nameB)),
      label('ionL', x1 + 18, yLiq + 54, ion(nameB))
    )

    return {
      stage: { viewBox: VIEW, elements },
      metrics: { metalA: a, metalB: b, nameA, nameB, willDisplace },
      warnings: same ? ['Same metal — no displacement'] : [],
    }
  },
}
