// shared/templates/match.ts
// Map natural-language / textbook text onto a catalog template + extracted numbers.

import {
  isTemplateId,
  parseTemplateParams,
  TEMPLATE_CATALOG,
  TEMPLATE_IDS,
  type TemplateId,
} from './catalog.js'

export interface TemplateMatch {
  templateId: TemplateId
  params: Record<string, number>
  title: string
}

function pickNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const re of patterns) {
    const m = text.match(re)
    if (m?.[1]) {
      const n = Number(m[1])
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

function extractCommon(text: string): Record<string, number> {
  const raw: Record<string, number> = {}
  const v0 = pickNumber(text, [
    /(\d+(?:\.\d+)?)\s*m\/s/i,
    /(\d+(?:\.\d+)?)\s*metres?\s*per\s*second/i,
    /speed(?:\s+of)?\s+(\d+(?:\.\d+)?)/i,
    /velocity[^\d]{0,12}(\d+(?:\.\d+)?)/i,
  ])
  const angle = pickNumber(text, [
    /(\d+(?:\.\d+)?)\s*(?:°|deg(?:rees)?)/i,
    /angle[^\d]{0,12}(\d+(?:\.\d+)?)/i,
  ])
  const h0 = pickNumber(text, [
    /(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:high|height|above)/i,
    /height[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    /from\s+(\d+(?:\.\d+)?)\s*m/i,
  ])
  const g = pickNumber(text, [/g\s*=\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m\/s\^?2/i])
  const mass = pickNumber(text, [/(\d+(?:\.\d+)?)\s*kg/i, /mass[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  const mu = pickNumber(text, [/μ\s*=\s*(\d+(?:\.\d+)?)/i, /mu\s*=\s*(\d+(?:\.\d+)?)/i, /friction[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  const e = pickNumber(text, [/e\s*=\s*(\d+(?:\.\d+)?)/i, /restitution[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  const length = pickNumber(text, [/length[^\d]{0,12}(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m(?:eter)?\s*(?:long|string|pendulum)/i])
  const force = pickNumber(text, [/(\d+(?:\.\d+)?)\s*N\b/, /force[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  const density = pickNumber(text, [/(\d+(?:\.\d+)?)\s*kg\/m/i, /density[^\d]{0,12}(\d+(?:\.\d+)?)/i])

  if (v0 !== undefined) raw.v0 = v0
  if (angle !== undefined) raw.angleDeg = angle
  if (h0 !== undefined) raw.h0 = h0
  if (g !== undefined) raw.g = g
  if (mass !== undefined) {
    raw.mass = mass
    raw.m1 = mass
  }
  if (mu !== undefined) raw.mu = mu
  if (e !== undefined) raw.e = e
  if (length !== undefined) raw.length = length
  if (force !== undefined) raw.force = force
  if (density !== undefined) raw.densityObject = density
  return raw
}

const PRIORITY: TemplateId[] = [
  'pendulum',
  'buoyancy',
  'ramp_friction',
  'collision_1d',
  'bounce_energy',
  'free_fall',
  'force_ma',
  'projectile_2d',
]

export function matchTemplateFromText(text: string): TemplateMatch | null {
  const hay = text.toLowerCase()
  if (!hay.trim()) return null

  let best: TemplateId | null = null
  let bestScore = 0
  for (const id of PRIORITY) {
    const def = TEMPLATE_CATALOG[id]
    let score = 0
    for (const kw of def.keywords) {
      if (hay.includes(kw.toLowerCase())) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }

  if (!best || bestScore === 0) return null

  const extracted = extractCommon(text)
  const { params } = parseTemplateParams(best, extracted)
  return {
    templateId: best,
    params,
    title: TEMPLATE_CATALOG[best].label,
  }
}

export function matchKnownTemplateId(id: unknown): TemplateId | null {
  return isTemplateId(id) ? id : null
}

export { TEMPLATE_IDS }
