// shared/simSpec.test.ts
import { describe, it, expect } from 'vitest'
import { SimSpecSchema, isExpr } from './simSpec.js'
import {
  physicsFixture,
  chemistryFixture,
  mathFixture,
  generalFixture,
  nonSimulatableFixture,
  allFixtures,
} from './simSpec.fixtures.js'

describe('SimSpecSchema validation', () => {
  it('parses physics fixture correctly', () => {
    const parsed = SimSpecSchema.parse(physicsFixture)
    expect(parsed.domain).toBe('physics')
    expect(parsed.isSimulatable).toBe(true)
    expect(parsed.stage?.elements.length).toBeGreaterThan(0)
  })

  it('parses chemistry fixture correctly', () => {
    const parsed = SimSpecSchema.parse(chemistryFixture)
    expect(parsed.domain).toBe('chemistry')
    expect(parsed.isSimulatable).toBe(true)
  })

  it('parses math fixture correctly', () => {
    const parsed = SimSpecSchema.parse(mathFixture)
    expect(parsed.domain).toBe('math')
    expect(parsed.isSimulatable).toBe(true)
  })

  it('parses general fixture correctly', () => {
    const parsed = SimSpecSchema.parse(generalFixture)
    expect(parsed.domain).toBe('general')
    expect(parsed.isSimulatable).toBe(true)
  })

  it('parses non-simulatable fixture correctly', () => {
    const parsed = SimSpecSchema.parse(nonSimulatableFixture)
    expect(parsed.isSimulatable).toBe(false)
    expect(parsed.reasonIfNotSimulatable.length).toBeGreaterThan(0)
  })

  it('validates all export fixtures in bulk', () => {
    for (const [name, fixture] of Object.entries(allFixtures)) {
      expect(() => SimSpecSchema.parse(fixture), `Fixture '${name}' should be valid`).not.toThrow()
    }
  })

  it('rejects isSimulatable=true without stage or with empty elements', () => {
    const invalidNoStage = {
      ...physicsFixture,
      stage: undefined,
    }
    expect(() => SimSpecSchema.parse(invalidNoStage)).toThrow(
      'isSimulatable=true requires stage.elements to be non-empty'
    )

    const invalidEmptyElements = {
      ...physicsFixture,
      stage: {
        viewBox: '0 0 500 300',
        elements: [],
      },
    }
    expect(() => SimSpecSchema.parse(invalidEmptyElements)).toThrow()
  })

  it('rejects unsupported domain', () => {
    const invalidDomain = {
      ...physicsFixture,
      domain: 'astronomy',
    }
    expect(() => SimSpecSchema.parse(invalidDomain)).toThrow()
  })

  it('rejects unsupported element type', () => {
    const invalidElementType = {
      ...physicsFixture,
      stage: {
        viewBox: '0 0 500 300',
        elements: [
          {
            id: 'unsupported-1',
            type: 'polygon',
            role: 'none',
            props: {},
          },
        ],
      },
    }
    expect(() => SimSpecSchema.parse(invalidElementType)).toThrow()
  })
})

describe('isExpr type guard', () => {
  it('returns true for valid $expr objects', () => {
    expect(isExpr({ $expr: 'sin(time)' })).toBe(true)
    expect(isExpr({ $expr: '100 + 50' })).toBe(true)
  })

  it('returns false for literal numbers, strings, and other objects', () => {
    expect(isExpr(42)).toBe(false)
    expect(isExpr('#ff0000')).toBe(false)
    expect(isExpr('')).toBe(false)
    expect(isExpr(null as unknown as string)).toBe(false)
    expect(isExpr(undefined as unknown as string)).toBe(false)
    expect(isExpr({ expr: 'sin(time)' } as unknown as string)).toBe(false)
  })
})
