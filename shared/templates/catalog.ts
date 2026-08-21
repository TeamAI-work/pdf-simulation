// shared/templates/catalog.ts
// Registry assembled from sim files. Param clamp + provenance live here.

import type { SimDomain, ClassBand, ParamDef } from './contract.js'
import { SIM_REGISTRY, TEMPLATE_IDS, type TemplateId } from './sims/index.js'

export { TEMPLATE_IDS, type TemplateId, getSim, runSim } from './sims/index.js'
export type { ParamDef, ParamOption, SimDomain, ClassBand } from './contract.js'

export function isTemplateId(id: unknown): id is TemplateId {
  return typeof id === 'string' && id in SIM_REGISTRY
}

export interface TemplateDefinition {
  id: TemplateId
  label: string
  domain: SimDomain
  classBand: ClassBand
  ncertClass: number
  description: string
  equations: string[]
  params: ParamDef[]
  keywords: string[]
}

export const PARAM_SCHEMAS = Object.fromEntries(
  TEMPLATE_IDS.map((id) => [id, SIM_REGISTRY[id].schema])
) as { [K in TemplateId]: (typeof SIM_REGISTRY)[K]['schema'] }

export const TEMPLATE_CATALOG: Record<TemplateId, TemplateDefinition> = Object.fromEntries(
  TEMPLATE_IDS.map((id) => {
    const sim = SIM_REGISTRY[id]
    const def: TemplateDefinition = {
      id,
      label: sim.label,
      domain: sim.domain,
      classBand: sim.classBand,
      ncertClass: sim.ncertClass,
      description: sim.description,
      equations: sim.equations,
      params: sim.params,
      keywords: sim.keywords,
    }
    return [id, def]
  })
) as Record<TemplateId, TemplateDefinition>

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

/** Catalog lines injected into the curator prompt. */
export function allowedTemplatePrompt(): string {
  return TEMPLATE_IDS.map((id) => {
    const d = TEMPLATE_CATALOG[id]
    const ps = d.params
      .map((p) => {
        if (p.options?.length) {
          const opts = p.options.map((o) => `${o.value}=${o.label}`).join('|')
          return `${p.key} [${opts}]`
        }
        return `${p.key}${p.unit ? ` (${p.unit})` : ''}`
      })
      .join(', ')
    return `- \`${id}\` [${d.domain}, class ${d.classBand}] — ${d.label}. params: ${ps}`
  }).join('\n')
}

/** Random in-range params for previewing template animation quality. */
export function randomizeTemplateParams(templateId: TemplateId): Record<string, number> {
  const defs = TEMPLATE_CATALOG[templateId].params
  const params: Record<string, number> = {}
  for (const def of defs) {
    if (def.options?.length) {
      params[def.key] = def.options[Math.floor(Math.random() * def.options.length)].value
      continue
    }
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
