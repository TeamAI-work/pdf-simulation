// shared/templates/bind.ts
// Bind catalog params → physically correct SimStage + metrics.

import type { SimElement, SimSpec, SimStage } from '../simSpec.js'
import {
  isTemplateId,
  parseTemplateParams,
  TEMPLATE_CATALOG,
  type TemplateId,
} from './catalog.js'
import {
  analyticFlatRange,
  bounceTimes,
  buoyancyResult,
  pendulumPeriod,
  rampAcceleration,
  solveCollision1d,
  solveProjectile,
} from './physics.js'

const VIEW = '0 0 500 300'
const GROUND_Y = 260
const ORIGIN_X = 40

function n(x: number): string {
  if (!Number.isFinite(x)) return '0'
  const r = Math.round(x * 1e6) / 1e6
  return String(r)
}

function tLoop(period: number, cap: number): string {
  const p = Math.max(period, 0.2)
  return `min(mod(time, ${n(p)}), ${n(cap)})`
}

export interface BindResult {
  spec: SimSpec
  metrics: Record<string, number | string | boolean>
  warnings: string[]
}

function baseSpec(
  templateId: TemplateId,
  params: Record<string, number>,
  stage: SimStage,
  extra: Partial<SimSpec> = {}
): SimSpec {
  const def = TEMPLATE_CATALOG[templateId]
  return {
    version: '2.0',
    parentTopic: extra.parentTopic || def.label,
    title: extra.title || def.label,
    subtitle: extra.subtitle || def.description,
    domain: extra.domain || 'physics',
    topicExplanation: extra.topicExplanation || def.description,
    caption: extra.caption || '',
    isSimulatable: true,
    reasonIfNotSimulatable: '',
    quote: extra.quote || '',
    equations: extra.equations?.length ? extra.equations : def.equations,
    templateId,
    params,
    paramMeta: extra.paramMeta,
    stage,
  }
}

function ground(): SimElement {
  return {
    id: 'ground',
    type: 'line',
    role: 'none',
    props: { x1: 20, y1: GROUND_Y, x2: 480, y2: GROUND_Y, stroke: '#475569', strokeWidth: 3 },
  }
}

function label(id: string, x: number, y: number, text: string, fill = '#94a3b8'): SimElement {
  return {
    id,
    type: 'text',
    role: 'none',
    props: { x, y, fill, fontSize: 12 },
    text,
  }
}

function bindProjectile(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const v0 = params.v0
  const angleDeg = params.angleDeg
  const h0 = params.h0
  const g = params.g
  const sol = solveProjectile(v0, angleDeg, h0, g)
  if (h0 < 1e-6) {
    const flat = analyticFlatRange(v0, angleDeg, g)
    if (Math.abs(flat - sol.range) > 0.05) {
      warnings.push(`Range gate failed: solver ${sol.range.toFixed(3)} m vs analytic ${flat.toFixed(3)} m`)
    }
  }

  const availW = 420
  const availH = 200
  const scale = Math.min(availW / Math.max(sol.range, 1), availH / Math.max(sol.maxHeight, 0.5)) * 0.88
  const period = sol.flightTime + 0.6
  const t = tLoop(period, sol.flightTime)
  const yPhys = `${n(h0)} + ${n(sol.vy)} * (${t}) - 0.5 * ${n(g)} * (${t})^2`

  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'trajectory-hint',
        type: 'path',
        role: 'trajectory',
        props: {
          d: buildParabolaPath(sol, scale, h0, g),
          stroke: '#64748b',
          strokeDasharray: '5 4',
          fill: 'none',
          strokeWidth: 1.5,
        },
      },
      {
        id: 'ball',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: { $expr: `${n(ORIGIN_X)} + ${n(scale * sol.vx)} * (${t})` },
          cy: { $expr: `${n(GROUND_Y)} - ${n(scale)} * (${yPhys})` },
          r: 9,
          fill: '#38bdf8',
          stroke: '#0ea5e9',
          strokeWidth: 2,
        },
      },
      label('metrics-range', 28, 28, `R = ${sol.range.toFixed(2)} m`),
      label('metrics-time', 28, 46, `T = ${sol.flightTime.toFixed(2)} s`),
      label('scale-bar', 28, GROUND_Y + 22, `scale ${scale.toFixed(1)} px/m`, '#64748b'),
    ],
  }

  return {
    spec: baseSpec('projectile_2d', params, stage, {
      ...extra,
      caption: `Range ${sol.range.toFixed(2)} m, flight ${sol.flightTime.toFixed(2)} s, max height ${sol.maxHeight.toFixed(2)} m`,
    }),
    metrics: {
      range: Number(sol.range.toFixed(4)),
      flightTime: Number(sol.flightTime.toFixed(4)),
      maxHeight: Number(sol.maxHeight.toFixed(4)),
      scalePxPerM: Number(scale.toFixed(4)),
    },
    warnings,
  }
}

function buildParabolaPath(
  sol: { flightTime: number; vx: number; vy: number },
  scale: number,
  h0: number,
  g: number
): string {
  const steps = 24
  const pts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = (sol.flightTime * i) / steps
    const x = ORIGIN_X + scale * sol.vx * t
    const yPhys = Math.max(0, h0 + sol.vy * t - 0.5 * g * t * t)
    const y = GROUND_Y - scale * yPhys
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return pts.join(' ')
}

function bindFreeFall(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const h0 = params.h0
  const g = params.g
  const T = Math.sqrt((2 * h0) / g)
  const scale = Math.min(220 / Math.max(h0, 1), 8) * 0.9
  const t = tLoop(T + 0.8, T)
  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'tower',
        type: 'rect',
        role: 'none',
        props: {
          x: 70,
          y: GROUND_Y - scale * h0,
          width: 14,
          height: scale * h0,
          fill: '#334155',
        },
      },
      {
        id: 'ball',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: 140,
          cy: { $expr: `${n(GROUND_Y - scale * h0)} + ${n(scale)} * 0.5 * ${n(g)} * (${t})^2` },
          r: 10,
          fill: '#f97316',
        },
      },
      label('t-label', 28, 28, `t_fall = ${T.toFixed(2)} s`),
      label('h-label', 28, 46, `h = ${h0.toFixed(1)} m`),
    ],
  }
  return {
    spec: baseSpec('free_fall', params, stage, {
      ...extra,
      caption: `Time to ground ${T.toFixed(2)} s from ${h0} m`,
    }),
    metrics: { flightTime: Number(T.toFixed(4)), impactSpeed: Number((g * T).toFixed(4)) },
    warnings,
  }
}

function bindCollision(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const { m1, m2, u1, u2, e } = params
  const gap = 8
  const sol = solveCollision1d(m1, m2, u1, u2, e, gap)
  const keExpected =
    0.5 * m1 * sol.v1 * sol.v1 + 0.5 * m2 * sol.v2 * sol.v2
  if (Math.abs(keExpected - sol.keAfter) > 1e-6) {
    warnings.push('Collision energy gate failed')
  }
  const tCol = Math.min(sol.timeToCollision, 8)
  const after = 2.2
  const period = tCol + after
  const t = `mod(time, ${n(period)})`
  const x1_0 = 0
  const x2_0 = gap
  const scale = 380 / Math.max(gap + 4, 8)
  const xPx = (expr: string) => `${n(60)} + ${n(scale)} * (${expr})`

  const x1 = `(${t} < ${n(tCol)}) ? (${n(x1_0)} + ${n(u1)} * (${t})) : (${n(x1_0 + u1 * tCol)} + ${n(sol.v1)} * ((${t}) - ${n(tCol)}))`
  const x2 = `(${t} < ${n(tCol)}) ? (${n(x2_0)} + ${n(u2)} * (${t})) : (${n(x2_0 + u2 * tCol)} + ${n(sol.v2)} * ((${t}) - ${n(tCol)}))`

  const r1 = 8 + Math.min(12, Math.sqrt(m1) * 3)
  const r2 = 8 + Math.min(12, Math.sqrt(m2) * 3)

  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'mass1',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: { $expr: xPx(x1) },
          cy: GROUND_Y - r1,
          r: r1,
          fill: '#38bdf8',
        },
      },
      {
        id: 'mass2',
        type: 'circle',
        role: 'none',
        props: {
          cx: { $expr: xPx(x2) },
          cy: GROUND_Y - r2,
          r: r2,
          fill: '#f472b6',
        },
      },
      label('ke', 28, 28, `ΔKE = ${sol.energyLoss.toFixed(2)} J`),
      label('v', 28, 46, `v₁=${sol.v1.toFixed(2)}  v₂=${sol.v2.toFixed(2)} m/s`),
    ],
  }
  return {
    spec: baseSpec('collision_1d', params, stage, extra),
    metrics: {
      v1: Number(sol.v1.toFixed(4)),
      v2: Number(sol.v2.toFixed(4)),
      keBefore: Number(sol.keBefore.toFixed(4)),
      keAfter: Number(sol.keAfter.toFixed(4)),
      energyLoss: Number(sol.energyLoss.toFixed(4)),
      timeToCollision: Number(tCol.toFixed(4)),
    },
    warnings,
  }
}

function bindPendulum(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const L = params.length
  const g = params.g
  const theta0 = (params.theta0 * Math.PI) / 180
  const T = pendulumPeriod(L, g)
  const pivotX = 250
  const pivotY = 36
  const pxPerM = Math.min(180 / Math.max(L, 0.3), 160)
  const omega = (2 * Math.PI) / T
  const th = `${n(theta0)} * cos(${n(omega)} * time)`
  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      {
        id: 'pivot',
        type: 'circle',
        role: 'none',
        props: { cx: pivotX, cy: pivotY, r: 6, fill: '#e2e8f0' },
      },
      {
        id: 'rod',
        type: 'line',
        role: 'none',
        props: {
          x1: pivotX,
          y1: pivotY,
          x2: { $expr: `${n(pivotX)} + ${n(pxPerM * L)} * sin(${th})` },
          y2: { $expr: `${n(pivotY)} + ${n(pxPerM * L)} * cos(${th})` },
          stroke: '#94a3b8',
          strokeWidth: 3,
        },
      },
      {
        id: 'bob',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: { $expr: `${n(pivotX)} + ${n(pxPerM * L)} * sin(${th})` },
          cy: { $expr: `${n(pivotY)} + ${n(pxPerM * L)} * cos(${th})` },
          r: 14,
          fill: '#f59e0b',
        },
      },
      label('period', 28, 28, `T = ${T.toFixed(2)} s`),
    ],
  }
  return {
    spec: baseSpec('pendulum', params, stage, extra),
    metrics: { period: Number(T.toFixed(4)), omega: Number(omega.toFixed(4)) },
    warnings,
  }
}

function bindRamp(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const { angleDeg, mu, mass } = params
  const { a, willSlide } = rampAcceleration(angleDeg, mu)
  const theta = (angleDeg * Math.PI) / 180
  const run = 360
  const rise = run * Math.tan(theta)
  const x2 = 40 + run
  const y2 = GROUND_Y - Math.min(rise, 200)
  const lengthPx = Math.hypot(run, GROUND_Y - y2)
  const lengthM = 6
  const pxPerM = lengthPx / lengthM
  const tMax = willSlide ? Math.sqrt((2 * lengthM) / Math.max(a, 0.05)) : 4
  const t = tLoop(tMax + 0.8, tMax)
  const s = willSlide ? `0.5 * ${n(a)} * (${t})^2` : '0'
  const ux = Math.cos(theta)
  const uy = Math.sin(theta)

  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'ramp',
        type: 'line',
        role: 'none',
        props: { x1: 40, y1: GROUND_Y, x2, y2, stroke: '#64748b', strokeWidth: 6 },
      },
      {
        id: 'block',
        type: 'rect',
        role: 'projectile',
        props: {
          x: { $expr: `${n(40)} + ${n(pxPerM * ux)} * (${s}) - 12` },
          y: { $expr: `${n(GROUND_Y)} - ${n(pxPerM * uy)} * (${s}) - 22` },
          width: 24,
          height: 18,
          fill: willSlide ? '#22c55e' : '#ef4444',
          rx: 3,
        },
      },
      label('a-label', 28, 28, willSlide ? `a = ${a.toFixed(2)} m/s²` : 'Does not slide (tan θ ≤ μ)'),
      label('f-label', 28, 46, `m=${mass} kg  μ=${mu}`),
    ],
  }
  return {
    spec: baseSpec('ramp_friction', params, stage, extra),
    metrics: { acceleration: Number(a.toFixed(4)), willSlide },
    warnings,
  }
}

function bindBuoyancy(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const { densityObject, densityFluid, volume } = params
  const r = buoyancyResult(densityObject, densityFluid, volume)
  const waterY = 170
  const t = tLoop(3.2, 3)
  const sinkExpr = r.willFloat
    ? `${n(waterY - 18)} + 6 * sin(time * 2)`
    : `${n(waterY - 20)} + min(${n(GROUND_Y - 28 - (waterY - 20))}, 40 * (${t})^2)`

  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'water',
        type: 'rect',
        role: 'none',
        props: { x: 40, y: waterY, width: 420, height: GROUND_Y - waterY, fill: '#0ea5e933', stroke: '#38bdf8', strokeWidth: 1 },
      },
      {
        id: 'object',
        type: 'rect',
        role: 'projectile',
        props: {
          x: 230,
          y: { $expr: sinkExpr },
          width: 40,
          height: 28,
          fill: r.willFloat ? '#22c55e' : '#a16207',
          rx: 4,
        },
      },
      label('result', 28, 28, r.willFloat ? 'FLOATS  ρ_object < ρ_fluid' : 'SINKS  ρ_object > ρ_fluid'),
      label('forces', 28, 46, `W=${r.weight.toFixed(2)} N   Fb=${r.buoyantForce.toFixed(2)} N`),
    ],
  }
  return {
    spec: baseSpec('buoyancy', params, stage, extra),
    metrics: {
      weight: Number(r.weight.toFixed(4)),
      buoyantForce: Number(r.buoyantForce.toFixed(4)),
      willFloat: r.willFloat,
    },
    warnings,
  }
}

function bindBounce(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const { h0, e, g } = params
  const b = bounceTimes(h0, e, g)
  const scale = Math.min(200 / Math.max(h0, 1), 20)
  const tA = b.tDown
  const tB = b.tBounce1
  const t = `mod(time, ${n(b.total + 0.4)})`
  const t1 = `(${t})`
  const t2 = `((${t}) - ${n(tA)})`
  const t3 = `((${t}) - ${n(tA + tB)})`
  const y = `(${t} < ${n(tA)}) ? (${n(h0)} - 0.5 * ${n(g)} * (${t1})^2) : ((${t} < ${n(tA + tB)}) ? (${n(b.v1)} * (${t2}) - 0.5 * ${n(g)} * (${t2})^2) : max(0, ${n(b.v2)} * (${t3}) - 0.5 * ${n(g)} * (${t3})^2))`

  const keAfterFirst = 0.5 * (b.v1 * b.v1)

  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'ball',
        type: 'circle',
        role: 'projectile',
        props: {
          cx: 250,
          cy: { $expr: `${n(GROUND_Y)} - ${n(scale)} * (${y})` },
          r: 11,
          fill: '#e11d48',
        },
      },
      label('e-label', 28, 28, `e = ${e}   h₁ = ${b.h1.toFixed(2)} m`),
      label('ke-label', 28, 46, `KE after bounce ≈ ${keAfterFirst.toFixed(2)} J (m=1 kg)`),
    ],
  }
  return {
    spec: baseSpec('bounce_energy', params, stage, extra),
    metrics: {
      h1: Number(b.h1.toFixed(4)),
      h2: Number(b.h2.toFixed(4)),
      energyFractionRetained: Number((e * e).toFixed(4)),
    },
    warnings,
  }
}

function bindForceMa(params: Record<string, number>, extra: Partial<SimSpec>, warnings: string[]): BindResult {
  const { mass, force } = params
  const a = force / mass
  const tMax = 3
  const t = tLoop(tMax + 0.6, tMax)
  const s = `0.5 * ${n(a)} * (${t})^2`
  const sMax = 0.5 * a * tMax * tMax
  const scale = 380 / Math.max(sMax, 1)
  const stage: SimStage = {
    viewBox: VIEW,
    elements: [
      ground(),
      {
        id: 'block',
        type: 'rect',
        role: 'projectile',
        props: {
          x: { $expr: `${n(40)} + ${n(scale)} * (${s})` },
          y: GROUND_Y - 36,
          width: 40,
          height: 28,
          fill: '#6366f1',
          rx: 4,
        },
      },
      {
        id: 'force-arrow',
        type: 'arrow',
        role: 'none',
        props: {
          x1: { $expr: `${n(80)} + ${n(scale)} * (${s})` },
          y1: GROUND_Y - 22,
          x2: { $expr: `${n(120)} + ${n(scale)} * (${s})` },
          y2: GROUND_Y - 22,
          stroke: '#22c55e',
          strokeWidth: 3,
        },
      },
      label('a-label', 28, 28, `a = F/m = ${a.toFixed(2)} m/s²`),
      label('f-label', 28, 46, `F=${force} N   m=${mass} kg`),
    ],
  }
  return {
    spec: baseSpec('force_ma', params, stage, extra),
    metrics: { acceleration: Number(a.toFixed(4)) },
    warnings,
  }
}

const BINDERS: Record<TemplateId, (p: Record<string, number>, extra: Partial<SimSpec>, w: string[]) => BindResult> = {
  projectile_2d: bindProjectile,
  free_fall: bindFreeFall,
  collision_1d: bindCollision,
  pendulum: bindPendulum,
  ramp_friction: bindRamp,
  buoyancy: bindBuoyancy,
  bounce_energy: bindBounce,
  force_ma: bindForceMa,
}

export function bindTemplate(
  templateId: string,
  rawParams?: Record<string, number | string>,
  extra: Partial<SimSpec> = {}
): BindResult {
  const warnings: string[] = []
  if (!isTemplateId(templateId)) {
    warnings.push(`Unknown templateId "${templateId}"`)
    return {
      spec: {
        version: '2.0',
        title: extra.title || 'Unknown template',
        domain: extra.domain || 'physics',
        isSimulatable: false,
        reasonIfNotSimulatable: `Unknown templateId "${templateId}"`,
        quote: extra.quote || '',
        equations: extra.equations || [],
        parentTopic: extra.parentTopic || '',
        subtitle: extra.subtitle || '',
        topicExplanation: extra.topicExplanation || '',
        caption: extra.caption || '',
      },
      metrics: {},
      warnings,
    }
  }

  const { params, paramMeta } = parseTemplateParams(templateId, rawParams)
  const mergedExtra: Partial<SimSpec> = { ...extra, paramMeta: extra.paramMeta || paramMeta }
  return BINDERS[templateId](params, mergedExtra, warnings)
}

/** Metadata-only spec stored at ingest (no stage). */
export function createTemplateSpec(
  templateId: TemplateId,
  rawParams?: Record<string, number | string>,
  extra: Partial<SimSpec> = {}
): SimSpec {
  const { params, paramMeta } = parseTemplateParams(templateId, rawParams)
  const def = TEMPLATE_CATALOG[templateId]
  return {
    version: '2.0',
    parentTopic: extra.parentTopic || def.label,
    title: extra.title || def.label,
    subtitle: extra.subtitle || def.description,
    domain: extra.domain || 'physics',
    topicExplanation: extra.topicExplanation || def.description,
    caption: extra.caption || '',
    isSimulatable: true,
    reasonIfNotSimulatable: '',
    quote: extra.quote || '',
    equations: extra.equations?.length ? extra.equations : def.equations,
    templateId,
    params,
    paramMeta,
  }
}
