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

const METAL_PATTERNS: { re: RegExp; rank: number }[] = [
  { re: /\bsodium\b|\bna\b/i, rank: 0 },
  { re: /\bmagnesium\b|\bmg\b/i, rank: 1 },
  { re: /\bzinc\b|\bzn\b/i, rank: 2 },
  { re: /\biron\b|\bfe\b/i, rank: 3 },
  { re: /\bcopper\b|\bcu\b/i, rank: 4 },
]

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

function allNumbers(text: string, re: RegExp): number[] {
  const out: number[] = []
  const copy = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`)
  for (const m of text.matchAll(copy)) {
    const n = Number(m[1])
    if (Number.isFinite(n)) out.push(n)
  }
  return out
}

function extractMetals(text: string): { metalA?: number; metalB?: number } {
  const found: { index: number; rank: number }[] = []
  for (const { re, rank } of METAL_PATTERNS) {
    const m = text.match(re)
    if (m && m.index !== undefined) found.push({ index: m.index, rank })
  }
  found.sort((a, b) => a.index - b.index)
  if (found.length === 0) return {}
  if (found.length === 1) return { metalA: found[0].rank }
  return { metalA: found[0].rank, metalB: found[1].rank }
}

function extractCommon(text: string): Record<string, number> {
  const raw: Record<string, number> = {}
  const set = (key: string, val: number | undefined) => {
    if (val !== undefined) raw[key] = val
  }

  set(
    'v0',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*m\/s/i,
      /(\d+(?:\.\d+)?)\s*metres?\s*per\s*second/i,
      /speed(?:\s+of)?\s+(\d+(?:\.\d+)?)/i,
      /velocity[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    ])
  )
  set('v', raw.v0)
  set('u', pickNumber(text, [/u\s*=\s*(\d+(?:\.\d+)?)/i, /initial\s+speed[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  if (/from rest/i.test(text)) set('u', 0)
  set(
    'angleDeg',
    pickNumber(text, [/(\d+(?:\.\d+)?)\s*(?:°|deg(?:rees)?)/i, /angle[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  )
  set('theta1', raw.angleDeg)
  set('theta0', raw.angleDeg)
  set(
    'h0',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:high|height|above)/i,
      /height[^\d]{0,12}(\d+(?:\.\d+)?)/i,
      /from\s+(\d+(?:\.\d+)?)\s*m/i,
    ])
  )
  set('objectHeight', raw.h0)
  set('h', pickNumber(text, [/h\s*=\s*(\d+(?:\.\d+)?)/i, /depth[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  if (raw.h === undefined && raw.h0 !== undefined) raw.h = raw.h0
  set('g', pickNumber(text, [/g\s*=\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m\/s\^?2/i]))
  const mass = pickNumber(text, [/(\d+(?:\.\d+)?)\s*kg/i, /mass[^\d]{0,12}(\d+(?:\.\d+)?)/i])
  if (mass !== undefined) {
    raw.mass = mass
    raw.m1 = mass
    raw.m = mass
  }
  set('mu', pickNumber(text, [/μ\s*=\s*(\d+(?:\.\d+)?)/i, /mu\s*=\s*(\d+(?:\.\d+)?)/i, /friction[^\d]{0,12}(\d+(?:\.\d+)?)/i, /refractive index[^\d]{0,16}(\d+(?:\.\d+)?)/i]))
  set('e', pickNumber(text, [/e\s*=\s*(\d+(?:\.\d+)?)/i, /restitution[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('length', pickNumber(text, [/length[^\d]{0,12}(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m(?:eter)?\s*(?:long|string|pendulum)/i]))
  set('force', pickNumber(text, [/(\d+(?:\.\d+)?)\s*N\b/, /force[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('densityObject', pickNumber(text, [/(\d+(?:\.\d+)?)\s*kg\/m/i, /density[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('rho', pickNumber(text, [/ρ\s*=\s*(\d+(?:\.\d+)?)/i, /rho\s*=\s*(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*kg\s*\/\s*m/i]))
  if (raw.rho === undefined) raw.rho = raw.densityObject
  set(
    'temperature',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*(?:K|kelvin|°C|deg(?:rees)?\s*c)/i,
      /T\s*=\s*(\d+(?:\.\d+)?)/,
      /temperature[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    ])
  )
  set('T', raw.temperature)
  set('V', pickNumber(text, [/(\d+(?:\.\d+)?)\s*V\b/, /voltage[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('voltage', raw.V)
  set('Vmax', raw.V)
  const ohms = allNumbers(text, /(\d+(?:\.\d+)?)\s*(?:Ω|ohm)/i)
  if (ohms[0] !== undefined) {
    raw.R = ohms[0]
    raw.R1 = ohms[0]
  }
  if (ohms[1] !== undefined) raw.R2 = ohms[1]
  if (raw.R === undefined) {
    set('R', pickNumber(text, [/resistance[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  }
  set('I', pickNumber(text, [/(\d+(?:\.\d+)?)\s*A\b/, /current[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('f', pickNumber(text, [/(\d+(?:\.\d+)?)\s*Hz/i, /focal[^\d]{0,12}(\d+(?:\.\d+)?)/i, /frequency[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('omega', pickNumber(text, [/ω\s*=\s*(\d+(?:\.\d+)?)/i, /omega[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('n1', pickNumber(text, [/n\s*1\s*=\s*(\d+(?:\.\d+)?)/i, /n₁\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('n2', pickNumber(text, [/n\s*2\s*=\s*(\d+(?:\.\d+)?)/i, /n₂\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('k', pickNumber(text, [/k\s*=\s*(\d+(?:\.\d+)?)/i, /spring[^\d]{0,20}(\d+(?:\.\d+)?)/i]))
  set('A', pickNumber(text, [/amplitude[^\d]{0,12}(\d+(?:\.\d+)?)/i, /A\s*=\s*(\d+(?:\.\d+)?)/, /prism angle[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('a', pickNumber(text, [/a\s*=\s*(-?\d+(?:\.\d+)?)/i, /acceleration[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('r', pickNumber(text, [/radius[^\d]{0,12}(\d+(?:\.\d+)?)/i, /r\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('m', pickNumber(text, [/slope[^\d]{0,12}(-?\d+(?:\.\d+)?)/i, /m\s*=\s*(-?\d+(?:\.\d+)?)/]))
  set('c', pickNumber(text, [/intercept[^\d]{0,12}(-?\d+(?:\.\d+)?)/i, /c\s*=\s*(-?\d+(?:\.\d+)?)/]))
  set('numerator', pickNumber(text, [/numerator[^\d]{0,12}(\d+)/i, /(\d+)\s*\/\s*\d+/]))
  set('denominator', pickNumber(text, [/denominator[^\d]{0,12}(\d+)/i, /\d+\s*\/\s*(\d+)/]))
  set('activationEnergy', pickNumber(text, [/E_?a[^\d]{0,8}(\d+(?:\.\d+)?)/i, /activation[^\d]{0,16}(\d+(?:\.\d+)?)/i]))
  set('n', pickNumber(text, [/n\s*=\s*(\d+)/i, /shell\s+n\s*=\s*(\d+)/i, /(\d+)\s*terms/i]))
  set('d', pickNumber(text, [/d\s*=\s*(-?\d+(?:\.\d+)?)/i, /common difference[^\d]{0,16}(-?\d+(?:\.\d+)?)/i]))
  set('count', pickNumber(text, [/(\d+)\s*particles/i]))
  set('P', pickNumber(text, [/(\d+(?:\.\d+)?)\s*atm/i, /pressure[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('conductivity', pickNumber(text, [/conductivity[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set(
    'distance',
    pickNumber(text, [
      /(\d+(?:\.\d+)?)\s*m(?:eters?)?\s*(?:away|distant|off)/i,
      /(?:cliff|wall|distance)[^\d]{0,20}(\d+(?:\.\d+)?)/i,
      /distance[^\d]{0,12}(\d+(?:\.\d+)?)/i,
    ])
  )
  set('sourceDistance', raw.distance)
  set('tMax', pickNumber(text, [/for\s+(\d+(?:\.\d+)?)\s*s(?:ec(?:onds)?)?\b/i, /(\d+(?:\.\d+)?)\s*s(?:ec(?:onds)?)?\b/i, /t\s*=\s*(\d+(?:\.\d+)?)/i]))
  set('t', pickNumber(text, [/t\s*=\s*(\d+(?:\.\d+)?)/i, /time[^\d]{0,12}(\d+(?:\.\d+)?)\s*s/i]))
  set('start', pickNumber(text, [/start(?:ing)?[^\d]{0,12}(-?\d+)/i]))
  set('delta', pickNumber(text, [/delta[^\d]{0,12}(-?\d+)/i, /add(?:s|ed)?\s+(-?\d+)/i]))
  set('scale', pickNumber(text, [/scale[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('dx', pickNumber(text, [/dx\s*=\s*(-?\d+(?:\.\d+)?)/i]))
  set('dy', pickNumber(text, [/dy\s*=\s*(-?\d+(?:\.\d+)?)/i]))

  const pairs = [...text.matchAll(/\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/g)]
  if (pairs[0]) {
    raw.x1 = Number(pairs[0][1])
    raw.y1 = Number(pairs[0][2])
  }
  if (pairs[1]) {
    raw.x2 = Number(pairs[1][1])
    raw.y2 = Number(pairs[1][2])
  }

  set('pH', pickNumber(text, [/pH\s*(?:=|of|:)?\s*(\d+(?:\.\d+)?)/i]))
  set('area', pickNumber(text, [/area[^\d]{0,12}(\d+(?:\.\d+)?)/i, /(\d+(?:\.\d+)?)\s*m(?:²|\^2)/i]))
  set(
    'vSound',
    pickNumber(text, [
      /speed of sound[^\d]{0,20}(\d+(?:\.\d+)?)/i,
      /v(?:Sound)?\s*=\s*(\d+(?:\.\d+)?)/i,
    ])
  )
  if (raw.vSound === undefined && /echo|speed of sound/i.test(text) && raw.v0 !== undefined) {
    raw.vSound = raw.v0
  }
  set('turns', pickNumber(text, [/(\d+)\s*turns/i, /n\s*=\s*(\d+)\s*turns/i]))
  set('binStart', pickNumber(text, [/bin start[^\d]{0,12}(-?\d+)/i, /class(?:es)? start[^\d]{0,12}(-?\d+)/i]))
  set('binWidth', pickNumber(text, [/bin width[^\d]{0,12}(\d+)/i, /class width[^\d]{0,12}(\d+)/i]))
  set('favorable', pickNumber(text, [/(\d+)\s*favou?rable/i, /favou?rable[^\d]{0,16}(\d+)/i]))
  set('total', pickNumber(text, [/out of\s+(\d+)/i, /(\d+)\s*(?:total|equally likely|outcomes)/i]))
  set('partA', pickNumber(text, [/part\s*a[^\d]{0,8}(\d+(?:\.\d+)?)/i, /A\s*[:=]\s*(\d+(?:\.\d+)?)/]))
  set('partB', pickNumber(text, [/part\s*b[^\d]{0,8}(\d+(?:\.\d+)?)/i, /B\s*[:=]\s*(\d+(?:\.\d+)?)/]))
  set('b', pickNumber(text, [/b\s*=\s*(-?\d+(?:\.\d+)?)/i]))
  set('s', pickNumber(text, [/s\s*=\s*(\d+(?:\.\d+)?)/i, /displacement[^\d]{0,12}(\d+(?:\.\d+)?)/i]))
  set('melting', pickNumber(text, [/melting[^\d]{0,16}(-?\d+(?:\.\d+)?)/i]))
  set('boiling', pickNumber(text, [/boiling[^\d]{0,16}(\d+(?:\.\d+)?)/i]))

  const eq = text.match(/(-?\d+)\s*x\s*([+-])\s*(\d+)\s*=\s*(-?\d+)/i)
  if (eq) {
    raw.coeff = Number(eq[1])
    raw.addend = Number(eq[2] === '-' ? -eq[3] : eq[3])
    raw.rhs = Number(eq[4])
  }

  const ratio = text.match(/(\d+)\s*:\s*(\d+)/)
  if (ratio) {
    const left = Number(ratio[1])
    const right = Number(ratio[2])
    if (/clock|hours|minutes|o'clock/i.test(text)) {
      raw.hours = left
      raw.minutes = right
    } else if (/section|divides|internally|m\s*:\s*n/i.test(text)) {
      raw.m = left
      raw.n = right
    } else {
      raw.partA = left
      raw.partB = right
      raw.hours = left
      raw.minutes = right
      raw.m = left
      raw.n = right
    }
  }
  set('hours', pickNumber(text, [/(\d+)\s*hours?/i, /hours?\s*[:=]?\s*(\d+)/i]))
  set('minutes', pickNumber(text, [/(\d+)\s*minutes?/i, /minutes?\s*[:=]?\s*(\d+)/i]))

  if (/in series|connected in series|series circuit/i.test(text)) raw.mode = 0
  if (/in parallel|connected in parallel|parallel circuit/i.test(text)) raw.mode = 1
  if (/concave/i.test(text)) raw.kind = 0
  if (/convex/i.test(text)) raw.kind = 1

  const metals = extractMetals(text)
  if (metals.metalA !== undefined) raw.metalA = metals.metalA
  if (metals.metalB !== undefined) raw.metalB = metals.metalB

  if (/bar (?:graph|chart)|pictograph/i.test(text)) {
    const nums = allNumbers(text, /(\d+(?:\.\d+)?)/)
    nums.slice(0, 5).forEach((v, i) => {
      raw[`v${i + 1}`] = v
    })
  }

  return raw
}

function keywordScore(id: TemplateId, hay: string): number {
  const def = TEMPLATE_CATALOG[id]
  let score = 0
  for (const kw of def.keywords) {
    const needle = kw.toLowerCase().replace(/[–—−]/g, '-')
    if (needle.length < 3) continue
    if (hay.includes(needle)) score += Math.max(1, needle.length / 4)
  }
  return score
}

function boostedScore(id: TemplateId, hay: string): number {
  let score = keywordScore(id, hay)
  const apish = /arithmetic progression|\ba\.?p\.?\b|common difference|nth term|first term/.test(hay)
  const viGraph = /v\s*-?\s*i\s*graph|voltage[\s-]*current graph|\bvi graph\b/.test(hay)
  const motionGraph = /distance-time|velocity-time|s-t graph|v-t graph|s-t and v-t/.test(hay)
  const combo = /two resistors|(?:series|parallel).{0,48}(?:resistor|ohm|Ω|battery|circuit)/.test(hay)
  const linearEq = /-?\d+\s*x\s*[+-]\s*\d+\s*=/.test(hay)
  const section = /divides/.test(hay) && /internally|ratio/.test(hay)
  const phish = /ph\s*(=|of|:)\s*\d|universal indicator|ph strip|ph scale/.test(hay)

  if (id === 'ap_graph' && apish) score += 10
  if ((id === 'accelerated_motion' || id === 'st_vt_graph' || id === 'force_ma') && apish) score -= 8
  if (id === 'vi_graph' && viGraph) score += 10
  if (id === 'ohm_circuit' && viGraph) score -= 8
  if (id === 'st_vt_graph' && motionGraph) score += 8
  if (id === 'accelerated_motion' && motionGraph) score -= 6
  if (id === 'series_parallel' && combo) score += 8
  if (id === 'ohm_circuit' && combo) score -= 6
  if (id === 'equation_balance' && linearEq) score += 12
  if (id === 'section_formula' && section) score += 10
  if (id === 'ph_strip' && phish) score += 10
  if (id === 'echo' && /\becho\b/.test(hay)) score += 6
  if (id === 'pressure_area' && /force/.test(hay) && /area/.test(hay)) score += 8
  if (id === 'reactivity_swap' && /zinc/.test(hay) && /copper/.test(hay)) score += 8
  if (id === 'identity_tiles' && /\(a\s*\+\s*b\)\s*\^?\s*2|a\s*\+\s*b squared/.test(hay)) score += 8
  if (id === 'probability_spinner' && /favou?rable|spinner|equally likely/.test(hay)) score += 6
  return score
}

export function matchTemplateFromText(text: string): TemplateMatch | null {
  const hay = text.toLowerCase().replace(/[–—−]/g, '-')
  if (!hay.trim()) return null

  let best: TemplateId | null = null
  let bestScore = 0
  for (const id of TEMPLATE_IDS) {
    const score = boostedScore(id, hay)
    if (score > bestScore) {
      bestScore = score
      best = id
    }
  }

  if (!best || bestScore <= 0) return null

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
