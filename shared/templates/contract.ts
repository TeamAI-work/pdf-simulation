// shared/templates/contract.ts
// One-file-per-sim contract. A sim file only needs params to produce a stage.

import { z } from 'zod'
import type { SimStage } from '../simSpec.js'

export type SimDomain = 'physics' | 'math' | 'chemistry'
export type ClassBand = '6-8' | '9-10' | '6-10' | '7-10' | '8-9' | '8-10'

export interface ParamOption {
  value: number
  label: string
}

export interface ParamDef {
  key: string
  label: string
  unit: string
  min: number
  max: number
  step: number
  defaultValue: number
  /** Discrete choices. When set, the UI shows buttons/a selector instead of a slider. */
  options?: ParamOption[]
}

export interface SimRunResult {
  stage: SimStage
  metrics: Record<string, number | string | boolean>
  warnings: string[]
  caption?: string
}

export interface SimFile {
  id: string
  domain: SimDomain
  classBand: ClassBand
  label: string
  ncertClass: number
  description: string
  equations: string[]
  keywords: string[]
  params: ParamDef[]
  schema: z.ZodTypeAny
  run: (params: Record<string, number>) => SimRunResult
}

export const num = (min: number, max: number, fallback: number) =>
  z.coerce.number().min(min).max(max).default(fallback).catch(fallback)

export function param(
  key: string,
  label: string,
  unit: string,
  min: number,
  max: number,
  step: number,
  defaultValue: number
): ParamDef {
  return { key, label, unit, min, max, step, defaultValue }
}

/** Named discrete values (series/parallel, metals, shells). Still stored as numbers for bind/LLM. */
export function choice(
  key: string,
  label: string,
  options: ParamOption[],
  defaultValue: number
): ParamDef {
  const values = options.map((o) => o.value)
  return {
    key,
    label,
    unit: '',
    min: Math.min(...values),
    max: Math.max(...values),
    step: 1,
    defaultValue,
    options,
  }
}

export function classBandToNcert(band: ClassBand): number {
  if (band === '6-8') return 7
  if (band === '9-10') return 9
  if (band === '7-10') return 8
  if (band === '8-9' || band === '8-10') return 9
  return 8
}
