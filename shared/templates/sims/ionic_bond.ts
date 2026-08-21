import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, tLoop } from '../stage.js'

const CL_ANGLES = [0, 45, 90, 135, 225, 270, 315].map((deg) => (deg * Math.PI) / 180)

export const ionic_bond: SimFile = {
  id: 'ionic_bond',
  domain: 'chemistry',
  classBand: '9-10',
  label: 'Ionic bond',
  ncertClass: 9,
  description: 'Na donates its valence electron to Cl; Na⁺ and Cl⁻ attract',
  equations: ['\\text{Na} + \\text{Cl} \\rightarrow \\text{Na}^+ + \\text{Cl}^-'],
  keywords: ['ionic bond', 'ionic bonding', 'electron transfer', 'sodium chloride', 'cation anion'],
  params: [param('duration', 'Duration', 's', 1, 8, 0.5, 3)],
  schema: z.object({
    duration: num(0.5, 12, 3),
  }),
  run(params) {
    const d = params.duration
    const t = tLoop(d + 1.1, d)
    const frac = `(${t}) / ${n(d)}`
    const approach = `min(1, (${frac}) / 0.32)`
    const transfer = `min(1, max(0, ((${frac}) - 0.38) / 0.32))`
    const naX = `${n(148)} + ${n(32)} * (${approach})`
    const clX = `${n(352)} - ${n(32)} * (${approach})`
    const cy = 168
    const rNa = `(${transfer} > 0.55) ? 20 : 26`
    const rCl = `(${transfer} > 0.55) ? 40 : 32`
    const after = `(${transfer} > 0.7) ? 1 : 0`
    const before = `(${transfer} > 0.7) ? 0 : 1`
    const clDots = CL_ANGLES.map((ang, i) =>
      circle(`cl-e${i}`, {
        cx: { $expr: `(${clX}) + (${rCl}) * ${n(Math.cos(ang))}` },
        cy: { $expr: `${n(cy)} + (${rCl}) * ${n(Math.sin(ang))}` },
        r: 5,
        fill: '#ca8a04',
      })
    )
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('eq', 28, 24, 'Na + Cl → Na⁺ + Cl⁻'),
          line('attract', {
            x1: { $expr: `(${naX}) + (${rNa})` },
            y1: cy,
            x2: { $expr: `(${clX}) - (${rCl})` },
            y2: cy,
            stroke: '#64748b',
            strokeWidth: 2,
            strokeDasharray: '5 5',
            opacity: { $expr: after },
          }),
          circle(
            'na',
            {
              cx: { $expr: naX },
              cy,
              r: { $expr: rNa },
              fill: '#38bdf8',
            },
            'projectile'
          ),
          circle('cl', {
            cx: { $expr: clX },
            cy,
            r: { $expr: rCl },
            fill: '#22c55e',
          }),
          ...clDots,
          circle('e', {
            cx: {
              $expr: `((${naX}) + (${rNa})) + (((${clX}) - (${rCl})) - ((${naX}) + (${rNa}))) * (${transfer})`,
            },
            cy: { $expr: `${n(cy)} - 42 * sin(3.14159 * (${transfer}))` },
            r: 6,
            fill: '#eab308',
          }),
          {
            id: 'na-atom',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: naX },
              y: cy + 5,
              fill: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
              textAnchor: 'middle',
              opacity: { $expr: before },
            },
            text: 'Na',
          },
          {
            id: 'na-ion',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: naX },
              y: cy + 5,
              fill: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
              textAnchor: 'middle',
              opacity: { $expr: after },
            },
            text: 'Na⁺',
          },
          {
            id: 'cl-atom',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: clX },
              y: cy + 5,
              fill: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
              textAnchor: 'middle',
              opacity: { $expr: before },
            },
            text: 'Cl',
          },
          {
            id: 'cl-ion',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: { $expr: clX },
              y: cy + 5,
              fill: '#0f172a',
              fontSize: 13,
              fontWeight: 700,
              textAnchor: 'middle',
              opacity: { $expr: after },
            },
            text: 'Cl⁻',
          },
          {
            id: 'e-tag',
            type: 'text' as const,
            role: 'none' as const,
            props: {
              x: {
                $expr: `((${naX}) + (${rNa})) + (((${clX}) - (${rCl})) - ((${naX}) + (${rNa}))) * (${transfer})`,
              },
              y: { $expr: `${n(cy)} - 54 * sin(3.14159 * (${transfer})) - 10` },
              fill: '#a16207',
              fontSize: 11,
              fontWeight: 700,
              textAnchor: 'middle',
              opacity: { $expr: `(${transfer} > 0.05) ? ((${transfer} < 0.95) ? 1 : 0) : 0` },
            },
            text: 'e⁻',
          },
        ],
      },
      metrics: { duration: d },
      warnings: [],
    }
  },
}
