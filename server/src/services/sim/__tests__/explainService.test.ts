// server/src/services/sim/__tests__/explainService.test.ts

import { describe, it, expect } from 'vitest'
import {
  generateProceduralStudentExplanation,
  generateProceduralSelectionExplanation,
  generateStudentExplanation,
} from '../explainService.js'
import type { SimSpec } from '@pdf-sim/shared'

describe('Student Explanation Service', () => {
  const testSpec: SimSpec = {
    version: '2.0',
    title: 'Harmonic Oscillator & Resonance',
    subtitle: 'Mass on a spring undergoing periodic motion',
    domain: 'physics',
    parentTopic: 'Classical Mechanics',
    topicExplanation: 'Periodic motion around a stable equilibrium point driven by restoring forces.',
    caption: 'The oscillating mass exchanges potential and kinetic energy continuously.',
    isSimulatable: true,
    reasonIfNotSimulatable: '',
    quote: 'Hooke law states restoring force is proportional to displacement: F = -kx.',
    equations: ['F = -kx', 'x(t) = A \\cos(\\omega t + \\phi)', '\\omega = \\sqrt{k/m}'],
    stage: {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'spring-coil',
          type: 'spring',
          role: 'none',
          props: { x1: 50, y1: 150, x2: 250, y2: 150 },
        },
        {
          id: 'bob-mass',
          type: 'circle',
          role: 'projectile',
          props: { cx: { $expr: '250 + 80*cos(time*3)' }, cy: 150, r: 16 },
        },
      ],
    },
  }

  it('generates procedural student explanation with complete pedagogical structure', () => {
    const result = generateProceduralStudentExplanation(testSpec, testSpec.quote, 'standard')

    expect(result.summary).toBeDefined()
    expect(result.intuition.length).toBeGreaterThan(0)
    expect(result.animationGuide.length).toBeGreaterThan(0)
    expect(result.equationBreakdown.length).toBe(3)
    expect(result.equationBreakdown[0].formula).toBe('F = -kx')
    expect(result.equationBreakdown[0].variables.some((v) => v.symbol === 'F')).toBe(true)
    expect(result.thoughtExperiment.question).toBeDefined()
    expect(result.thoughtExperiment.answer).toBeDefined()
    expect(result.keyTakeaways.length).toBe(3)
  })

  it('adapts explanation for beginner mode', () => {
    const result = generateProceduralStudentExplanation(testSpec, testSpec.quote, 'beginner')
    expect(result.intuition.some((p) => p.includes('Imagine'))).toBe(true)
  })

  it('handles custom tutor question in procedural explanation', () => {
    const result = generateProceduralStudentExplanation(
      testSpec,
      testSpec.quote,
      'standard',
      'What happens if we make the spring stiffer (increase k)?'
    )
    expect(result.tutorAnswer).toBeDefined()
    expect(result.tutorAnswer).toContain('What happens if we make the spring stiffer')
  })

  it('generates student explanation gracefully via main service function', async () => {
    const result = await generateStudentExplanation({
      spec: testSpec,
      quote: testSpec.quote,
      mode: 'standard',
    })
    expect(result.summary).toBeDefined()
    expect(result.intuition.length).toBeGreaterThan(0)
    expect(result.keyTakeaways.length).toBeGreaterThan(0)
  })

  it('generates explanation for user-selected text snippet with context', async () => {
    const result = await generateProceduralSelectionExplanation({
      selectedText: 'Hooke law restoring force',
      surroundingContext: 'A body oscillating on a spring obeys Hooke law restoring force proportional to displacement.',
      parentTopic: 'Simple Harmonic Motion',
      domain: 'physics',
      mode: 'standard',
    })

    expect(result.selectedText).toBe('Hooke law restoring force')
    expect(result.conceptTitle).toContain('Simple Harmonic Motion')
    expect(result.summary).toBeDefined()
    expect(result.detailedExplanation.length).toBeGreaterThan(0)
    expect(result.keyTakeaways.length).toBeGreaterThan(0)
  })
})

