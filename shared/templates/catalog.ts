// shared/templates/catalog.ts
// Canonical template ids, param schemas, slider metadata, and defaults.

import { z } from 'zod'

export const TEMPLATE_IDS = [
  'projectile_2d',
  'free_fall',
  'collision_1d',
  'pendulum',
  'ramp_friction',
  'buoyancy',
  'bounce_energy',
  'force_ma',
] as const

export type TemplateId = (typeof TEMPLATE_IDS)[number]

export function isTemplateId(id: unknown): id is TemplateId {
  return typeof id === 'string' && (TEMPLATE_IDS as readonly string[]).includes(id)
}

export interface ParamDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
}

export interface TemplateDefinition {
  id: TemplateId
  label: string
  ncertClass: number
  description: string
  equations: string[]
  params: ParamDef[]
  keywords: string[]
}

const num = (min: number, max: number, fallback: number) =>
  z.coerce.number().min(min).max(max).default(fallback).catch(fallback)

export const projectileParamsSchema = z.object({
  v0: num(0.1, 200, 20),
  angleDeg: num(0, 90, 45),
  h0: num(0, 200, 0),
  g: num(0.1, 30, 9.81),
})

export const freeFallParamsSchema = z.object({
  h0: num(0.1, 500, 20),
  g: num(0.1, 30, 9.81),
})

export const collisionParamsSchema = z.object({
  m1: num(0.01, 1e5, 2),
  m2: num(0.01, 1e5, 2),
  u1: num(-100, 100, 8),
  u2: num(-100, 100, -4),
  e: num(0, 1, 1),
})

export const pendulumParamsSchema = z.object({
  length: num(0.1, 20, 1),
  g: num(0.1, 30, 9.81),
  theta0: num(1, 60, 20),
})

export const rampParamsSchema = z.object({
  angleDeg: num(1, 80, 30),
  mu: num(0, 1.5, 0.2),
  mass: num(0.01, 1e4, 5),
})

export const buoyancyParamsSchema = z.object({
  densityObject: num(10, 20000, 700),
  densityFluid: num(10, 20000, 1000),
  volume: num(1e-6, 10, 0.001),
})

export const bounceParamsSchema = z.object({
  h0: num(0.1, 100, 8),
  e: num(0, 1, 0.7),
  g: num(0.1, 30, 9.81),
})

export const forceMaParamsSchema = z.object({
  mass: num(0.01, 1e4, 2),
  force: num(-1e5, 1e5, 10),
})

export const PARAM_SCHEMAS = {
  projectile_2d: projectileParamsSchema,
  free_fall: freeFallParamsSchema,
  collision_1d: collisionParamsSchema,
  pendulum: pendulumParamsSchema,
  ramp_friction: rampParamsSchema,
  buoyancy: buoyancyParamsSchema,
  bounce_energy: bounceParamsSchema,
  force_ma: forceMaParamsSchema,
} as const

export const TEMPLATE_CATALOG: Record<TemplateId, TemplateDefinition> = {
  projectile_2d: {
    id: 'projectile_2d',
    label: 'Projectile motion',
    ncertClass: 9,
    description: 'Ballistic trajectory under constant gravity',
    equations: ['x = v_0 \\cos\\theta\\, t', 'y = h_0 + v_0 \\sin\\theta\\, t - \\tfrac12 g t^2', 'R = v_0^2 \\sin 2\\theta / g'],
    keywords: ['projectile', 'trajectory', 'thrown', 'launch', 'cannon', 'ballistic', 'parabola'],
    params: [
      { key: 'v0', label: 'Launch speed', unit: 'm/s', min: 1, max: 80, step: 0.5, defaultValue: 20 },
      { key: 'angleDeg', label: 'Angle', unit: 'deg', min: 5, max: 85, step: 1, defaultValue: 45 },
      { key: 'h0', label: 'Height', unit: 'm', min: 0, max: 50, step: 0.5, defaultValue: 0 },
      { key: 'g', label: 'Gravity', unit: 'm/s²', min: 1.6, max: 20, step: 0.01, defaultValue: 9.81 },
    ],
  },
  free_fall: {
    id: 'free_fall',
    label: 'Free fall',
    ncertClass: 9,
    description: 'Object dropped from rest under gravity',
    equations: ['h = h_0 - \\tfrac12 g t^2', 't = \\sqrt{2 h_0 / g}'],
    keywords: ['free fall', 'dropped', 'falling', 'from rest', 'drop'],
    params: [
      { key: 'h0', label: 'Height', unit: 'm', min: 1, max: 80, step: 0.5, defaultValue: 20 },
      { key: 'g', label: 'Gravity', unit: 'm/s²', min: 1.6, max: 20, step: 0.01, defaultValue: 9.81 },
    ],
  },
  collision_1d: {
    id: 'collision_1d',
    label: '1D collision',
    ncertClass: 9,
    description: 'Two masses collide along a line with restitution e',
    equations: ['m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2', 'e = (v_2 - v_1)/(u_1 - u_2)'],
    keywords: ['collision', 'collide', 'momentum', 'elastic', 'inelastic', 'cart'],
    params: [
      { key: 'm1', label: 'Mass 1', unit: 'kg', min: 0.1, max: 50, step: 0.1, defaultValue: 2 },
      { key: 'm2', label: 'Mass 2', unit: 'kg', min: 0.1, max: 50, step: 0.1, defaultValue: 2 },
      { key: 'u1', label: 'u₁', unit: 'm/s', min: -30, max: 30, step: 0.5, defaultValue: 8 },
      { key: 'u2', label: 'u₂', unit: 'm/s', min: -30, max: 30, step: 0.5, defaultValue: -4 },
      { key: 'e', label: 'Restitution e', unit: '', min: 0, max: 1, step: 0.05, defaultValue: 1 },
    ],
  },
  pendulum: {
    id: 'pendulum',
    label: 'Simple pendulum',
    ncertClass: 7,
    description: 'Small-angle SHM pendulum',
    equations: ['T = 2\\pi \\sqrt{L/g}', '\\theta(t) = \\theta_0 \\cos(\\omega t)'],
    keywords: ['pendulum', 'oscillat', 'swing', 'bob'],
    params: [
      { key: 'length', label: 'Length', unit: 'm', min: 0.2, max: 5, step: 0.05, defaultValue: 1 },
      { key: 'g', label: 'Gravity', unit: 'm/s²', min: 1.6, max: 20, step: 0.01, defaultValue: 9.81 },
      { key: 'theta0', label: 'Amplitude', unit: 'deg', min: 2, max: 40, step: 1, defaultValue: 20 },
    ],
  },
  ramp_friction: {
    id: 'ramp_friction',
    label: 'Ramp and friction',
    ncertClass: 8,
    description: 'Block on an inclined plane with kinetic friction',
    equations: ['a = g(\\sin\\theta - \\mu \\cos\\theta)', '\\text{slides if } \\tan\\theta > \\mu'],
    keywords: ['ramp', 'incline', 'friction', 'slide', 'μ', 'mu'],
    params: [
      { key: 'angleDeg', label: 'Angle', unit: 'deg', min: 5, max: 70, step: 1, defaultValue: 30 },
      { key: 'mu', label: 'μ', unit: '', min: 0, max: 1.2, step: 0.02, defaultValue: 0.2 },
      { key: 'mass', label: 'Mass', unit: 'kg', min: 0.1, max: 50, step: 0.1, defaultValue: 5 },
    ],
  },
  buoyancy: {
    id: 'buoyancy',
    label: 'Float or sink',
    ncertClass: 9,
    description: 'Archimedes: compare object and fluid density',
    equations: ['F_b = \\rho_f V g', '\\text{floats if } \\rho_o < \\rho_f'],
    keywords: ['buoyan', 'float', 'sink', 'archimedes', 'density', 'displac'],
    params: [
      { key: 'densityObject', label: 'Object density', unit: 'kg/m³', min: 50, max: 15000, step: 10, defaultValue: 700 },
      { key: 'densityFluid', label: 'Fluid density', unit: 'kg/m³', min: 50, max: 15000, step: 10, defaultValue: 1000 },
      { key: 'volume', label: 'Volume', unit: 'm³', min: 0.0001, max: 1, step: 0.0001, defaultValue: 0.001 },
    ],
  },
  bounce_energy: {
    id: 'bounce_energy',
    label: 'Bouncing ball',
    ncertClass: 9,
    description: 'Drop with restitution; kinetic energy lost each bounce',
    equations: ['v = e \\sqrt{2gh}', 'h_{n+1} = e^2 h_n'],
    keywords: ['bounce', 'restitution', 'energy loss', 'bouncing'],
    params: [
      { key: 'h0', label: 'Drop height', unit: 'm', min: 0.5, max: 20, step: 0.1, defaultValue: 8 },
      { key: 'e', label: 'Restitution e', unit: '', min: 0, max: 1, step: 0.05, defaultValue: 0.7 },
      { key: 'g', label: 'Gravity', unit: 'm/s²', min: 1.6, max: 20, step: 0.01, defaultValue: 9.81 },
    ],
  },
  force_ma: {
    id: 'force_ma',
    label: 'F = ma',
    ncertClass: 9,
    description: 'Constant force accelerates a block from rest',
    equations: ['F = ma', 's = \\tfrac12 a t^2'],
    keywords: ['f = ma', 'f=ma', 'net force', 'accelerat'],
    params: [
      { key: 'mass', label: 'Mass', unit: 'kg', min: 0.1, max: 50, step: 0.1, defaultValue: 2 },
      { key: 'force', label: 'Force', unit: 'N', min: 0.5, max: 200, step: 0.5, defaultValue: 10 },
    ],
  },
}

export type TemplateParams = {
  projectile_2d: z.infer<typeof projectileParamsSchema>
  free_fall: z.infer<typeof freeFallParamsSchema>
  collision_1d: z.infer<typeof collisionParamsSchema>
  pendulum: z.infer<typeof pendulumParamsSchema>
  ramp_friction: z.infer<typeof rampParamsSchema>
  buoyancy: z.infer<typeof buoyancyParamsSchema>
  bounce_energy: z.infer<typeof bounceParamsSchema>
  force_ma: z.infer<typeof forceMaParamsSchema>
}

export type ParamMetaMap = Record<string, { unit?: string; source?: 'extracted' | 'default' }>

export function parseTemplateParams(
  templateId: TemplateId,
  raw: Record<string, number | string | undefined> | undefined
): { params: Record<string, number>; paramMeta: ParamMetaMap } {
  const schema = PARAM_SCHEMAS[templateId]
  const defs = TEMPLATE_CATALOG[templateId].params
  const input: Record<string, unknown> = {}
  const paramMeta: ParamMetaMap = {}

  for (const def of defs) {
    const rawVal = raw?.[def.key]
    const hasRaw = rawVal !== undefined && rawVal !== '' && rawVal !== null
    if (hasRaw) input[def.key] = rawVal
    paramMeta[def.key] = {
      unit: def.unit,
      source: hasRaw ? 'extracted' : 'default',
    }
  }

  const parsed = schema.parse(input)
  return { params: parsed as Record<string, number>, paramMeta }
}

export function allowedTemplateIdList(): string {
  return TEMPLATE_IDS.join(', ')
}

/** Random in-range params for previewing template animation quality. */
export function randomizeTemplateParams(templateId: TemplateId): Record<string, number> {
  const defs = TEMPLATE_CATALOG[templateId].params
  const params: Record<string, number> = {}
  for (const def of defs) {
    const span = def.max - def.min
    const steps = Math.max(1, Math.round(span / def.step))
    const k = Math.floor(Math.random() * (steps + 1))
    const snapped = def.min + k * def.step
    const clamped = Math.min(def.max, Math.max(def.min, snapped))
    const decimals = def.step < 1 ? 4 : 2
    params[def.key] = Number(clamped.toFixed(decimals))
  }
  if (templateId === 'collision_1d') {
    params.u1 = Math.abs(params.u1)
    params.u2 = -Math.abs(params.u2 === 0 ? 2 : params.u2)
  }
  return parseTemplateParams(templateId, params).params
}
