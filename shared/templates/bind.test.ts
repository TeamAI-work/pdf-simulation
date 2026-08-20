import { describe, it, expect } from 'vitest'
import { bindTemplate, createTemplateSpec } from './bind.js'
import { analyticFlatRange, solveCollision1d, solveProjectile } from './physics.js'
import { isTemplateId, parseTemplateParams, randomizeTemplateParams, TEMPLATE_CATALOG, TEMPLATE_IDS } from './catalog.js'
import { matchTemplateFromText } from './match.js'

describe('bindTemplate projectile accuracy', () => {
  it('matches flat-ground analytic range for 20 m/s at 45°', () => {
    const v0 = 20
    const angleDeg = 45
    const g = 9.81
    const bound = bindTemplate('projectile_2d', { v0, angleDeg, h0: 0, g })
    const expected = analyticFlatRange(v0, angleDeg, g)
    const sol = solveProjectile(v0, angleDeg, 0, g)
    expect(sol.range).toBeCloseTo(expected, 5)
    expect(bound.metrics.range as number).toBeCloseTo(expected, 2)
    expect(bound.metrics.flightTime as number).toBeCloseTo(sol.flightTime, 3)
    expect(bound.warnings).toHaveLength(0)
    expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
    expect(bound.spec.templateId).toBe('projectile_2d')
  })

  it('uses textbook params rather than silently replacing them', () => {
    const bound = bindTemplate('projectile_2d', { v0: 28, angleDeg: 30, h0: 2, g: 9.81 })
    expect(bound.spec.params?.v0).toBe(28)
    expect(bound.spec.params?.angleDeg).toBe(30)
    expect(bound.spec.params?.h0).toBe(2)
  })
})

describe('bindTemplate collision energy', () => {
  it('conserves kinetic energy when e = 1', () => {
    const bound = bindTemplate('collision_1d', { m1: 2, m2: 3, u1: 6, u2: -2, e: 1 })
    const sol = solveCollision1d(2, 3, 6, -2, 1)
    expect(bound.metrics.energyLoss as number).toBeCloseTo(0, 5)
    expect(bound.metrics.keAfter as number).toBeCloseTo(sol.keBefore, 5)
  })

  it('loses energy when e = 0 (perfectly inelastic)', () => {
    const bound = bindTemplate('collision_1d', { m1: 2, m2: 2, u1: 8, u2: -4, e: 0 })
    expect(bound.metrics.energyLoss as number).toBeGreaterThan(0)
    expect(bound.metrics.v1).toBe(bound.metrics.v2)
  })
})

describe('createTemplateSpec', () => {
  it('stores templateId + params without a stage', () => {
    const spec = createTemplateSpec('free_fall', { h0: 12 })
    expect(spec.templateId).toBe('free_fall')
    expect(spec.params?.h0).toBe(12)
    expect(spec.params?.g).toBe(9.81)
    expect(spec.stage).toBeUndefined()
    expect(spec.isSimulatable).toBe(true)
  })
})

describe('parseTemplateParams', () => {
  it('fills defaults for missing keys', () => {
    const { params, paramMeta } = parseTemplateParams('projectile_2d', { v0: 15 })
    expect(params.v0).toBe(15)
    expect(params.angleDeg).toBe(45)
    expect(paramMeta.v0?.source).toBe('extracted')
    expect(paramMeta.angleDeg?.source).toBe('default')
  })
})

describe('isTemplateId', () => {
  it('accepts catalog ids and rejects unknown', () => {
    expect(isTemplateId('projectile_2d')).toBe(true)
    expect(isTemplateId('wormhole')).toBe(false)
  })
})

describe('randomizeTemplateParams', () => {
  it('stays inside slider min/max for every catalog template', () => {
    for (const id of TEMPLATE_IDS) {
      const params = randomizeTemplateParams(id)
      for (const def of TEMPLATE_CATALOG[id].params) {
        expect(params[def.key]).toBeGreaterThanOrEqual(def.min)
        expect(params[def.key]).toBeLessThanOrEqual(def.max)
      }
    }
  })
})

describe('matchTemplateFromText', () => {
  it('maps a projectile sentence to projectile_2d with extracted numbers', () => {
    const m = matchTemplateFromText('A ball is thrown at 20 m/s at 45 degrees.')
    expect(m?.templateId).toBe('projectile_2d')
    expect(m?.params.v0).toBe(20)
    expect(m?.params.angleDeg).toBe(45)
  })

  it('returns null when no keyword matches', () => {
    expect(matchTemplateFromText('Photosynthesis in green leaves')).toBeNull()
  })
})
