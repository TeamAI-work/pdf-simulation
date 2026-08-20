import { describe, it, expect } from 'vitest'
import { createCompiledSpec, evalSpec } from '../evalSpec.js'
import type { SimStage } from '@pdf-sim/shared'

describe('evalSpec Renderer Engine', () => {
  it('passes hex colours and plain text through byte-identical without math parsing', () => {
    const stage: SimStage = {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'card',
          type: 'rect',
          role: 'none',
          props: {
            fill: '#38bdf8',
            stroke: '#1e293b',
            width: 200,
          },
          text: 'Static Label',
        },
      ],
    }

    const compiled = createCompiledSpec(stage)
    const resolved = evalSpec(compiled, 0)

    expect(resolved.elements[0].props.fill).toBe('#38bdf8')
    expect(resolved.elements[0].props.stroke).toBe('#1e293b')
    expect(resolved.elements[0].props.width).toBe(200)
    expect(resolved.elements[0].text).toBe('Static Label')
  })

  it('evaluates sin(time)*100 at time=1.5708 to ~100', () => {
    const stage: SimStage = {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'sine-ball',
          type: 'circle',
          role: 'projectile',
          props: {
            cy: { $expr: 'sin(time) * 100' },
          },
        },
      ],
    }

    const compiled = createCompiledSpec(stage)
    const resolved = evalSpec(compiled, 1.5708) // approx pi/2

    const cy = resolved.elements[0].props.cy
    expect(cy).toBeCloseTo(100, 1)
  })

  it('evaluates power (time^2) and modulo (time % 4) expressions', () => {
    const stage: SimStage = {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'particle',
          type: 'circle',
          role: 'projectile',
          props: {
            cx: { $expr: 'time^2' },
            cy: { $expr: 'time % 4' },
          },
        },
      ],
    }

    const compiled = createCompiledSpec(stage)
    const resolvedAt3 = evalSpec(compiled, 3)

    expect(resolvedAt3.elements[0].props.cx).toBe(9)
    expect(resolvedAt3.elements[0].props.cy).toBe(3)

    const resolvedAt5 = evalSpec(compiled, 5)
    expect(resolvedAt5.elements[0].props.cx).toBe(25)
    expect(resolvedAt5.elements[0].props.cy).toBe(1)
  })

  it('safely returns 0 for unknown variables without throwing or crashing', () => {
    const stage: SimStage = {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'bad-elem',
          type: 'rect',
          role: 'none',
          props: {
            x: { $expr: 'unknownVar * 10' },
          },
        },
      ],
    }

    const compiled = createCompiledSpec(stage)
    const resolved = evalSpec(compiled, 2)

    expect(resolved.elements[0].props.x).toBe(0)
  })

  it('evaluates dynamic text expressions', () => {
    const stage: SimStage = {
      viewBox: '0 0 500 300',
      elements: [
        {
          id: 'timer',
          type: 'text',
          role: 'none',
          props: { x: 50, y: 50 },
          text: { $expr: 'concat("t = ", round(time, 1), " s")' },
        },
      ],
    }

    const compiled = createCompiledSpec(stage)
    const resolved = evalSpec(compiled, 2.456)

    expect(resolved.elements[0].text).toBe('t = 2.5 s')
  })
})
