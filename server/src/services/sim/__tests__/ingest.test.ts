import { describe, it, expect } from 'vitest'
import { validateMathExpressions, triageCandidates, computeContentHash } from '../ingest.js'
import { physicsFixture, chemistryFixture } from '@pdf-sim/shared'
import type { Candidate } from '../candidateSchema.js'

describe('Ingest Service: validateMathExpressions (Math Guard)', () => {
  it('accepts valid mathjs expressions', () => {
    const validSpec = JSON.parse(JSON.stringify(physicsFixture))
    expect(validateMathExpressions(validSpec)).toBe(true)
  })

  it('rejects candidates with invalid Python power syntax (**)', () => {
    const invalidSpec = JSON.parse(JSON.stringify(physicsFixture))
    invalidSpec.stage.elements[1].props.cy = { $expr: '270 - (120 * time - 30 * time**2)' }

    expect(validateMathExpressions(invalidSpec)).toBe(false)
  })

  it('rejects candidates with malformed syntax (unbalanced parentheses)', () => {
    const invalidSpec = JSON.parse(JSON.stringify(physicsFixture))
    invalidSpec.stage.elements[1].props.cx = { $expr: 'sin(time * 2' }

    expect(validateMathExpressions(invalidSpec)).toBe(false)
  })

  it('validates expressions inside element text', () => {
    const specWithTextExpr = JSON.parse(JSON.stringify(physicsFixture))
    specWithTextExpr.stage.elements.push({
      id: 'timer-label',
      type: 'text',
      role: 'none',
      props: { x: 50, y: 50 },
      text: { $expr: 'concat("t=", round(time, 1), "s")' },
    })

    expect(validateMathExpressions(specWithTextExpr)).toBe(true)

    // With invalid expression in text
    specWithTextExpr.stage.elements[specWithTextExpr.stage.elements.length - 1].text = {
      $expr: 'invalid++math(',
    }
    expect(validateMathExpressions(specWithTextExpr)).toBe(false)
  })

  it('returns true for non-simulatable specs without stage', () => {
    const nonSimSpec = {
      ...physicsFixture,
      isSimulatable: false,
      stage: undefined,
    }
    expect(validateMathExpressions(nonSimSpec)).toBe(true)
  })
})

describe('Ingest Service: triageCandidates', () => {
  it('discards candidates with importance < 6', () => {
    const candidates: Candidate[] = [
      { ...physicsFixture, importance: 5 },
      { ...physicsFixture, importance: 4 },
      { ...physicsFixture, importance: 7 },
    ]

    const result = triageCandidates(candidates)
    expect(result).toHaveLength(1)
    expect(result[0].importance).toBe(7)
  })

  it('sorts candidates in descending order of importance', () => {
    const candidates: Candidate[] = [
      { ...physicsFixture, title: 'Low', importance: 6 },
      { ...physicsFixture, title: 'High', importance: 10 },
      { ...physicsFixture, title: 'Mid', importance: 8 },
    ]

    const result = triageCandidates(candidates)
    expect(result.map((c) => c.title)).toEqual(['High', 'Mid', 'Low'])
  })

  it('caps output at top 3 candidates', () => {
    const candidates: Candidate[] = [
      { ...physicsFixture, title: 'One', importance: 10 },
      { ...physicsFixture, title: 'Two', importance: 9 },
      { ...physicsFixture, title: 'Three', importance: 8 },
      { ...physicsFixture, title: 'Four', importance: 7 },
      { ...physicsFixture, title: 'Five', importance: 6 },
    ]

    const result = triageCandidates(candidates)
    expect(result).toHaveLength(3)
    expect(result.map((c) => c.title)).toEqual(['One', 'Two', 'Three'])
  })
})

describe('Ingest Service: computeContentHash', () => {
  it('generates a 16-character hex hash', () => {
    const hash = computeContentHash('This is a test page content for kinematics.')
    expect(hash).toHaveLength(16)
    expect(/^[0-9a-f]{16}$/.test(hash)).toBe(true)
  })

  it('is deterministic for identical content', () => {
    const text = 'Identical page text with formulas.'
    expect(computeContentHash(text)).toBe(computeContentHash(text))
  })

  it('generates different hashes for different texts', () => {
    const hashA = computeContentHash('Text A')
    const hashB = computeContentHash('Text B')
    expect(hashA).not.toBe(hashB)
  })
})
