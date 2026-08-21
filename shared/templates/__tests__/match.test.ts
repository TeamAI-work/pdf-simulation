import { describe, it, expect } from 'vitest'
import { matchTemplateFromText } from '../match.js'

describe('matchTemplateFromText — NCERT-like quotes', () => {
  it('st_vt_graph from rest, a = 2, 5 s', () => {
    const m = matchTemplateFromText(
      'A body starts from rest and moves with acceleration 2 m/s². Draw the s–t and v–t graphs for 5 s.'
    )
    expect(m?.templateId).toBe('st_vt_graph')
    expect(m?.params.u).toBe(0)
    expect(m?.params.a).toBe(2)
    expect(m?.params.tMax).toBe(5)
  })

  it('vi_graph beats generic Ohm', () => {
    const m = matchTemplateFromText('The V–I graph for a resistor of 4 Ω is drawn up to 12 V.')
    expect(m?.templateId).toBe('vi_graph')
    expect(m?.params.R).toBe(4)
    expect(m?.params.Vmax).toBe(12)
  })

  it('series_parallel series 2 Ω and 3 Ω on 10 V', () => {
    const m = matchTemplateFromText(
      'Two resistors of 2 Ω and 3 Ω are connected in series across a 10 V battery.'
    )
    expect(m?.templateId).toBe('series_parallel')
    expect(m?.params.R1).toBe(2)
    expect(m?.params.R2).toBe(3)
    expect(m?.params.V).toBe(10)
    expect(m?.params.mode).toBe(0)
  })

  it('AP keywords beat motion a', () => {
    const m = matchTemplateFromText(
      'An A.P. has first term a = 2, common difference d = 3 and n = 5 terms.'
    )
    expect(m?.templateId).toBe('ap_graph')
    expect(m?.params.a).toBe(2)
    expect(m?.params.d).toBe(3)
    expect(m?.params.n).toBe(5)
  })

  it('section_formula midpoint 1:1', () => {
    const m = matchTemplateFromText(
      'Find the point that divides the join of (0, 0) and (4, 2) internally in the ratio 1:1.'
    )
    expect(m?.templateId).toBe('section_formula')
    expect(m?.params.x1).toBe(0)
    expect(m?.params.y1).toBe(0)
    expect(m?.params.x2).toBe(4)
    expect(m?.params.y2).toBe(2)
    expect(m?.params.m).toBe(1)
    expect(m?.params.n).toBe(1)
  })

  it('ph_strip from pH = 3', () => {
    const m = matchTemplateFromText('A solution has pH = 3 on the universal indicator scale.')
    expect(m?.templateId).toBe('ph_strip')
    expect(m?.params.pH).toBe(3)
  })

  it('echo from a cliff 340 m, v = 340 m/s', () => {
    const m = matchTemplateFromText(
      'An echo is heard from a cliff 340 m away. Speed of sound is 340 m/s.'
    )
    expect(m?.templateId).toBe('echo')
    expect(m?.params.distance).toBe(340)
    expect(m?.params.vSound).toBe(340)
  })

  it('equation_balance 2x + 3 = 11', () => {
    const m = matchTemplateFromText('Solve 2x + 3 = 11')
    expect(m?.templateId).toBe('equation_balance')
    expect(m?.params.coeff).toBe(2)
    expect(m?.params.addend).toBe(3)
    expect(m?.params.rhs).toBe(11)
  })

  it('probability_spinner favourable / total', () => {
    const m = matchTemplateFromText('A spinner has 2 favourable outcomes out of 6 equally likely.')
    expect(m?.templateId).toBe('probability_spinner')
    expect(m?.params.favorable).toBe(2)
    expect(m?.params.total).toBe(6)
  })

  it('pressure_area F and A', () => {
    const m = matchTemplateFromText('A force of 10 N acts on an area of 2 m². Find the pressure.')
    expect(m?.templateId).toBe('pressure_area')
    expect(m?.params.force).toBe(10)
    expect(m?.params.area).toBe(2)
  })

  it('reactivity_swap zinc vs copper', () => {
    const m = matchTemplateFromText('Zinc is added to copper sulphate solution.')
    expect(m?.templateId).toBe('reactivity_swap')
    expect(m?.params.metalA).toBe(2)
    expect(m?.params.metalB).toBe(4)
  })

  it('parallel mode is 1', () => {
    const m = matchTemplateFromText(
      'Two resistors of 2 Ω and 3 Ω are connected in parallel across a 10 V battery.'
    )
    expect(m?.templateId).toBe('series_parallel')
    expect(m?.params.mode).toBe(1)
  })
})
