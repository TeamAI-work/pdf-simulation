// web/src/features/pdf-simulator/sim/evalSpec.ts

import * as mathjs from 'mathjs'
import { isExpr, type SimStage, type SimElement } from '@pdf-sim/shared'

export interface CompiledProp {
  isExpression: boolean
  literalValue?: number | string
  compiledFn?: mathjs.EvalFunction
}

export interface CompiledElement {
  id: string
  type: SimElement['type']
  role: SimElement['role']
  props: Record<string, CompiledProp>
  text?: CompiledProp
}

export interface CompiledStage {
  viewBox: string
  elements: CompiledElement[]
}

export interface ResolvedElement {
  id: string
  type: SimElement['type']
  role: SimElement['role']
  props: Record<string, any>
  text?: string | number
}

export interface ResolvedStage {
  viewBox: string
  elements: ResolvedElement[]
}

/**
 * Pre-compiles all {$expr} expressions in a SimStage into mathjs EvalFunctions.
 * Should be called once whenever the SimSpec / Stage changes, not inside the 60fps render loop.
 */
export function createCompiledSpec(stage: SimStage): CompiledStage {
  const elements: CompiledElement[] = stage.elements.map((elem) => {
    const compiledProps: Record<string, CompiledProp> = {}

    for (const [key, val] of Object.entries(elem.props || {})) {
      if (isExpr(val)) {
        try {
          const compiledFn = mathjs.compile(val.$expr)
          compiledProps[key] = {
            isExpression: true,
            compiledFn,
          }
        } catch {
          // If compilation fails, fallback to 0
          compiledProps[key] = {
            isExpression: false,
            literalValue: 0,
          }
        }
      } else {
        compiledProps[key] = {
          isExpression: false,
          literalValue: val,
        }
      }
    }

    let compiledText: CompiledProp | undefined
    if (elem.text !== undefined) {
      if (isExpr(elem.text)) {
        try {
          const compiledFn = mathjs.compile(elem.text.$expr)
          compiledText = {
            isExpression: true,
            compiledFn,
          }
        } catch {
          compiledText = {
            isExpression: false,
            literalValue: '',
          }
        }
      } else {
        compiledText = {
          isExpression: false,
          literalValue: elem.text,
        }
      }
    }

    return {
      id: elem.id,
      type: elem.type,
      role: elem.role,
      props: compiledProps,
      text: compiledText,
    }
  })

  return {
    viewBox: stage.viewBox || '0 0 500 300',
    elements,
  }
}

/**
 * Evaluates a single compiled property value against the current time and scope.
 */
export function evaluateProp(prop: CompiledProp, scope: Record<string, any>): any {
  if (!prop.isExpression) {
    return prop.literalValue
  }

  if (!prop.compiledFn) {
    return 0
  }

  try {
    const res = prop.compiledFn.evaluate(scope)
    if (typeof res === 'number') {
      return Number.isFinite(res) ? res : 0
    }
    if (typeof res === 'string' || typeof res === 'boolean') {
      return res
    }
    return res ?? 0
  } catch {
    // Graceful fallback for undefined symbols or evaluation errors
    return 0
  }
}

/**
 * Evaluates a CompiledStage at a specific point in time (in seconds).
 * Designed for 60fps performance inside requestAnimationFrame.
 */
export function evalSpec(
  compiledStage: CompiledStage,
  time: number,
  extraScope: Record<string, any> = {}
): ResolvedStage {
  const scope = {
    time,
    t: time,
    pi: Math.PI,
    PI: Math.PI,
    e: Math.E,
    concat: (...args: any[]) => args.map((a) => (typeof a === 'number' ? a : String(a))).join(''),
    round: (val: number, decimals = 0) => {
      const factor = Math.pow(10, decimals)
      return Math.round(val * factor) / factor
    },
    ...extraScope,
  }

  const resolvedElements: ResolvedElement[] = compiledStage.elements.map((elem) => {
    const resolvedProps: Record<string, any> = {}

    for (const [key, prop] of Object.entries(elem.props)) {
      resolvedProps[key] = evaluateProp(prop, scope)
    }

    let resolvedText: string | number | undefined
    if (elem.text) {
      resolvedText = evaluateProp(elem.text, scope)
    }

    return {
      id: elem.id,
      type: elem.type,
      role: elem.role,
      props: resolvedProps,
      text: resolvedText,
    }
  })

  return {
    viewBox: compiledStage.viewBox,
    elements: resolvedElements,
  }
}
