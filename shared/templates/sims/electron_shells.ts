import { z } from 'zod'
import { choice, num, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n } from '../stage.js'

const SHELL_NAME = ['K', 'L', 'M', 'N'] as const

function capacity(k: number): number {
  return 2 * k * k
}

export const electron_shells: SimFile = {
  id: 'electron_shells',
  domain: 'chemistry',
  classBand: '9-10',
  label: 'Bohr electron shells',
  ncertClass: 9,
  description: 'Bohr–Bury: shell n holds 2n² electrons; inner shells fill first',
  equations: ['N = 2n^2', 'r_n \\propto n^2', 'E_n = -13.6 / n^2\\ \\mathrm{eV}'],
  keywords: ['bohr', 'electron shell', 'orbit', 'principal quantum', 'energy level'],
  params: [
    choice('n', 'Shell', [
      { value: 1, label: 'K' },
      { value: 2, label: 'L' },
      { value: 3, label: 'M' },
      { value: 4, label: 'N' },
    ], 2),
  ],
  schema: z.object({
    n: num(1, 4, 2),
  }),
  run(params) {
    const nShell = Math.min(4, Math.max(1, Math.round(params.n)))
    const cx = 188
    const cy = 168
    const rOf = (k: number) => 18 + 6 * k * k
    const E = -13.6 / (nShell * nShell)
    const filled = [1, 2, 3, 4].map((k) => (k <= nShell ? capacity(k) : 0))
    const total = filled.reduce((a, b) => a + b, 0)
    const config = filled.filter((c) => c > 0).join(', ')
    const elements = [
      label('vals', 28, 24, `n = ${nShell} (${SHELL_NAME[nShell - 1]})    2n² = ${capacity(nShell)}`),
      label('er', 28, 42, `${config} e⁻    E = ${E.toFixed(2)} eV`),
      circle('nucleus', { cx, cy, r: 7, fill: '#dc2626' }),
      label('plus', cx - 4, cy + 4, '+', '#ffffff'),
    ]
    for (let k = 1; k <= 4; k++) {
      const occupied = k <= nShell
      const r = rOf(k)
      elements.push(
        circle(`shell-${k}`, {
          cx,
          cy,
          r,
          fill: 'none',
          stroke: occupied ? '#2563eb' : '#94a3b8',
          strokeWidth: k === nShell ? 2.5 : 1,
          strokeDasharray: occupied ? 'none' : '5 4',
        })
      )
      const lx = cx + r * 0.72
      const ly = cy - r * 0.72
      const count = filled[k - 1]
      const tag = count > 0 ? `${SHELL_NAME[k - 1]}:${count}` : SHELL_NAME[k - 1]
      elements.push(label(`name-${k}`, lx + 4, ly - 2, tag, occupied ? '#2563eb' : '#64748b'))
    }
    for (let k = 1; k <= nShell; k++) {
      const count = filled[k - 1]
      const r = rOf(k)
      const omega = 1.1 / k
      const er = count > 12 ? 2.6 : count > 4 ? 3.2 : 4
      for (let i = 0; i < count; i++) {
        const a0 = (2 * Math.PI * i) / count
        elements.push(
          circle(`e-${k}-${i}`, {
            cx: { $expr: `${n(cx)} + ${n(r)} * cos(${n(a0)} + ${n(omega)} * time)` },
            cy: { $expr: `${n(cy)} + ${n(r)} * sin(${n(a0)} + ${n(omega)} * time)` },
            r: er,
            fill: '#2563eb',
          })
        )
      }
    }
    const ladderX = 348
    for (let k = 1; k <= 4; k++) {
      const y = 248 - (k - 1) * 44
      const active = k === nShell
      const Ek = -13.6 / (k * k)
      elements.push(
        line(`lv-${k}`, {
          x1: ladderX,
          y1: y,
          x2: ladderX + 56,
          y2: y,
          stroke: active ? '#2563eb' : '#94a3b8',
          strokeWidth: active ? 3 : 1.5,
        })
      )
      elements.push(label(`ln-${k}`, ladderX - 28, y + 4, `n=${k}`, active ? '#2563eb' : '#64748b'))
      elements.push(label(`le-${k}`, ladderX + 62, y + 4, `${Ek.toFixed(1)}`, active ? '#2563eb' : '#64748b'))
    }
    elements.push(label('eaxis', ladderX, 64, 'E / eV'))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: {
        n: nShell,
        r: nShell * nShell,
        E: Number(E.toFixed(4)),
        electrons: capacity(nShell),
        total,
      },
      warnings: [],
    }
  },
}
