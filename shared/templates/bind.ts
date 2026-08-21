// shared/templates/bind.ts
// Thin dispatcher: clamp params, call sim.run(params), wrap as SimSpec.

import type { SimSpec } from '../simSpec.js'
import {
  isTemplateId,
  parseTemplateParams,
  TEMPLATE_CATALOG,
  type TemplateId,
} from './catalog.js'
import { SIM_REGISTRY } from './sims/index.js'

export interface BindResult {
  spec: SimSpec
  metrics: Record<string, number | string | boolean>
  warnings: string[]
}

function baseSpec(
  templateId: TemplateId,
  params: Record<string, number>,
  extra: Partial<SimSpec> = {}
): Omit<SimSpec, 'stage'> {
  const def = TEMPLATE_CATALOG[templateId]
  return {
    version: '2.0',
    parentTopic: extra.parentTopic || def.label,
    title: extra.title || def.label,
    subtitle: extra.subtitle || def.description,
    domain: extra.domain || def.domain,
    topicExplanation: extra.topicExplanation || def.description,
    caption: extra.caption || '',
    isSimulatable: true,
    reasonIfNotSimulatable: '',
    quote: extra.quote || '',
    equations: extra.equations?.length ? extra.equations : def.equations,
    templateId,
    params,
    paramMeta: extra.paramMeta,
  }
}

export function bindTemplate(
  templateId: string,
  rawParams?: Record<string, number | string>,
  extra: Partial<SimSpec> = {}
): BindResult {
  const warnings: string[] = []
  if (!isTemplateId(templateId)) {
    warnings.push(`Unknown templateId "${templateId}"`)
    return {
      spec: {
        version: '2.0',
        title: extra.title || 'Unknown template',
        domain: extra.domain || 'physics',
        isSimulatable: false,
        reasonIfNotSimulatable: `Unknown templateId "${templateId}"`,
        quote: extra.quote || '',
        equations: extra.equations || [],
        parentTopic: extra.parentTopic || '',
        subtitle: extra.subtitle || '',
        topicExplanation: extra.topicExplanation || '',
        caption: extra.caption || '',
      },
      metrics: {},
      warnings,
    }
  }

  const { params, paramMeta } = parseTemplateParams(templateId, rawParams)
  const result = SIM_REGISTRY[templateId].run(params)
  warnings.push(...result.warnings)
  const specBase = baseSpec(templateId, params, { ...extra, paramMeta: extra.paramMeta || paramMeta })
  return {
    spec: {
      ...specBase,
      caption: extra.caption || result.caption || specBase.caption,
      stage: result.stage,
    },
    metrics: result.metrics,
    warnings,
  }
}

/** Metadata-only spec stored at ingest (no stage). Bind at render with run(params). */
export function createTemplateSpec(
  templateId: TemplateId,
  rawParams?: Record<string, number | string>,
  extra: Partial<SimSpec> = {}
): SimSpec {
  const { params, paramMeta } = parseTemplateParams(templateId, rawParams)
  return {
    ...baseSpec(templateId, params, { ...extra, paramMeta: extra.paramMeta || paramMeta }),
  }
}
