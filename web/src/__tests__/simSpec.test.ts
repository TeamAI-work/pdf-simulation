// web/src/__tests__/simSpec.test.ts
import { describe, it, expect } from 'vitest'
import { SimSpecSchema, isExpr } from '@pdf-sim/shared/simSpec'
import {
  physicsFixture,
  chemistryFixture,
  mathFixture,
  generalFixture,
  allFixtures,
} from '@pdf-sim/shared/simSpec.fixtures'

describe('Web-side @pdf-sim/shared import and validation', () => {
  it('imports and parses all fixtures successfully in web environment', () => {
    for (const [_name, fixture] of Object.entries(allFixtures)) {
      const parsed = SimSpecSchema.parse(fixture)
      expect(parsed).toBeDefined()
      expect(parsed.version).toBe('2.0')
    }
  })

  it('validates physics and chemistry fixture props', () => {
    expect(physicsFixture.domain).toBe('physics')
    expect(chemistryFixture.domain).toBe('chemistry')
  })

  it('validates math fixture wave oscillator props', () => {
    const wave = mathFixture.stage?.elements.find((e) => e.type === 'wave')
    expect(wave).toBeDefined()
    expect(isExpr(wave?.props.phase as any)).toBe(true)
  })

  it('validates general conveyor belt props', () => {
    const packet = generalFixture.stage?.elements.find((e) => e.id === 'payload-packet')
    expect(packet).toBeDefined()
    expect(isExpr(packet?.props.x as any)).toBe(true)
  })
})
