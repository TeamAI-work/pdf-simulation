// server/src/services/sim/proceduralSim.ts
// Keyword → catalog template + extracted params. Does not invent SVG cartoons.

import type { Candidate } from './candidateSchema.js'
import {
  createTemplateSpec,
  matchTemplateFromText,
  type SimSpec,
} from '@pdf-sim/shared'

export interface ConceptContext {
  title?: string
  subtitle?: string
  parentTopic?: string
  domain?: string
  topicExplanation?: string
  equations?: string[]
  quote?: string
}

function toCandidate(spec: SimSpec, importance = 8): Candidate {
  return { ...spec, importance }
}

/**
 * Maps a prompt or textbook excerpt onto a physics template.
 * Returns a metadata-only Candidate (templateId + params, no stage).
 * If nothing matches, returns a non-simulatable candidate instead of fake motion.
 */
export function generateProceduralSimSpec(
  promptOrTopic: string,
  context: ConceptContext = {}
): Candidate {
  const blob = [
    promptOrTopic,
    context.title,
    context.subtitle,
    context.parentTopic,
    context.topicExplanation,
    context.quote,
    (context.equations || []).join(' '),
  ]
    .filter(Boolean)
    .join(' ')

  const matched = matchTemplateFromText(blob)
  const quote = context.quote || promptOrTopic.substring(0, 200)

  if (matched) {
    const spec = createTemplateSpec(matched.templateId, matched.params, {
      title: context.title || matched.title,
      subtitle: context.subtitle,
      parentTopic: context.parentTopic,
      domain: context.domain as SimSpec['domain'] | undefined,
      topicExplanation: context.topicExplanation,
      equations: context.equations,
      quote,
    })
    return toCandidate(spec, 8)
  }

  return toCandidate(
    {
      version: '2.0',
      title: context.title || promptOrTopic.substring(0, 60) || 'Not simulatable',
      subtitle: context.subtitle || '',
      parentTopic: context.parentTopic || '',
      domain: (context.domain as SimSpec['domain']) || 'general',
      topicExplanation: context.topicExplanation || '',
      caption: '',
      isSimulatable: false,
      reasonIfNotSimulatable:
        'No catalog template matched this concept. Only Class 6–10 physics, chemistry, and maths sim files can run.',
      quote,
      equations: context.equations || [],
    },
    4
  )
}
