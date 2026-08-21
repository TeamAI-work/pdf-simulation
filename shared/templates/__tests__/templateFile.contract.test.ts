import { describe, it, expect } from 'vitest'
import { SIM_REGISTRY, TEMPLATE_IDS } from '../sims/index.js'
import { TEMPLATE_CATALOG } from '../catalog.js'

describe('template file contract', () => {
  it('every sim has a unique id, keywords, and at least one param', () => {
    const ids = TEMPLATE_IDS
    expect(new Set(ids).size).toBe(ids.length)

    for (const id of ids) {
      const sim = SIM_REGISTRY[id]
      expect(sim.id).toBe(id)
      expect(sim.keywords.length).toBeGreaterThanOrEqual(3)
      expect(sim.params.length).toBeGreaterThanOrEqual(1)
      expect(TEMPLATE_CATALOG[id].params.length).toBe(sim.params.length)
      const keys = sim.params.map((p) => p.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it('choice params list unique option values and a default that is one of them', () => {
    for (const id of TEMPLATE_IDS) {
      for (const def of SIM_REGISTRY[id].params) {
        if (!def.options?.length) continue
        const values = def.options.map((o) => o.value)
        expect(new Set(values).size).toBe(values.length)
        expect(values).toContain(def.defaultValue)
        expect(def.min).toBe(Math.min(...values))
        expect(def.max).toBe(Math.max(...values))
      }
    }
  })
})
