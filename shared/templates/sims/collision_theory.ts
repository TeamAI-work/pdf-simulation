import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line, n, pathEl, rect, tLoop } from '../stage.js'

function approachBounce(xL: number, xR: number, uHit: number, u: string) {
  const meet = (xL + xR) / 2
  const xA = `(${u} < ${n(uHit)}) ? (${n(xL)} + (${u}) / ${n(uHit)} * ${n(meet - xL)}) : (${n(meet)} - ((${u}) - ${n(uHit)}) / ${n(1 - uHit)} * ${n(meet - xL)})`
  const xB = `(${u} < ${n(uHit)}) ? (${n(xR)} - (${u}) / ${n(uHit)} * ${n(xR - meet)}) : (${n(meet)} + ((${u}) - ${n(uHit)}) / ${n(1 - uHit)} * ${n(xR - meet)})`
  return { xA, xB, meet }
}

function mbPlot(temperature: number, Ea: number) {
  const ox = 318
  const oy = 248
  const w = 152
  const h = 150
  const Emax = 90
  const kT = 10 + temperature / 16
  const samples: { E: number; f: number }[] = []
  let peak = 1e-9
  for (let i = 0; i <= 36; i++) {
    const E = (i / 36) * Emax
    const f = E * Math.exp(-E / kT)
    samples.push({ E, f })
    if (f > peak) peak = f
  }
  const curve: string[] = []
  const shade: string[] = [`M ${ox + (Math.min(Ea, Emax) / Emax) * w} ${oy}`]
  let shadeStarted = false
  for (let i = 0; i < samples.length; i++) {
    const px = ox + (samples[i].E / Emax) * w
    const py = oy - (samples[i].f / peak) * h
    curve.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`)
    if (samples[i].E + 1e-6 >= Ea) {
      if (!shadeStarted) {
        shade.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`)
        shadeStarted = true
      } else {
        shade.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`)
      }
    }
  }
  shade.push(`L ${ox + w} ${oy} Z`)
  const eaX = ox + (Math.min(Math.max(Ea, 0), Emax) / Emax) * w
  return { ox, oy, w, h, curve: curve.join(' '), shade: shade.join(' '), eaX }
}

export const collision_theory: SimFile = {
  id: 'collision_theory',
  domain: 'chemistry',
  classBand: '9-10',
  label: 'Collision theory',
  ncertClass: 10,
  description: 'Effective collision: particles must hit, with enough energy and the right orientation',
  equations: ['E_{\\mathrm{collision}} \\ge E_a', 'k \\propto e^{-E_a / RT}'],
  keywords: ['collision theory', 'activation energy', 'effective collision', 'reaction rate'],
  params: [
    param('temperature', 'Temperature', 'K', 250, 700, 10, 350),
    param('activationEnergy', 'Ea', 'kJ/mol', 10, 80, 1, 40),
  ],
  schema: z.object({
    temperature: num(100, 900, 350),
    activationEnergy: num(1, 150, 40),
  }),
  run(params) {
    const { temperature, activationEnergy } = params
    const RT = 0.008314 * temperature
    const fraction = Math.exp(-activationEnergy / Math.max(RT, 0.1))
    const Ecoll = 0.125 * temperature
    const enoughEnergy = Ecoll + 1e-6 >= activationEnergy
    const speed = Math.sqrt(temperature / 350)
    const period = 3.6 / Math.max(speed, 0.45)
    const t = tLoop(period + 0.7, period)
    const u = `(${t}) / ${n(period)}`
    const uHit = 0.44
    const miss = approachBounce(52, 270, uHit, u)
    const hit = approachBounce(52, 270, uHit, u)
    const mb = mbPlot(temperature, activationEnergy)
    const after = `(${u} < ${n(uHit)}) ? 0 : 1`
    const before = `(${u} < ${n(uHit)}) ? 1 : 0`
    const yMissA = 108
    const yMissB = 128
    const yHit = 198
    return {
      stage: {
        viewBox: VIEW,
        elements: [
          label('vals', 28, 22, `T = ${temperature} K    Ea = ${activationEnergy} kJ/mol`),
          label(
            'k',
            28,
            40,
            `E = ${Ecoll.toFixed(0)} kJ/mol    k ∝ e^{−Ea/RT}`
          ),
          rect('vessel', {
            x: 36,
            y: 52,
            width: 260,
            height: 220,
            fill: '#f8fafc',
            stroke: '#334155',
            strokeWidth: 2,
            rx: 6,
          }),
          label('miss-l', 44, 70, 'wrong orientation'),
          circle('mA', { cx: { $expr: miss.xA }, cy: yMissA, r: 9, fill: '#2563eb' }, 'projectile'),
          circle('mB', { cx: { $expr: miss.xB }, cy: yMissB, r: 9, fill: '#ea580c' }),
          label('hit-l', 44, 168, enoughEnergy ? 'E ≥ Ea' : 'E < Ea', enoughEnergy ? '#16a34a' : '#ea580c'),
          circle('hA', {
            cx: { $expr: hit.xA },
            cy: yHit,
            r: 9,
            fill: '#2563eb',
            opacity: enoughEnergy ? { $expr: before } : 1,
          }),
          circle('hB', {
            cx: { $expr: hit.xB },
            cy: yHit,
            r: 9,
            fill: '#ea580c',
            opacity: enoughEnergy ? { $expr: before } : 1,
          }),
          ...(enoughEnergy
            ? [
                circle('product', {
                  cx: hit.meet,
                  cy: yHit,
                  r: 11,
                  fill: '#16a34a',
                  opacity: { $expr: after },
                }),
              ]
            : []),
          line('mb-x', {
            x1: mb.ox,
            y1: mb.oy,
            x2: mb.ox + mb.w,
            y2: mb.oy,
            stroke: '#475569',
            strokeWidth: 1,
          }),
          line('mb-y', {
            x1: mb.ox,
            y1: mb.oy - mb.h,
            x2: mb.ox,
            y2: mb.oy,
            stroke: '#475569',
            strokeWidth: 1,
          }),
          pathEl('mb-shade', { d: mb.shade, fill: '#86efac', stroke: 'none', opacity: 0.85 }),
          pathEl('mb-curve', { d: mb.curve, fill: 'none', stroke: '#2563eb', strokeWidth: 2.5 }),
          line('ea', {
            x1: mb.eaX,
            y1: mb.oy - mb.h,
            x2: mb.eaX,
            y2: mb.oy,
            stroke: '#dc2626',
            strokeWidth: 2,
          }),
          label('mb-e', mb.ox + mb.w - 14, mb.oy + 16, 'E'),
          label('mb-n', mb.ox - 14, mb.oy - mb.h + 12, 'N'),
          label('mb-ea', mb.eaX - 10, mb.oy - mb.h - 6, 'Ea'),
        ],
      },
      metrics: {
        temperature,
        activationEnergy,
        fraction: Number(fraction.toFixed(8)),
        Ecoll: Number(Ecoll.toFixed(4)),
        effective: enoughEnergy,
      },
      warnings: [],
    }
  },
}
