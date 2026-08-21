import { describe, it, expect } from 'vitest'
import { bindTemplate, createTemplateSpec } from './bind.js'
import { analyticFlatRange, solveCollision1d, solveProjectile } from './physics.js'
import { isTemplateId, parseTemplateParams, randomizeTemplateParams, TEMPLATE_CATALOG, TEMPLATE_IDS } from './catalog.js'
import { matchTemplateFromText } from './match.js'

describe('bindTemplate projectile accuracy', () => {
  it('matches flat-ground analytic range for 20 m/s at 45°', () => {
    const v0 = 20
    const angleDeg = 45
    const g = 9.81
    const bound = bindTemplate('projectile_2d', { v0, angleDeg, h0: 0, g })
    const expected = analyticFlatRange(v0, angleDeg, g)
    const sol = solveProjectile(v0, angleDeg, 0, g)
    expect(sol.range).toBeCloseTo(expected, 5)
    expect(bound.metrics.range as number).toBeCloseTo(expected, 2)
    expect(bound.metrics.flightTime as number).toBeCloseTo(sol.flightTime, 3)
    expect(bound.warnings).toHaveLength(0)
    expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
    expect(bound.spec.templateId).toBe('projectile_2d')
  })

  it('uses textbook params rather than silently replacing them', () => {
    const bound = bindTemplate('projectile_2d', { v0: 28, angleDeg: 30, h0: 2, g: 9.81 })
    expect(bound.spec.params?.v0).toBe(28)
    expect(bound.spec.params?.angleDeg).toBe(30)
    expect(bound.spec.params?.h0).toBe(2)
  })
})

describe('bindTemplate collision energy', () => {
  it('conserves kinetic energy when e = 1', () => {
    const bound = bindTemplate('collision_1d', { m1: 2, m2: 3, u1: 6, u2: -2, e: 1 })
    const sol = solveCollision1d(2, 3, 6, -2, 1)
    expect(bound.metrics.energyLoss as number).toBeCloseTo(0, 5)
    expect(bound.metrics.keAfter as number).toBeCloseTo(sol.keBefore, 5)
  })

  it('loses energy when e = 0 (perfectly inelastic)', () => {
    const bound = bindTemplate('collision_1d', { m1: 2, m2: 2, u1: 8, u2: -4, e: 0 })
    expect(bound.metrics.energyLoss as number).toBeGreaterThan(0)
    expect(bound.metrics.v1).toBe(bound.metrics.v2)
  })
})

describe('bindTemplate ramp', () => {
  it('slides at 30° with μ=0 at a = g/2 and stays put when μ is too large', () => {
    const ice = bindTemplate('ramp_friction', { angleDeg: 30, mu: 0, mass: 5 })
    expect(ice.metrics.willSlide).toBe(true)
    expect(ice.metrics.acceleration as number).toBeCloseTo(9.81 / 2, 3)
    const stuck = bindTemplate('ramp_friction', { angleDeg: 30, mu: 1, mass: 5 })
    expect(stuck.metrics.willSlide).toBe(false)
    expect(stuck.metrics.acceleration).toBe(0)
  })
})

describe('createTemplateSpec', () => {
  it('stores templateId + params without a stage', () => {
    const spec = createTemplateSpec('free_fall', { h0: 12 })
    expect(spec.templateId).toBe('free_fall')
    expect(spec.params?.h0).toBe(12)
    expect(spec.params?.g).toBe(9.81)
    expect(spec.stage).toBeUndefined()
    expect(spec.isSimulatable).toBe(true)
  })
})

describe('parseTemplateParams', () => {
  it('fills defaults for missing keys', () => {
    const { params, paramMeta } = parseTemplateParams('projectile_2d', { v0: 15 })
    expect(params.v0).toBe(15)
    expect(params.angleDeg).toBe(45)
    expect(paramMeta.v0?.source).toBe('extracted')
    expect(paramMeta.angleDeg?.source).toBe('default')
  })
})

describe('isTemplateId', () => {
  it('accepts catalog ids and rejects unknown', () => {
    expect(isTemplateId('projectile_2d')).toBe(true)
    expect(isTemplateId('wormhole')).toBe(false)
  })
})

describe('randomizeTemplateParams', () => {
  it('stays inside slider min/max for every catalog template', () => {
    for (const id of TEMPLATE_IDS) {
      const params = randomizeTemplateParams(id)
      for (const def of TEMPLATE_CATALOG[id].params) {
        expect(params[def.key]).toBeGreaterThanOrEqual(def.min)
        expect(params[def.key]).toBeLessThanOrEqual(def.max)
      }
    }
  })
})

describe('catalog coverage', () => {
  it('keeps known templates and only allows physics, chemistry, math domains', () => {
    expect(TEMPLATE_IDS).toContain('projectile_2d')
    expect(TEMPLATE_IDS.length).toBeGreaterThanOrEqual(41)
    expect(new Set(TEMPLATE_IDS).size).toBe(TEMPLATE_IDS.length)
    const domains = TEMPLATE_IDS.map((id) => TEMPLATE_CATALOG[id].domain)
    expect(domains.every((d) => d === 'physics' || d === 'chemistry' || d === 'math')).toBe(true)
  })

  it('runs every sim file to a valid stage from defaults', () => {
    for (const id of TEMPLATE_IDS) {
      const bound = bindTemplate(id, {})
      expect(bound.spec.isSimulatable).toBe(true)
      expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
      expect(bound.spec.templateId).toBe(id)
      expect(bound.spec.domain).toBe(TEMPLATE_CATALOG[id].domain)
      for (const def of TEMPLATE_CATALOG[id].params) {
        expect(bound.spec.paramMeta?.[def.key]?.source).toBe('default')
      }
    }
  })

  it('marks extracted book values vs defaults', () => {
    const spec = createTemplateSpec('snell_refraction', { n1: 1, theta1: 30 })
    expect(spec.paramMeta?.n1?.source).toBe('extracted')
    expect(spec.paramMeta?.n2?.source).toBe('default')
    expect(spec.params?.n2).toBe(1.5)
    expect(spec.stage).toBeUndefined()
  })
})

describe('matchTemplateFromText', () => {
  it('maps a projectile sentence to projectile_2d with extracted numbers', () => {
    const m = matchTemplateFromText('A ball is thrown at 20 m/s at 45 degrees.')
    expect(m?.templateId).toBe('projectile_2d')
    expect(m?.params.v0).toBe(20)
    expect(m?.params.angleDeg).toBe(45)
  })

  it('maps chemistry and maths textbook lines', () => {
    expect(matchTemplateFromText('Kinetic theory of gas particles at 400 K')?.templateId).toBe(
      'kinetic_particles'
    )
    expect(matchTemplateFromText('Shade the fraction 3/5 on the bar')?.templateId).toBe('fraction_bar')
    expect(matchTemplateFromText('Snell refraction at the air to glass boundary')?.templateId).toBe(
      'snell_refraction'
    )
  })

  it('returns null when no keyword matches', () => {
    expect(matchTemplateFromText('Photosynthesis in green leaves')).toBeNull()
  })
})

describe('phase 1 graph templates', () => {
  it('st_vt_graph uses u=0, a=2, tMax=5 → sMax 25 and vEnd 10', () => {
    const bound = bindTemplate('st_vt_graph', { u: 0, a: 2, tMax: 5 })
    expect(bound.spec.params?.u).toBe(0)
    expect(bound.spec.params?.a).toBe(2)
    expect(bound.metrics.sMax).toBe(25)
    expect(bound.metrics.vEnd).toBe(10)
    expect(bound.spec.stage?.elements.length).toBeGreaterThan(0)
  })

  it('vi_graph uses R=4, Vmax=12 → I = 3', () => {
    const bound = bindTemplate('vi_graph', { R: 4, Vmax: 12 })
    expect(bound.spec.params?.R).toBe(4)
    expect(bound.metrics.I_at_Vmax).toBe(3)
    expect(bound.metrics.slope).toBe(0.25)
  })

  it('ap_graph uses a=2, d=3, n=5 → tn 14 and Sn 40', () => {
    const bound = bindTemplate('ap_graph', { a: 2, d: 3, n: 5 })
    expect(bound.metrics.tn).toBe(14)
    expect(bound.metrics.Sn).toBe(40)
  })

  it('bar_chart hides zero bars and totals the rest', () => {
    const bound = bindTemplate('bar_chart', { v1: 8, v2: 12, v3: 5, v4: 0, v5: 0 })
    expect(bound.metrics.total).toBe(25)
    expect(bound.metrics.max).toBe(12)
  })
})

describe('phase 2A geometry templates', () => {
  it('section_formula 1:1 from (0,0) to (4,2) is the midpoint (2,1)', () => {
    const bound = bindTemplate('section_formula', { x1: 0, y1: 0, x2: 4, y2: 2, m: 1, n: 1 })
    expect(bound.metrics.x).toBe(2)
    expect(bound.metrics.y).toBe(1)
  })

  it('section_formula drawn P splits AB in m:n', () => {
    const bound = bindTemplate('section_formula', { x1: 0, y1: 0, x2: 6, y2: 0, m: 2, n: 1 })
    expect(bound.metrics.x).toBe(4)
    const A = bound.spec.stage?.elements.find((el) => el.id === 'A')
    const B = bound.spec.stage?.elements.find((el) => el.id === 'B')
    const P = bound.spec.stage?.elements.find((el) => el.id === 'R')
    const ax = Number(A?.props.cx)
    const bx = Number(B?.props.cx)
    const px = Number(P?.props.cx)
    expect((px - ax) / (bx - ax)).toBeCloseTo(2 / 3, 3)
  })

  it('triangle_angles computes C = 180 − A − B and warns when invalid', () => {
    const ok = bindTemplate('triangle_angles', { A: 50, B: 60 })
    expect(ok.metrics.C).toBe(70)
    expect(ok.warnings).toHaveLength(0)
    const bad = bindTemplate('triangle_angles', { A: 100, B: 90 })
    expect(bad.metrics.C).toBe(-10)
    expect(bad.warnings.length).toBeGreaterThan(0)
  })

  it('triangle_angles drawn angle at A matches slider (tall 80-80-20 is not squashed)', () => {
    const bound = bindTemplate('triangle_angles', { A: 80, B: 80 })
    const ab = bound.spec.stage?.elements.find((el) => el.id === 'ab')
    const ca = bound.spec.stage?.elements.find((el) => el.id === 'ca')
    expect(ab?.type).toBe('line')
    expect(ca?.type).toBe('line')
    const Ax = Number(ab?.props.x1)
    const Ay = Number(ab?.props.y1)
    const Bx = Number(ab?.props.x2)
    const By = Number(ab?.props.y2)
    const Cx = Number(ca?.props.x1)
    const Cy = Number(ca?.props.y1)
    const angAB = (Math.atan2(-(By - Ay), Bx - Ax) * 180) / Math.PI
    const angAC = (Math.atan2(-(Cy - Ay), Cx - Ax) * 180) / Math.PI
    let diff = angAC - angAB
    while (diff < 0) diff += 360
    while (diff >= 360) diff -= 360
    expect(diff).toBeCloseTo(80, 0)
  })

  it('quadrilateral_live D = 360 − A − B − C and drawn angle A matches', () => {
    const ok = bindTemplate('quadrilateral_live', { A: 80, B: 100, C: 90 })
    expect(ok.metrics.D).toBe(90)
    expect(ok.warnings).toHaveLength(0)
    const ab = ok.spec.stage?.elements.find((el) => el.id === 'ab')
    const da = ok.spec.stage?.elements.find((el) => el.id === 'da')
    const Ax = Number(ab?.props.x1)
    const Ay = Number(ab?.props.y1)
    const Bx = Number(ab?.props.x2)
    const By = Number(ab?.props.y2)
    const Dx = Number(da?.props.x1)
    const Dy = Number(da?.props.y1)
    const angAB = (Math.atan2(-(By - Ay), Bx - Ax) * 180) / Math.PI
    const angAD = (Math.atan2(-(Dy - Ay), Dx - Ax) * 180) / Math.PI
    let diff = angAD - angAB
    while (diff < 0) diff += 360
    while (diff >= 360) diff -= 360
    expect(diff).toBeCloseTo(80, 0)
    const bad = bindTemplate('quadrilateral_live', { A: 150, B: 150, C: 150 })
    expect(bad.metrics.D).toBe(-90)
    expect(bad.warnings.length).toBeGreaterThan(0)
  })

  it('circle_tangent length is 4 for r=3, d=5 and warns when inside', () => {
    const ok = bindTemplate('circle_tangent', { r: 3, d: 5 })
    expect(ok.metrics.length).toBe(4)
    expect(ok.metrics.real).toBe(true)
    const oa = ok.spec.stage?.elements.find((el) => el.id === 'oa')
    const pa = ok.spec.stage?.elements.find((el) => el.id === 'pa')
    const ox = Number(oa?.props.x1)
    const oy = Number(oa?.props.y1)
    const ax = Number(oa?.props.x2)
    const ay = Number(oa?.props.y2)
    const px = Number(pa?.props.x1)
    const py = Number(pa?.props.y1)
    expect((ax - ox) * (ax - px) + (ay - oy) * (ay - py)).toBeCloseTo(0, 4)
    const inside = bindTemplate('circle_tangent', { r: 5, d: 3 })
    expect(inside.metrics.real).toBe(false)
    expect(inside.warnings.length).toBeGreaterThan(0)
  })

  it('angle_pair reports complement and supplement', () => {
    const bound = bindTemplate('angle_pair', { angleDeg: 30 })
    expect(bound.metrics.complement).toBe(60)
    expect(bound.metrics.supplement).toBe(150)
  })
})

describe('phase 2B number and data templates', () => {
  it('identity_tiles a=3, b=2 → (a+b)² = 25', () => {
    const bound = bindTemplate('identity_tiles', { a: 3, b: 2 })
    expect(bound.metrics.expanded).toBe(25)
  })

  it('equation_balance 2x + 3 = 11 → x = 4', () => {
    const bound = bindTemplate('equation_balance', { coeff: 2, addend: 3, rhs: 11 })
    expect(bound.metrics.x).toBe(4)
  })

  it('probability_spinner clamps favourable and reports P', () => {
    const bound = bindTemplate('probability_spinner', { favorable: 2, total: 6 })
    expect(bound.metrics.P).toBeCloseTo(1 / 3, 3)
    const clamped = bindTemplate('probability_spinner', { favorable: 9, total: 6 })
    expect(clamped.metrics.favorable).toBe(6)
    expect(clamped.metrics.P).toBe(1)
  })

  it('clock_hands at 3:00 is 90°', () => {
    const bound = bindTemplate('clock_hands', { hours: 3, minutes: 0 })
    expect(bound.metrics.angle).toBe(90)
  })
})

describe('phase 3 physics templates', () => {
  it('shadow_light similar triangles H/h = D/u', () => {
    const bound = bindTemplate('shadow_light', { objectHeight: 10, sourceDistance: 40 })
    expect(bound.metrics.D).toBe(120)
    expect(bound.metrics.shadowHeight).toBe(30)
  })

  it('ohm_circuit V=6, R=3 → I = 2', () => {
    const bound = bindTemplate('ohm_circuit', { V: 6, R: 3 })
    expect(bound.metrics.I).toBe(2)
    const types = (bound.spec.stage?.elements ?? []).map((el) => el.type)
    expect(types).toContain('path')
    expect(types.filter((t) => t === 'circle').length).toBeGreaterThanOrEqual(5)
  })

  it('series_parallel series R1=2, R2=3, V=10 → I = 2', () => {
    const bound = bindTemplate('series_parallel', { V: 10, R1: 2, R2: 3, mode: 0 })
    expect(bound.metrics.Req).toBe(5)
    expect(bound.metrics.I).toBe(2)
    expect(bound.metrics.I1).toBe(2)
    expect(bound.metrics.I2).toBe(2)
  })

  it('series_parallel parallel equal 2 Ω on 10 V → Req = 1, I = 10', () => {
    const bound = bindTemplate('series_parallel', { V: 10, R1: 2, R2: 2, mode: 1 })
    expect(bound.metrics.Req).toBe(1)
    expect(bound.metrics.I).toBe(10)
    expect(bound.metrics.I1).toBe(5)
    expect(bound.metrics.I2).toBe(5)
  })

  it('echo d=340, v=340 → t = 2', () => {
    const bound = bindTemplate('echo', { distance: 340, vSound: 340 })
    expect(bound.metrics.t).toBe(2)
    const wall = bound.spec.stage?.elements.find((el) => el.id === 'wall')
    const pulse = bound.spec.stage?.elements.find((el) => el.id === 'pulse')
    expect(wall?.type).toBe('line')
    expect(pulse?.role).toBe('projectile')
  })

  it('pressure_area F=10, A=2 → P = 5', () => {
    const bound = bindTemplate('pressure_area', { force: 10, area: 2 })
    expect(bound.metrics.P).toBe(5)
  })

  it('heating_effect I=2, R=3, t=4 → H = 48', () => {
    const bound = bindTemplate('heating_effect', { I: 2, R: 3, t: 4 })
    expect(bound.metrics.H).toBe(48)
  })

  it('work_fs F=10, s=2, θ=0 → W = 20', () => {
    const bound = bindTemplate('work_fs', { force: 10, s: 2, angleDeg: 0 })
    expect(bound.metrics.W).toBe(20)
  })

  it('work_fs θ=90° → W = 0', () => {
    const bound = bindTemplate('work_fs', { force: 10, s: 2, angleDeg: 90 })
    expect(bound.metrics.W).toBeCloseTo(0, 8)
    const els = bound.spec.stage?.elements ?? []
    expect(els.some((el) => el.id === 'F')).toBe(true)
    expect(els.some((el) => el.id === 's')).toBe(true)
    expect(els.some((el) => el.id === 'th-arc')).toBe(true)
  })

  it('prism A=6, μ=1.5 → δ = 3', () => {
    const bound = bindTemplate('prism', { A: 6, mu: 1.5 })
    expect(bound.metrics.delta).toBe(3)
    const els = bound.spec.stage?.elements ?? []
    expect(els.filter((el) => el.id.startsWith('out-'))).toHaveLength(7)
    expect(els.some((el) => el.id === 'in')).toBe(true)
    expect(els.some((el) => el.id === 'inside')).toBe(true)
    const p1 = els.find((el) => el.id === 'p1')
    const p2 = els.find((el) => el.id === 'p2')
    expect(Number(p1?.props.cx)).not.toBe(Number(p2?.props.cx))
  })

  it('prism second-face hit stays put between μ=1.50 and 1.54', () => {
    const a = bindTemplate('prism', { A: 6, mu: 1.5 })
    const b = bindTemplate('prism', { A: 6, mu: 1.54 })
    const p2a = a.spec.stage?.elements.find((el) => el.id === 'p2')
    const p2b = b.spec.stage?.elements.find((el) => el.id === 'p2')
    expect(Number(p2a?.props.cx)).toBeCloseTo(Number(p2b?.props.cx), 5)
    expect(Number(p2a?.props.cy)).toBeCloseTo(Number(p2b?.props.cy), 5)
    expect(a.spec.stage?.elements.filter((el) => el.id.startsWith('out-'))).toHaveLength(7)
    expect(b.spec.stage?.elements.filter((el) => el.id.startsWith('out-'))).toHaveLength(7)
  })

  it('solenoid nI = turns × I and draws that many windings', () => {
    const bound = bindTemplate('solenoid', { I: 5, turns: 8 })
    expect(bound.metrics.field).toBe(40)
    expect(bound.metrics.turns).toBe(8)
    const els = bound.spec.stage?.elements ?? []
    expect(els.filter((el) => el.id.startsWith('turn-'))).toHaveLength(8)
    expect(els.some((el) => el.id === 'N')).toBe(true)
    expect(els.some((el) => el.id === 'S')).toBe(true)
  })
})

describe('phase 4 chemistry templates', () => {
  it('catalog is 73 with 13 chemistry templates', () => {
    expect(TEMPLATE_IDS).toHaveLength(73)
    expect(TEMPLATE_IDS.filter((id) => TEMPLATE_CATALOG[id].domain === 'chemistry')).toHaveLength(13)
  })

  it('ph_strip pH 3 is acid', () => {
    const bound = bindTemplate('ph_strip', { pH: 3 })
    expect(bound.metrics.kind).toBe('acid')
    expect(bindTemplate('ph_strip', { pH: 7 }).metrics.kind).toBe('neutral')
    expect(bindTemplate('ph_strip', { pH: 10 }).metrics.kind).toBe('base')
  })

  it('separation_mix methods 0/1/2 are settle, filter, magnet', () => {
    expect(bindTemplate('separation_mix', { method: 0 }).metrics.name).toBe('sedimentation')
    expect(bindTemplate('separation_mix', { method: 1 }).metrics.name).toBe('filtration')
    expect(bindTemplate('separation_mix', { method: 2 }).metrics.name).toBe('magnetic separation')
    const filter = bindTemplate('separation_mix', { method: 1 })
    expect(filter.spec.stage?.elements.some((el) => el.id === 'funnel')).toBe(true)
    expect(filter.spec.stage?.elements.some((el) => el.id === 'residue')).toBe(true)
  })

  it('reactivity_swap Zn vs Cu displaces; Cu vs Zn does not', () => {
    const znCu = bindTemplate('reactivity_swap', { metalA: 2, metalB: 4 })
    expect(znCu.metrics.nameA).toBe('Zn')
    expect(znCu.metrics.nameB).toBe('Cu')
    expect(znCu.metrics.willDisplace).toBe(true)
    const cuZn = bindTemplate('reactivity_swap', { metalA: 4, metalB: 2 })
    expect(cuZn.metrics.willDisplace).toBe(false)
  })

  it('state_change_curve uses melting and boiling for the phase label', () => {
    expect(bindTemplate('state_change_curve', { T: -10, melting: 0, boiling: 100 }).metrics.phase).toBe('solid')
    expect(bindTemplate('state_change_curve', { T: 25, melting: 0, boiling: 100 }).metrics.phase).toBe('liquid')
    expect(bindTemplate('state_change_curve', { T: 120, melting: 0, boiling: 100 }).metrics.phase).toBe('gas')
  })

  it('electron_shells n=2 → 8 on L, 10 total, E=−3.4 eV', () => {
    const bound = bindTemplate('electron_shells', { n: 2 })
    expect(bound.metrics.n).toBe(2)
    expect(bound.metrics.r).toBe(4)
    expect(bound.metrics.electrons).toBe(8)
    expect(bound.metrics.total).toBe(10)
    expect(bound.metrics.E).toBeCloseTo(-3.4, 2)
    const eDots = (bound.spec.stage?.elements ?? []).filter((el) => el.id.startsWith('e-'))
    expect(eDots).toHaveLength(10)
  })

  it('electron_shells n=1 → 2 electrons on K', () => {
    const bound = bindTemplate('electron_shells', { n: 1 })
    expect(bound.metrics.electrons).toBe(2)
    expect(bound.metrics.total).toBe(2)
  })

  it('angle of elevation 30° and d=20 → h = 20/√3', () => {
    const bound = bindTemplate('angle_of_elevation', { angleDeg: 30, distance: 20 })
    expect(bound.metrics.height).toBeCloseTo(20 / Math.sqrt(3), 4)
  })

  it('pythagoras 3-4-5: a² + b² = c²', () => {
    const bound = bindTemplate('pythagoras', { a: 3, b: 4 })
    expect(bound.metrics.c).toBeCloseTo(5, 4)
    expect(bound.metrics.a2 + bound.metrics.b2).toBeCloseTo(bound.metrics.c2, 6)
  })

  it('circle_unroll C = 2πr', () => {
    const bound = bindTemplate('circle_unroll', { r: 2 })
    expect(bound.metrics.C).toBeCloseTo(4 * Math.PI, 3)
  })

  it('parallel_transversal 70° → corresponding = alternate = 70, co-interior = 180', () => {
    const bound = bindTemplate('parallel_transversal', { angleDeg: 70 })
    expect(bound.metrics.corresponding).toBe(70)
    expect(bound.metrics.alternateInterior).toBe(70)
    expect(bound.metrics.coInterior).toBe(180)
    expect(bound.metrics.adjacent).toBe(110)
  })

  it('volume_fill cylinder V=πr²h, cone is one third', () => {
    const cyl = bindTemplate('volume_fill', { r: 2, h: 5, shape: 0 })
    const cone = bindTemplate('volume_fill', { r: 2, h: 5, shape: 1 })
    expect(cyl.metrics.volume).toBeCloseTo(Math.PI * 20, 3)
    expect(cone.metrics.volume).toBeCloseTo((Math.PI * 20) / 3, 3)
  })

  it('unit_circle 60° → cos 1/2, sin √3/2', () => {
    const bound = bindTemplate('unit_circle', { angleDeg: 60 })
    expect(bound.metrics.cos).toBeCloseTo(0.5, 5)
    expect(bound.metrics.sin).toBeCloseTo(Math.sqrt(3) / 2, 5)
  })

  it('number_line_walk 2 + 3 = 5', () => {
    const bound = bindTemplate('number_line_walk', { start: 2, delta: 3 })
    expect(bound.metrics.end).toBe(5)
  })

  it('collision_theory: higher T increases k; head-on collision is effective only if E ≥ Ea', () => {
    const low = bindTemplate('collision_theory', { temperature: 300, activationEnergy: 40 })
    const high = bindTemplate('collision_theory', { temperature: 700, activationEnergy: 40 })
    expect(Number(high.metrics.fraction)).toBeGreaterThan(Number(low.metrics.fraction))
    expect(bindTemplate('collision_theory', { temperature: 350, activationEnergy: 40 }).metrics.effective).toBe(true)
    expect(bindTemplate('collision_theory', { temperature: 250, activationEnergy: 80 }).metrics.effective).toBe(false)
  })

  it('ionic_bond has Na, Cl, 7 Cl valence electrons, and one transferring e⁻', () => {
    const bound = bindTemplate('ionic_bond', { duration: 3 })
    const ids = (bound.spec.stage?.elements ?? []).map((el) => el.id)
    expect(ids).toContain('na')
    expect(ids).toContain('cl')
    expect(ids).toContain('e')
    expect(ids.filter((id) => id.startsWith('cl-e'))).toHaveLength(7)
  })

  it('gas_piston V = T/(300 P)', () => {
    expect(bindTemplate('gas_piston', { T: 300, P: 1 }).metrics.V).toBe(1)
    expect(bindTemplate('gas_piston', { T: 300, P: 2 }).metrics.V).toBe(0.5)
    expect(bindTemplate('gas_piston', { T: 450, P: 1 }).metrics.V).toBe(1.5)
  })

  it('diffusion speed doubles when T is quadrupled', () => {
    const a = bindTemplate('diffusion', { temperature: 200 })
    const b = bindTemplate('diffusion', { temperature: 800 })
    expect(Number(b.metrics.speed) / Number(a.metrics.speed)).toBeCloseTo(2, 4)
  })
})
