// server/src/__tests__/simSpec.test.ts
import { describe, it, expect } from 'vitest'
import { SimSpecSchema, isExpr } from '@pdf-sim/shared/simSpec'
import {
  physicsFixture,
  chemistryFixture,
  mathFixture,
  generalFixture,
  allFixtures,
} from '@pdf-sim/shared/simSpec.fixtures'

describe('Server-side @pdf-sim/shared import and validation', () => {
  it('imports and parses all fixtures successfully in server environment', () => {
    for (const [_name, fixture] of Object.entries(allFixtures)) {
      const parsed = SimSpecSchema.parse(fixture)
      expect(parsed).toBeDefined()
      expect(parsed.version).toBe('2.0')
    }
  })

  it('validates math and general fixtures exist', () => {
    expect(mathFixture.domain).toBe('math')
    expect(generalFixture.domain).toBe('general')
  })

  it('validates physics projectile $expr expressions', () => {
    const ballElement = physicsFixture.stage?.elements.find((e) => e.id === 'ball')
    expect(ballElement).toBeDefined()
    expect(isExpr(ballElement?.props.cx as any)).toBe(true)
  })

  it('validates chemistry particle container properties', () => {
    const chamber = chemistryFixture.stage?.elements.find((e) => e.id === 'chamber')
    expect(chamber).toBeDefined()
    expect(chamber?.props.width).toBe(400)
  })
})
