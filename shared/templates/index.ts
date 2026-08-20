export {
  TEMPLATE_IDS,
  TEMPLATE_CATALOG,
  PARAM_SCHEMAS,
  isTemplateId,
  parseTemplateParams,
  randomizeTemplateParams,
  allowedTemplateIdList,
  type TemplateId,
  type ParamDef,
  type TemplateDefinition,
  type ParamMetaMap,
} from './catalog.js'

export { bindTemplate, createTemplateSpec, type BindResult } from './bind.js'
export { matchTemplateFromText, matchKnownTemplateId, type TemplateMatch } from './match.js'
export {
  solveProjectile,
  analyticFlatRange,
  solveCollision1d,
  pendulumPeriod,
  rampAcceleration,
  buoyancyResult,
} from './physics.js'
