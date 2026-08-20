// shared/simSpec.ts
// THE schema. Single source of truth.
// Imported by both server/ and web/ — do NOT add platform-specific imports here.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitive: $expr marker
// ---------------------------------------------------------------------------
const Expr = z.object({ $expr: z.string().min(1) })

/**
 * A value is either:
 *  - a literal number  (e.g. 42, 3.14)
 *  - a literal string  (e.g. "#ff0000", "Hello")
 *  - a mathjs expression wrapped in { $expr: "sin(time)*100" }
 */
const ValueSchema = z.union([z.number(), z.string(), Expr])
export type Value = z.infer<typeof ValueSchema>

/**
 * Returns true only when `v` is an `{ $expr }` object — never for strings or numbers.
 * Use this guard before passing anything to the mathjs evaluator.
 */
export function isExpr(v: Value): v is z.infer<typeof Expr> {
  return typeof v === 'object' && v !== null && '$expr' in v
}

// ---------------------------------------------------------------------------
// Element types
// ---------------------------------------------------------------------------
const ElementRole = z.enum(['projectile', 'trajectory', 'none']).default('none')
const BaseProps = z.record(z.string(), ValueSchema)

const ElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'circle',
    'rect',
    'line',
    'path',
    'text',
    'arrow',
    'wave',
    'particles',
    'spring',
    'arc',
    'active-path',
  ]),
  role: ElementRole,
  props: BaseProps.default({}),
  text: ValueSchema.optional(),
})
export type SimElement = z.infer<typeof ElementSchema>

// ---------------------------------------------------------------------------
// Stage
// ---------------------------------------------------------------------------
const StageSchema = z.object({
  viewBox: z.string().default('0 0 500 300'),
  elements: z.array(ElementSchema).min(1),
})
export type SimStage = z.infer<typeof StageSchema>

// ---------------------------------------------------------------------------
// Top-level SimSpec
// ---------------------------------------------------------------------------
export const SimSpecSchema = z.object({
  version: z.literal('2.0'),
  parentTopic: z.string().default(''),
  title: z.string().min(1),
  subtitle: z.string().default(''),
  domain: z.enum(['physics', 'chemistry', 'math', 'general']),
  topicExplanation: z.string().default(''),
  caption: z.string().default(''),
  isSimulatable: z.boolean(),
  reasonIfNotSimulatable: z.string().default(''),
  /** Verbatim text excerpt — shown in the Drawer for context only, NOT used for spatial mapping */
  quote: z.string().default(''),
  equations: z.array(z.string()).default([]),
  stage: StageSchema.optional(),
}).superRefine((spec, ctx) => {
  if (spec.isSimulatable && (!spec.stage || spec.stage.elements.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'isSimulatable=true requires stage.elements to be non-empty',
      path: ['stage'],
    })
  }
})

export type SimSpec = z.infer<typeof SimSpecSchema>
