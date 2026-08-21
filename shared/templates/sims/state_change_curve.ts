import { z } from 'zod'
import { num, param, type SimFile } from '../contract.js'
import { VIEW, circle, label, line } from '../stage.js'

export const state_change_curve: SimFile = {
  id: 'state_change_curve',
  domain: 'chemistry',
  classBand: '9-10',
  ncertClass: 9,
  label: 'Heating curve',
  description: 'Phase from temperature vs melting and boiling points on a heating curve',
  equations: ['T < T_m:\\; \\text{solid}', 'T_m < T < T_b:\\; \\text{liquid}', 'T > T_b:\\; \\text{gas}'],
  keywords: ['heating curve', 'melting point', 'latent heat', 'boiling point', 'phase change graph'],
  params: [
    param('T', 'Temperature', '°C', -40, 200, 1, 25),
    param('melting', 'Melting point', '°C', -20, 80, 1, 0),
    param('boiling', 'Boiling point', '°C', 40, 200, 1, 100),
  ],
  schema: z.object({
    T: num(-80, 400, 25),
    melting: num(-80, 200, 0),
    boiling: num(-20, 500, 100),
  }),
  run(params) {
    let Tm = params.melting
    let Tb = params.boiling
    const warnings: string[] = []
    if (Tm >= Tb) {
      warnings.push('Melting point must be below boiling point')
      Tb = Tm + 1
    }
    const T = params.T
    const phase =
      T < Tm ? 'solid' : Math.abs(T - Tm) < 0.5 ? 'melting' : T < Tb ? 'liquid' : Math.abs(T - Tb) < 0.5 ? 'boiling' : 'gas'
    const Tmax = Math.max(Tb + 40, T + 10, 40)
    const Tmin = Math.min(Tm - 20, T - 10, 0)
    const yOf = (temp: number) => 240 - ((temp - Tmin) / Math.max(Tmax - Tmin, 1)) * 180
    const pts = [
      { x: 60, y: yOf(Tmin) },
      { x: 140, y: yOf(Tm) },
      { x: 200, y: yOf(Tm) },
      { x: 300, y: yOf(Tb) },
      { x: 360, y: yOf(Tb) },
      { x: 450, y: yOf(Math.min(Tmax, Tb + 40)) },
    ]
    let mx = pts[0].x
    let my = yOf(T)
    if (T < Tm) {
      const u = (T - Tmin) / Math.max(Tm - Tmin, 1e-6)
      mx = pts[0].x + u * (pts[1].x - pts[0].x)
    } else if (Math.abs(T - Tm) < 0.5) {
      mx = (pts[1].x + pts[2].x) / 2
      my = yOf(Tm)
    } else if (T < Tb) {
      const u = (T - Tm) / Math.max(Tb - Tm, 1e-6)
      mx = pts[2].x + u * (pts[3].x - pts[2].x)
    } else if (Math.abs(T - Tb) < 0.5) {
      mx = (pts[3].x + pts[4].x) / 2
      my = yOf(Tb)
    } else {
      const u = Math.min(1, (T - Tb) / 40)
      mx = pts[4].x + u * (pts[5].x - pts[4].x)
    }
    const elements = [
      line('axis-x', { x1: 50, y1: 250, x2: 460, y2: 250, stroke: '#64748b', strokeWidth: 1 }),
      line('axis-y', { x1: 50, y1: 50, x2: 50, y2: 250, stroke: '#64748b', strokeWidth: 1 }),
      label('eq', 28, 28, `${phase}   T = ${T} °C`),
      label('pts', 28, 46, `Tm = ${Tm} °C    Tb = ${Tb} °C`),
    ]
    for (let i = 0; i < pts.length - 1; i++) {
      elements.push(
        line(`seg-${i}`, {
          x1: pts[i].x,
          y1: pts[i].y,
          x2: pts[i + 1].x,
          y2: pts[i + 1].y,
          stroke: '#38bdf8',
          strokeWidth: 3,
        })
      )
    }
    elements.push(circle('now', { cx: mx, cy: my, r: 7, fill: '#fbbf24' }))
    return {
      stage: { viewBox: VIEW, elements },
      metrics: { T, melting: Tm, boiling: Tb, phase },
      warnings,
    }
  },
}
