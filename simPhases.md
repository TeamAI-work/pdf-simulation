# Sim Templates — Implementation Phases

This document is the working task list for adding **32 new** hand-written `SimFile` templates. Follow phases sequentially. Same checkbox format as [phases.md](phases.md).

**Rules:** Keep the existing 41 templates. Write every new sim by hand. Do **not** use MCP (no Plan MCP, no mcp-physics). No biology. Books store `templateId` + `params` only; the LLM never emits `stage.elements`.

**Related:** [shared/templates/sims/](shared/templates/sims/) · [shared/templates/contract.ts](shared/templates/contract.ts) · [server/src/prompts/simspec.v3.md](server/src/prompts/simspec.v3.md) · [Template_Build_Plan.md](Template_Build_Plan.md)

---

## Overview

| Phase | Name | Scope | Catalog after |
|-------|------|-------|----------------|
| **0** | Harness | Helpers + un-hardcode catalog tests | 41 |
| **1** | Graphs | 6 new sim files | 47 |
| **2A** | Geometry | 7 new sim files | 54 |
| **2B** | Number / data | 6 new sim files | 60 |
| **3** | Physics gaps | 9 new sim files | 69 |
| **4** | Chemistry gaps | 4 new sim files | 73 |
| **5** | LLM wiring | match.ts + curator few-shots | 73 |
| **6** | Verification | tests + typecheck | 73 |

After Phase 0, each template uses the same recipe (below). Catalog text in the curator prompt updates automatically via `allowedTemplatePrompt()`.

---

## Per-template recipe

Use this for every id in Phases 1–4.

### Deliverables (copy per id)

- [ ] NEW `shared/templates/sims/<id>.ts`
  - `id`, `domain`, `classBand`, `ncertClass`, `label`, `description`
  - `equations[]`, `keywords[]` (at least 3 textbook phrases)
  - `params` via `param(key, label, unit, min, max, step, default)`
  - `schema` via `num()` (slightly wider than sliders)
  - `run(params)` → `{ stage, metrics, warnings }` using [shared/templates/stage.ts](shared/templates/stage.ts)
  - viewBox `0 0 500 300`; animate with `{ $expr }` / `tLoop`
  - teaching numbers in `metrics` (so chat can explain book values)
- [ ] MODIFY `shared/templates/sims/index.ts` — import + `SIM_REGISTRY` entry

### Exit criteria (per id)

- `bindTemplate('<id>', {})` is simulatable and has `stage.elements.length > 0`
- Book-like params round-trip unchanged
- `npm test --workspace=shared` still passes

---

## Phase 0 — Harness

**Goal:** Adding a template is mechanical. Catalog-count tests do not break every batch.

### Deliverables

- [x] NEW `shared/templates/math.ts` (or extend [shared/templates/physics.ts](shared/templates/physics.ts) if a separate file is overkill)
  - `motionGraphs(u, a, tMax)` → `{ sMax, vEnd }`
  - `apTerm(a, d, n)`, `apSum(a, d, n)`
  - `complement(deg)`, `supplement(deg)`
  - `tangentLength(r, d)`, `sectorArea(r, thetaDeg)`, `segmentArea(r, thetaDeg)`
  - `sectionPoint(x1, y1, x2, y2, m, n)`
  - `pressure(F, A)`, `liquidPressure(h, rho, g)`
  - `seriesReq(R1, R2)`, `parallelReq(R1, R2)`
  - `heatEnergy(I, R, t)`, `echoTime(d, v)`, `workFs(F, s, angleDeg)`
  - `mirrorImage(u, f, kind)` — kind `0` concave / `1` convex
  - `thinPrismDeviation(A, mu)`
- [x] MODIFY [shared/templates/bind.test.ts](shared/templates/bind.test.ts)
  - Remove hardcoded `toHaveLength(41)` and fixed domain counts
  - Still assert every `TEMPLATE_IDS` entry runs from defaults
  - Keep `expect(TEMPLATE_IDS).toContain('projectile_2d')`
- [x] OPTIONAL NEW `shared/templates/__tests__/templateFile.contract.test.ts`
  - every sim has `keywords.length >= 3`, unique `id`, `params.length >= 1`

### Dependencies

- None (start here)

### Exit criteria

- Existing 41 templates still pass `npm test --workspace=shared`
- Next phase can add a file without editing domain-count literals

### Files touched

| Action | File |
|--------|------|
| NEW | `shared/templates/math.ts` (or physics helpers only) |
| MODIFY | `shared/templates/physics.ts` |
| MODIFY | `shared/templates/bind.test.ts` |
| NEW (optional) | `shared/templates/__tests__/templateFile.contract.test.ts` |

---

## Phase 1 — Graph templates

**Goal:** LLM can plot NCERT tables and motion/electricity equations. Carts already exist (`uniform_motion`, `accelerated_motion`); these are the **graphs**.

### Deliverables

- [x] `st_vt_graph` — physics, class 7–9
  - params: `u`, `a`, `tMax`
  - metrics: `sMax`, `vEnd`
  - canvas: s–t and v–t axes
  - test: `u=0, a=2, tMax=5` → sMax 25, vEnd 10
- [x] `vi_graph` — physics, class 8–10
  - params: `R`, `Vmax`
  - metrics: `slope` (1/R), `I_at_Vmax`
  - canvas: V–I line through origin
  - test: `R=4, Vmax=12` → I = 3
- [x] `inverse_graph` — math, class 8
  - params: `k`
  - equations: `xy = k`
  - canvas: y = k/x
- [x] `bar_chart` — math, class 3–8
  - params: `v1` … `v5` (0 hides a bar)
  - metrics: `total`, `max`
- [x] `histogram` — math, class 9–10
  - params: `binStart`, `binWidth`, `f1` … `f5`
  - metrics: `n` (sum of frequencies)
- [x] `ap_graph` — math, class 10
  - params: `a`, `d`, `n`
  - metrics: `tn`, `Sn`
  - canvas: dots on a line + nth term
  - keywords must include “arithmetic progression” / “A.P.” so matcher does not pick motion `a`

### Dependencies

- Phase 0

### Exit criteria

- Catalog includes the 6 ids (47 total)
- Quote “starts from rest, accelerates at 2 m/s² for 5 s” can bind `st_vt_graph`
- `npm test --workspace=shared`

### Files touched

| Action | File |
|--------|------|
| NEW | `shared/templates/sims/st_vt_graph.ts` |
| NEW | `shared/templates/sims/vi_graph.ts` |
| NEW | `shared/templates/sims/inverse_graph.ts` |
| NEW | `shared/templates/sims/bar_chart.ts` |
| NEW | `shared/templates/sims/histogram.ts` |
| NEW | `shared/templates/sims/ap_graph.ts` |
| MODIFY | `shared/templates/sims/index.ts` |

---

## Phase 2A — Maths geometry

**Goal:** Live diagrams for lines, triangles, circles, coordinates.

### Deliverables

- [x] `angle_pair` — params `angleDeg`; metrics `complement`, `supplement`
- [x] `parallel_transversal` — params `angleDeg`; corresponding angles labelled
- [x] `triangle_angles` — params `A`, `B`; metric `C = 180-A-B`; warn if A+B >= 180
- [x] `quadrilateral_live` — params `A`, `B`, `C`; metric `D = 360-A-B-C`
- [x] `circle_tangent` — params `r`, `d`; metric tangent length; warn if d < r
- [x] `sector_segment` — params `r`, `thetaDeg`; metrics sector/segment area
- [x] `section_formula` — params `x1,y1,x2,y2,m,n`; metrics divided point
  - test: 1:1 from (0,0) to (4,2) → (2,1)

### Dependencies

- Phase 0 (helpers). Can run in parallel with Phase 1.

### Exit criteria

- Catalog 54
- `bindTemplate('section_formula', { x1:0, y1:0, x2:4, y2:2, m:1, n:1 })` midpoint (2, 1)
- Shared tests green

### Files touched

| Action | File |
|--------|------|
| NEW | `shared/templates/sims/angle_pair.ts` |
| NEW | `shared/templates/sims/parallel_transversal.ts` |
| NEW | `shared/templates/sims/triangle_angles.ts` |
| NEW | `shared/templates/sims/quadrilateral_live.ts` |
| NEW | `shared/templates/sims/circle_tangent.ts` |
| NEW | `shared/templates/sims/sector_segment.ts` |
| NEW | `shared/templates/sims/section_formula.ts` |
| MODIFY | `shared/templates/sims/index.ts` |

---

## Phase 2B — Maths number and data

**Goal:** Identities, ratios, equations, squares, probability, clock.

### Deliverables

- [x] `identity_tiles` — params `a`, `b`; metric `(a+b)²`; canvas area tiles
  - test: a=3, b=2 → 25
- [x] `ratio_bars` — params `partA`, `partB`; metrics percents
- [x] `equation_balance` — params `coeff`, `addend`, `rhs`; metric `x`
  - test: 2x + 3 = 11 → x = 4
- [x] `square_grid` — params `n`; metrics `n²` and sqrt if perfect square
- [x] `probability_spinner` — params `favorable`, `total`; metric `P`; clamp favorable <= total
- [x] `clock_hands` — params `hours`, `minutes`; metric angle between hands (Class 3–4; optional if scoping to 6–10)

### Dependencies

- Phase 0

### Exit criteria

- Catalog 60 (59 if clock dropped)
- Equation and spinner tests above pass
- Shared tests green

### Files touched

| Action | File |
|--------|------|
| NEW | `shared/templates/sims/identity_tiles.ts` |
| NEW | `shared/templates/sims/ratio_bars.ts` |
| NEW | `shared/templates/sims/equation_balance.ts` |
| NEW | `shared/templates/sims/square_grid.ts` |
| NEW | `shared/templates/sims/probability_spinner.ts` |
| NEW | `shared/templates/sims/clock_hands.ts` |
| MODIFY | `shared/templates/sims/index.ts` |

---

## Phase 3 — Physics gaps

**Goal:** Pressure, extra electricity, mirrors, echo, work. Do not duplicate projectile, lens, or single-resistor Ohm.

### Deliverables

- [x] `pressure_area` — `force`, `area` → `P = F/A`
- [x] `liquid_pressure` — `h`, `rho`, `g` → `P = hρg`
- [x] `series_parallel` — `V`, `R1`, `R2`, `mode` (0 series / 1 parallel) → `Req`, `I`, `I1`, `I2`
  - test: series R1=2, R2=3, V=10 → I = 2
- [x] `heating_effect` — `I`, `R`, `t` → `H = I²Rt`
- [x] `mirror_ray` — `u`, `f`, `kind` (0 concave / 1 convex) → `v`, `m`
- [x] `prism` — `A`, `mu` → thin-prism deviation (optics only, no eye biology)
- [x] `echo` — `distance`, `vSound` → `t = 2d/v`
  - test: d=340, v=340 → t = 2
- [x] `work_fs` — `force`, `s`, `angleDeg` → `W = Fs cosθ`
- [x] `solenoid` — `I`, `turns` → field arrows

Enums stay numbers so `params` remains `Record<string, number>`.

### Dependencies

- Phase 0 helpers

### Exit criteria

- Catalog 69
- Series and echo numeric tests pass
- No biology ids
- Shared tests green

### Files touched

| Action | File |
|--------|------|
| NEW | `shared/templates/sims/pressure_area.ts` |
| NEW | `shared/templates/sims/liquid_pressure.ts` |
| NEW | `shared/templates/sims/series_parallel.ts` |
| NEW | `shared/templates/sims/heating_effect.ts` |
| NEW | `shared/templates/sims/mirror_ray.ts` |
| NEW | `shared/templates/sims/prism.ts` |
| NEW | `shared/templates/sims/echo.ts` |
| NEW | `shared/templates/sims/work_fs.ts` |
| NEW | `shared/templates/sims/solenoid.ts` |
| MODIFY | `shared/templates/sims/index.ts` |
| MODIFY | `shared/templates/physics.ts` |

---

## Phase 4 — Chemistry gaps

**Goal:** Separation, pH, heating curve, displacement. No cells, life processes, or heredity.

### Deliverables

- [x] `separation_mix` — `method` 0 settle / 1 filter / 2 magnet
- [x] `ph_strip` — `pH`; metric acid/base/neutral
  - test: pH 3 → acid
- [x] `state_change_curve` — `T`, `melting`, `boiling`; metric phase label
- [x] `reactivity_swap` — `metalA`, `metalB` ranks 0–4 (Na, Mg, Zn, Fe, Cu)
  - document encoding in `description`
  - test: Zn vs Cu displaces; Cu vs Zn does not

### Dependencies

- Phase 0

### Exit criteria

- Catalog **73** (41 + 32)
- Chemistry domain = 9 existing + 4 new = 13
- Shared tests green

### Files touched

| Action | File |
|--------|------|
| NEW | `shared/templates/sims/separation_mix.ts` |
| NEW | `shared/templates/sims/ph_strip.ts` |
| NEW | `shared/templates/sims/state_change_curve.ts` |
| NEW | `shared/templates/sims/reactivity_swap.ts` |
| MODIFY | `shared/templates/sims/index.ts` |

---

## Phase 5 — LLM wiring

**Goal:** Curator and keyword matcher pick the new ids and pass book numbers. Chat can explain `metrics`.

### Deliverables

- [x] MODIFY [shared/templates/match.ts](shared/templates/match.ts)
  - extractors: `pH`, `partA`/`partB`, `favorable`/`total`, `mode`, `kind`, `binStart`/`binWidth`, `v1`–`v5`, `rho`, `vSound`, `coeff`/`addend`/`rhs`, `hours`/`minutes`, `turns`, `mu` (prism), `metalA`/`metalB`
  - map words “series”/“parallel” → `mode` 0/1 if LLM omits it
  - AP keywords beat motion `a`; “V-I graph” beats generic Ohm
- [x] MODIFY [server/src/prompts/simspec.v3.md](server/src/prompts/simspec.v3.md)
  - few-shot JSON for: `st_vt_graph`, `vi_graph`, `series_parallel`, `ap_graph`, `section_formula`, `ph_strip`
  - keep “never emit stage”
- [x] Tests: 8–15 NCERT-like sentences → expected `templateId` (extend bind.test or new `match.test.ts`)
- [x] If explain path ignores metrics: MODIFY explainService / chat prompt to use `spec.params` + `metrics` only

### Dependencies

- Phases 1–4 (can start after Phase 1 for graphs only)

### Exit criteria

- Matcher hits the 6 few-shot quotes
- `generateCustomSimulation` still rejects unknown `templateId`
- Unknown LLM stages still dropped on ingest

### Files touched

| Action | File |
|--------|------|
| MODIFY | `shared/templates/match.ts` |
| MODIFY | `server/src/prompts/simspec.v3.md` |
| NEW or MODIFY | `shared/templates/bind.test.ts` / match tests |
| MODIFY (if needed) | `server/src/services/sim/explainService.ts` |

---

## Phase 6 — Verification

**Goal:** Safe to ingest real books against the new catalog.

### Deliverables

- [ ] `npm test --workspace=shared`
- [ ] `npm run typecheck`
- [ ] Confirm `TEMPLATE_IDS.length === 73`
- [ ] Spot-check bind:
  - `st_vt_graph` `{ u: 0, a: 2, tMax: 5 }` → sMax 25
  - `echo` `{ distance: 340, vSound: 340 }` → t 2
- [ ] Manual: Sim tab plays one graph, one geometry, one circuit, one particle/chem sim
- [ ] Ingest still strips `stage` (existing ingest tests)

### Dependencies

- Phases 1–5

### Exit criteria

- All 32 new ids in the registry
- No biology ids
- Tests and typecheck green

---

## Out of scope

- Rebuilding the existing 41 templates
- Biology chapters
- LLM-invented SVG
- New canvas primitives unless a template is blocked
- Changing ingest storage format
- MCP tools / mcp-physics engine

---

## Done when

The LLM can read a non-biology Class 6–10 numerical, emit `{ templateId, params }`, `run(params)` draws the matching family, and chat can explain using those book numbers and `metrics`.
