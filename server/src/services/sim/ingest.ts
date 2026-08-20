// server/src/services/sim/ingest.ts

import crypto from 'node:crypto'
import * as mathjs from 'mathjs'
import { isExpr, type SimSpec } from '@pdf-sim/shared'
import { shouldClassify } from '../pdf/shouldClassify.js'
import { classifyPage } from './classify.js'
import {
  findAnnotationsByHash,
  insertAnnotations,
  type CreateAnnotationInput,
  type AnnotationRecord,
} from './repository.js'
import type { Candidate } from './candidateSchema.js'

/**
 * Backend Math Guard: Runs mathjs.parse on every {$expr} in the SimSpec.
 * Returns false if any formula throws (e.g. Python syntax 'x**2' or malformed expressions).
 */
export function validateMathExpressions(spec: SimSpec): boolean {
  if (!spec.isSimulatable || !spec.stage) {
    return true
  }

  for (const element of spec.stage.elements) {
    // Validate element props
    if (element.props) {
      for (const [key, val] of Object.entries(element.props)) {
        if (isExpr(val)) {
          try {
            mathjs.parse(val.$expr)
          } catch (err) {
            console.warn(
              `[MathGuard] Dropping element ${element.id} prop "${key}": invalid math expression "${val.$expr}"`
            )
            return false
          }
        }
      }
    }

    // Validate element text
    if (element.text && isExpr(element.text)) {
      try {
        mathjs.parse(element.text.$expr)
      } catch (err) {
        console.warn(
          `[MathGuard] Dropping element ${element.id} text: invalid math expression "${element.text.$expr}"`
        )
        return false
      }
    }
  }

  return true
}

/**
 * Triages candidates according to Curator rules:
 * 1. Filter out importance < 6
 * 2. Sort by importance descending
 * 3. Keep at most top 3
 */
export function triageCandidates(candidates: Candidate[]): Candidate[] {
  return candidates
    .filter((c) => c.importance >= 6)
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 3)
}

/**
 * Generates a 16-character SHA-256 content hash of the page text.
 */
export function computeContentHash(pageText: string): string {
  return crypto.createHash('sha256').update(pageText.trim()).digest('hex').substring(0, 16)
}

export interface IngestPageParams {
  bookId: string
  pageNumber: number
  pageText: string
  skipCache?: boolean
}

/**
 * Orchestrates page ingestion:
 * 1. Content Hash & Cache check
 * 2. Pre-filter (word count >= 100)
 * 3. LLM Curation
 * 4. Triage (importance >= 6, top 3)
 * 5. Math Guard (mathjs.parse)
 * 6. DB Persist
 */
export async function processPageIngestion(params: IngestPageParams): Promise<AnnotationRecord[]> {
  const { bookId, pageNumber, pageText, skipCache = false } = params

  if (!pageText || pageText.trim().length === 0) {
    return []
  }

  const contentHash = computeContentHash(pageText)

  // 1. Check cache
  if (!skipCache) {
    try {
      const cached = await findAnnotationsByHash(contentHash)
      if (cached.length > 0) {
        // Reuse cached specs for this book/page
        const toInsert: CreateAnnotationInput[] = cached.map((c) => ({
          book_id: bookId,
          page_number: pageNumber,
          quote: c.quote,
          spec: c.spec,
          spec_version: c.spec_version,
          content_hash: contentHash,
        }))
        return await insertAnnotations(toInsert)
      }
    } catch (err) {
      console.warn(`[ingest] Cache lookup failed:`, err)
    }
  }

  // 2. Pre-filter heuristic
  if (!shouldClassify(pageText)) {
    return []
  }

  // 3. LLM Curation
  const candidates = await classifyPage(pageText)
  if (candidates.length === 0) {
    return []
  }

  // 4. Triage
  const triaged = triageCandidates(candidates)
  if (triaged.length === 0) {
    return []
  }

  // 5. Math Guard
  const validCandidates = triaged.filter((cand) => validateMathExpressions(cand))
  if (validCandidates.length === 0) {
    return []
  }

  // 6. DB Persist
  const annotationsToInsert: CreateAnnotationInput[] = validCandidates.map((cand) => {
    // Strip `importance` before saving to `sim_annotations.spec` to adhere strictly to SimSpecSchema
    const { importance, ...simSpec } = cand
    return {
      book_id: bookId,
      page_number: pageNumber,
      quote: simSpec.quote || pageText.substring(0, 200),
      spec: simSpec as SimSpec,
      spec_version: simSpec.version || '2.0',
      content_hash: contentHash,
    }
  })

  return await insertAnnotations(annotationsToInsert)
}
