// server/src/services/sim/candidateSchema.ts

import { z } from 'zod'
import { SimSpecSchema, type SimSpec } from '@pdf-sim/shared'

/**
 * Zod schema for an LLM candidate, extending the shared SimSpec with an importance score (1-10).
 */
export const CandidateSchema = SimSpecSchema.and(
  z.object({
    importance: z.number().min(1).max(10),
  })
)

export type Candidate = SimSpec & {
  importance: number
}

/**
 * Max 3 candidates per page as mandated by the Curator pipeline.
 */
export const CandidateListSchema = z.array(CandidateSchema).max(3)

export type CandidateList = z.infer<typeof CandidateListSchema>
