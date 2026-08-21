// shared/templates/stage.ts
// Shared SVG primitives for sim files. No PDF / LLM / catalog imports.

import type { SimElement, SimStage } from '../simSpec.js'

export const VIEW = '0 0 500 300'
export const GROUND_Y = 260
export const ORIGIN_X = 40

export function n(x: number): string {
  if (!Number.isFinite(x)) return '0'
  const r = Math.round(x * 1e6) / 1e6
  return String(r)
}

export function tLoop(period: number, cap: number): string {
  const p = Math.max(period, 0.2)
  return `min(mod(time, ${n(p)}), ${n(cap)})`
}

export function stage(elements: SimElement[], viewBox = VIEW): SimStage {
  return { viewBox, elements }
}

export function ground(): SimElement {
  return {
    id: 'ground',
    type: 'line',
    role: 'none',
    props: { x1: 20, y1: GROUND_Y, x2: 480, y2: GROUND_Y, stroke: '#475569', strokeWidth: 3 },
  }
}

export function label(id: string, x: number, y: number, text: string, fill = '#334155'): SimElement {
  return {
    id,
    type: 'text',
    role: 'none',
    props: { x, y, fill, fontSize: 12 },
    text,
  }
}

export function circle(
  id: string,
  props: SimElement['props'],
  role: SimElement['role'] = 'none'
): SimElement {
  return { id, type: 'circle', role, props }
}

export function rect(
  id: string,
  props: SimElement['props'],
  role: SimElement['role'] = 'none'
): SimElement {
  return { id, type: 'rect', role, props }
}

export function line(id: string, props: SimElement['props'], role: SimElement['role'] = 'none'): SimElement {
  return { id, type: 'line', role, props }
}

export function arrow(id: string, props: SimElement['props']): SimElement {
  return { id, type: 'arrow', role: 'none', props }
}

export function pathEl(
  id: string,
  props: SimElement['props'],
  role: SimElement['role'] = 'none'
): SimElement {
  return { id, type: 'path', role, props }
}

export function wave(id: string, props: SimElement['props']): SimElement {
  return { id, type: 'wave', role: 'none', props }
}

export function particles(id: string, props: SimElement['props']): SimElement {
  return { id, type: 'particles', role: 'none', props }
}

export function spring(id: string, props: SimElement['props']): SimElement {
  return { id, type: 'spring', role: 'none', props }
}

export function ok(stageObj: SimStage, metrics: SimRunMetrics = {}, caption?: string, warnings: string[] = []) {
  return { stage: stageObj, metrics, warnings, caption }
}

type SimRunMetrics = Record<string, number | string | boolean>
