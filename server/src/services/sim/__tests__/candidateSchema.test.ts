import { describe, it, expect } from 'vitest'
import { CandidateSchema, CandidateListSchema } from '../candidateSchema.js'
import { physicsFixture, chemistryFixture } from '@pdf-sim/shared'

describe('CandidateSchema', () => {
  it('validates a correct Candidate with importance score', () => {
    const validCandidate = {
      ...physicsFixture,
      importance: 9,
    }

    const result = CandidateSchema.safeParse(validCandidate)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.importance).toBe(9)
      expect(result.data.title).toBe(physicsFixture.title)
    }
  })

  it('rejects importance scores outside 1-10 range', () => {
    const low = { ...physicsFixture, importance: 0 }
    const high = { ...physicsFixture, importance: 11 }

    expect(CandidateSchema.safeParse(low).success).toBe(false)
    expect(CandidateSchema.safeParse(high).success).toBe(false)
  })

  it('rejects candidate with isSimulatable=true and empty stage elements', () => {
    const invalid = {
      ...physicsFixture,
      importance: 7,
      isSimulatable: true,
      stage: {
        viewBox: '0 0 500 300',
        elements: [],
      },
    }

    expect(CandidateSchema.safeParse(invalid).success).toBe(false)
  })
})

describe('CandidateListSchema', () => {
  it('accepts array with up to 3 valid candidates', () => {
    const list = [
      { ...physicsFixture, importance: 8 },
      { ...chemistryFixture, importance: 7 },
    ]

    const result = CandidateListSchema.safeParse(list)
    expect(result.success).toBe(true)
  })

  it('rejects array with more than 3 candidates', () => {
    const list = [
      { ...physicsFixture, importance: 8 },
      { ...chemistryFixture, importance: 7 },
      { ...physicsFixture, importance: 6 },
      { ...chemistryFixture, importance: 5 },
    ]

    const result = CandidateListSchema.safeParse(list)
    expect(result.success).toBe(false)
  })
})
