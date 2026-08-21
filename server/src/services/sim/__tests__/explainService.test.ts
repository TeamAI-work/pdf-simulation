// server/src/services/sim/__tests__/explainService.test.ts

import { describe, it, expect } from 'vitest'
import {
  generateProceduralStudentExplanation,
  generateProceduralSelectionExplanation,
  generateStudentExplanation,
  generateProceduralChatReply,
  generateProceduralSimBrief,
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

  it('procedural chat reply uses the last user turn and book context', () => {
    const result = generateProceduralChatReply(
      [
        { role: 'user', content: 'What is inertia?' },
        { role: 'assistant', content: 'Inertia resists changes in motion.' },
        { role: 'user', content: 'How does friction change that?' },
      ],
      { title: 'Physics 101', parentTopic: 'Newton laws', domain: 'physics' }
    )

    expect(result.reply).toContain('How does friction change that?')
    expect(result.reply).toContain('Newton laws')
    expect(result.reply).toContain('| Piece |')
    expect(result.keyTakeaways?.length).toBeGreaterThan(0)
  })

  it('procedural sim brief covers what it is and how it works', () => {
    const result = generateProceduralSimBrief(testSpec, testSpec.quote)
    expect(result.about).toContain('Harmonic Oscillator')
    expect(result.howItWorks.length).toBeGreaterThan(40)
    expect(result.howItWorks).toContain('Hooke')
  })

  it('mentions extracted textbook params such as 20 m/s', () => {
    const spec: SimSpec = {
      ...testSpec,
      templateId: 'projectile_2d',
      params: { v0: 20, angleDeg: 45, h0: 0, g: 9.81 },
      paramMeta: {
        v0: { source: 'extracted', unit: 'm/s' },
        angleDeg: { source: 'extracted' },
        h0: { source: 'default' },
        g: { source: 'default' },
      },
    }
    const result = generateProceduralStudentExplanation(spec, spec.quote, 'standard', undefined, {
      range: 40.77,
    })
    expect(result.keyTakeaways.join(' ')).toContain('20')
    expect(result.keyTakeaways.join(' ')).toContain('from the textbook')
    expect(result.keyTakeaways.join(' ')).toContain('range = 40.77')
  })
})

