# NCERT Sim Templates — Build Plan

This plan adds **32 new templates** (Class 3–10 Maths / Physics / Chemistry, no biology) so the LLM can pick a `templateId` and pass **book numbers** as `params`. The canvas always comes from `run(params)`, never from LLM-drawn SVG.

**Related:** existing catalog in `shared/templates/sims/` (41 templates) · curator prompt `server/src/prompts/simspec.v3.md` · bind tests `shared/templates/bind.test.ts`

**Invariant (do not change):** books store `templateId` + `params` only. `ingest.normalizeTemplateCandidate` drops unknown ids and any `stage` the LLM emits.

---

## Overview

| Phase | Name | Templates | Catalog size after | LLM / matcher work |
|-------|------|-----------|--------------------|--------------------|
| **0** | Recipe + test harness | 0 | 41 | Shared checklist; bump-count helper |
| **1** | Graph templates | 6 | 47 | Extractors for tables, R, k, a/d/n |
| **2A** | Maths — geometry | 7 | 54 | Angle / circle / section regexes |
| **2B** | Maths — number & data | 6 | 60 | Ratio, spinner, clock, identity tiles |
| **3** | Physics gaps | 9 | 69 | Pressure, circuit, mirror, echo, work |
| **4** | Chemistry gaps | 4 | 73 | pH, mix method, heating curve, metals |
| **5** | LLM explain path | 0 | 73 | Prompt examples + chat uses metrics |
| **6** | Verification | 0 | 73 | Golden book quotes → template + params |

Phases **1–4** are sequential batches of sim files. Phase **5** can start after Phase 1 (graphs are the first LLM win). Phase **6** is the release gate.

Skip biology. Do not rebuild the existing 41 ids.

---

## Per-template recipe (every file in Phases 1–4)

Copy this checklist for each `id`. One template = one file.

### Files touched (every template)

| Action | File |
|--------|------|
| NEW | `shared/templates/sims/<id>.ts` |
| MODIFY | `shared/templates/sims/index.ts` — import + `SIM_REGISTRY` entry |
| MODIFY | `shared/templates/match.ts` — `extractCommon` regexes for new param keys |
| MODIFY | `shared/templates/bind.test.ts` — catalog length + 1–2 bind tests |
| OPTIONAL | `shared/templates/physics.ts` — closed-form solver if the sim has a formula |

The curator catalog is **auto-injected** from `TEMPLATE_CATALOG` via `allowedTemplatePrompt()` in `classify.ts`. You do **not** hand-edit `simspec.v3.md` for each id (only add 1–2 JSON examples in Phase 5).

### File contract (`SimFile` in `shared/templates/contract.ts`)

- `id` — exact registry key (snake_case)
- `domain` — `physics` \| `math` \| `chemistry`
- `classBand` / `ncertClass` — lowest NCERT class that uses it
- `label`, `description`, `equations[]`
- `keywords[]` — phrases the matcher and LLM will see in textbooks
- `params[]` via `param(key, label, unit, min, max, step, default)`
- `schema` via `num(min, max, fallback)` — slightly wider than slider so extracted book values are not crushed
- `run(params)` → `{ stage, metrics, warnings, caption? }` using helpers in `shared/templates/stage.ts`

### Param rules

- Keys must be the names the LLM will copy from the book (`u`, `a`, `tMax`, `V`, `R`, `pH`).
- Slider `min`/`max` = classroom range; schema range = allow slightly out-of-range textbook numbers.
- Missing keys stay omitted so `parseTemplateParams` fills defaults and marks `paramMeta[key].source = 'default'`.
- Extracted numbers must survive bind unchanged (same test pattern as projectile `v0: 28`).

### `run()` rules

- Use `VIEW = '0 0 500 300'`.
- Animate with `{ $expr: '...' }` and `tLoop`, not `requestAnimationFrame` inside the sim file.
- Put **computed teaching numbers** in `metrics` (range, I, P, area, P(E)) so chat can explain them.
- At least 3 elements (axes/ground + moving object + equation label).

### Exit criteria (per template)

- [ ] `bindTemplate(id, {})` produces `isSimulatable: true` and `stage.elements.length > 0`
- [ ] Book-like params round-trip (`spec.params.u === 5`)
- [ ] Keywords match a real NCERT sentence in `matchTemplateFromText`
- [ ] `npm test --workspace=shared` passes
- [ ] Manual: Sim tab plays; sliders move; caption/metrics make sense

---

## Phase 0 — Recipe lock + test harness

**Goal:** Adding a template is mechanical. Catalog count tests do not become a fight each batch.

### Deliverables

- [ ] Document this recipe in-repo (this file).
- [ ] Change `shared/templates/bind.test.ts` catalog coverage from hardcoded `toHaveLength(41)` / domain counts to **derived from `TEMPLATE_IDS` + `TEMPLATE_CATALOG[id].domain`** (still assert physics/math/chemistry only; still assert every id runs).
- [ ] Keep one explicit snapshot test: `expect(TEMPLATE_IDS).toContain('projectile_2d')` so deletes are visible.
- [ ] Add `shared/templates/__tests__/templateFile.contract.test.ts` (or extend bind.test): every `SimFile` has `keywords.length >= 3`, unique `id`, `params.length >= 1`, `run` returns finite metrics.

### Dependencies

- None

### Exit criteria

- Existing 41 templates still pass.
- Next phase can add a file without editing domain count literals.

### Files touched

| Action | File |
|--------|------|
| MODIFY | `shared/templates/bind.test.ts` |
| NEW (optional) | `shared/templates/__tests__/templateFile.contract.test.ts` |

---

## Phase 1 — Graph templates (6)

**Goal:** The LLM can plot the **tables and equations** NCERT actually prints. Motion carts already exist (`uniform_motion`, `accelerated_motion`); these are the **graphs**.

### 1. `st_vt_graph` — Class 7–9 Physics

| Field | Value |
|-------|--------|
| Domain | physics |
| Params | `u` (m/s), `a` (m/s²), `tMax` (s) |
| Metrics | `sMax`, `vEnd` |
| Equations | `v = u + at`, `s = ut + ½at²` |
| Keywords | distance-time graph, velocity-time graph, s-t graph, v-t graph |
| Canvas | Two axes: s–t curve and v–t line sharing `t` |

**Tasks**

- [ ] Solver helper in `physics.ts`: `motionGraphs(u,a,tMax) → { sMax, vEnd }`
- [ ] Draw t-axis; s(t) as `active-path` or sampled `path`; v(t) as a line
- [ ] Extractors: already have `u`, `a`, `tMax` — add keywords only
- [ ] Test: `u=0, a=2, tMax=5` → `sMax=25`, `vEnd=10`

### 2. `vi_graph` — Class 8–10 Physics

| Field | Value |
|-------|--------|
| Params | `R` (Ω), `Vmax` (V) |
| Metrics | `slope` (= 1/R), `I_at_Vmax` |
| Equations | `V = IR` |
| Keywords | V-I graph, ohm's law graph, voltage current graph |
| Canvas | V on x, I on y, straight line through origin |

**Tasks**

- [ ] Reuse `ohmCurrent`
- [ ] Extractor: `R`, `V` already exist; map `V` → `Vmax` if needed
- [ ] Test: `R=4, Vmax=12` → I = 3 A, slope = 0.25

### 3. `inverse_graph` — Class 8 Maths

| Field | Value |
|-------|--------|
| Domain | math |
| Params | `k` |
| Metrics | sample points `(x, k/x)` |
| Equations | `xy = k` |
| Keywords | inverse proportion, inverse variation, xy = k |
| Canvas | y = k/x in first quadrant |

### 4. `bar_chart` — Class 3–8 Maths

| Field | Value |
|-------|--------|
| Params | `v1`…`v5` (counts) |
| Metrics | `total`, `max` |
| Keywords | bar graph, pictograph, tally chart, data handling |
| Canvas | five bars; hide a bar if value is 0 |

**Tasks**

- [ ] Extractors for “32, 45, 18…” are weak today — add `values: [n,n,n]` fallback: first five integers after “bar” / “table”
- [ ] LLM still sends `v1`…`v5` explicitly (preferred)

### 5. `histogram` — Class 9–10 Maths

| Field | Value |
|-------|--------|
| Params | `binStart`, `binWidth`, `f1`…`f5` |
| Metrics | `n` (sum of frequencies) |
| Keywords | histogram, frequency distribution, class interval, ogive |
| Canvas | adjacent bars, no gap; optional cumulative polyline |

### 6. `ap_graph` — Class 10 Maths

| Field | Value |
|-------|--------|
| Params | `a`, `d`, `n` |
| Metrics | `tn`, `Sn` |
| Equations | `t_n = a+(n-1)d`, `S_n = n/2 [2a+(n-1)d]` |
| Keywords | arithmetic progression, nth term, common difference |
| Canvas | dots on a number line + label `t_n` |

**Tasks**

- [ ] Solver `apTerm(a,d,n)`, `apSum(a,d,n)` in `physics.ts` or `math.ts` (prefer a small `shared/templates/math.ts` if physics.ts is the wrong home)
- [ ] Extractors: `a`, `d`, `n` (careful: `a` is also acceleration — keyword score must beat motion when “progression” / “A.P.” is present)

### Phase 1 exit criteria

- [ ] Catalog includes the 6 ids
- [ ] Sample quote “A body starts from rest and accelerates at 2 m/s² for 5 s” → `st_vt_graph` with `u=0,a=2,tMax=5`
- [ ] Sample quote “R = 4 Ω, plot V–I” → `vi_graph`
- [ ] `npm test --workspace=shared`

---

## Phase 2A — Maths geometry (7)

**Goal:** Live diagrams for lines, triangles, circles, coordinates.

| # | id | Class | Params | Metrics | Keywords |
|---|----|-------|--------|---------|----------|
| 7 | `angle_pair` | 6–9 | `angleDeg` | `complement`, `supplement` | complementary, supplementary, adjacent angles |
| 8 | `parallel_transversal` | 7–9 | `angleDeg` | corresponding = `angleDeg` | parallel lines, transversal, corresponding angles |
| 9 | `triangle_angles` | 7 | `A`, `B` | `C = 180-A-B` | angle sum property, triangle angles |
| 10 | `quadrilateral_live` | 8–9 | `A`,`B`,`C` | `D = 360-A-B-C` | quadrilateral, opposite angles |
| 11 | `circle_tangent` | 9–10 | `r`, `d` | tangent length `√(d²-r²)` | tangent to a circle, from a point |
| 12 | `sector_segment` | 10 | `r`, `thetaDeg` | sector area, segment area | sector, segment, areas related to circles |
| 13 | `section_formula` | 10 | `x1,y1,x2,y2,m,n` | `x`, `y` of divide point | section formula, divides internally |

**Tasks**

- [ ] Geometry helpers: `complement(deg)`, `tangentLength(r,d)`, `sectorArea(r,θ)`, `sectionPoint(...)`
- [ ] Warn in `warnings` if `d < r` (no real tangent) or `A+B >= 180`
- [ ] Extractors: `thetaDeg` from `θ =` / `angle`; `m,n` from `m:n`
- [ ] Tests: 90° → complement 0 skip, 30° → complement 60 supplementary 150; section 1:1 midpoint

### Phase 2A exit criteria

- [ ] `matchTemplateFromText('A transversal cuts parallel lines. One angle is 70°.')` → `parallel_transversal`
- [ ] `bindTemplate('section_formula', { x1:0,y1:0,x2:4,y2:2,m:1,n:1 })` midpoint `(2,1)`

---

## Phase 2B — Maths number & data (6)

| # | id | Class | Params | Metrics | Keywords |
|---|----|-------|--------|---------|----------|
| 14 | `identity_tiles` | 8 | `a`, `b` | `(a+b)²` | algebraic identity, (a+b)^2, expansion |
| 15 | `ratio_bars` | 7–8 | `partA`, `partB` | `%` of each, ratio | comparing quantities, percentage, ratio |
| 16 | `equation_balance` | 7 | `coeff`, `addend`, `rhs` | `x` | simple equation, linear equation one variable, pan balance |
| 17 | `square_grid` | 8 | `n` | `n²`, `sqrt` if perfect | square number, square root, 8×8 |
| 18 | `probability_spinner` | 8–10 | `favorable`, `total` | `P` | probability, equally likely, spinner |
| 19 | `clock_hands` | 3–4 | `hours`, `minutes` | angle between hands | clock, elapsed time, 12-hour |

**Tasks**

- [ ] `equation_balance`: solve `coeff * x + addend = rhs`; animate pans until equal
- [ ] `probability_spinner`: clamp `favorable <= total`; P in metrics
- [ ] `clock_hands`: angle `\|30H − 5.5M\|`; optional Class 3–4 only — lowest priority in this batch
- [ ] Extractors: `favorable`/`total`, `hours`/`minutes`, `partA`/`partB`

### Phase 2B exit criteria

- [ ] `2x + 3 = 11` → `equation_balance` with `x=4`
- [ ] `favorable=2, total=6` → `P=1/3`
- [ ] Identity tiles: `a=3,b=2` → metric `25`

---

## Phase 3 — Physics gaps (9)

**Goal:** Cover Force/Pressure, extra Electricity, mirrors, sound echo, work — without duplicating projectile/lens/Ohm-single-resistor.

| # | id | Class | Params | Metrics | Notes |
|---|----|-------|--------|---------|-------|
| 20 | `pressure_area` | 8 | `force`, `area` | `P = F/A` | two footprints, same F |
| 21 | `liquid_pressure` | 8–9 | `h`, `rho`, `g` | `P = hρg` | tank + depth marker |
| 22 | `series_parallel` | 7–10 | `V`, `R1`, `R2`, `mode` (0 series / 1 parallel) | `I`, `I1`, `I2`, `Req` | mode is a number so LLM can send it |
| 23 | `heating_effect` | 7–8 | `I`, `R`, `t` | `H = I²Rt` | wire colour by H |
| 24 | `mirror_ray` | 8–10 | `u`, `f`, `kind` (0 concave / 1 convex) | `v`, `m` | mirror formula `1/v+1/u=1/f` |
| 25 | `prism` | 10 | `A`, `mu` | `δ ≈ (μ−1)A` (thin) | optics only, no eye biology |
| 26 | `echo` | 9 | `distance`, `vSound` | `t = 2d/v` | pulse out and back |
| 27 | `work_fs` | 9 | `force`, `s`, `angleDeg` | `W = Fs cosθ` | block + force arrow |
| 28 | `solenoid` | 10 | `I`, `turns` | qualitative B | loops + field arrows |

**Tasks**

- [ ] `physics.ts`: `pressure(F,A)`, `liquidP(h,rho,g)`, `seriesReq`, `parallelReq`, `heatEnergy`, `mirrorV(u,f,kind)`, `echoTime`, `workFs`
- [ ] `mirror_ray` sign convention: document in `description` so the LLM uses school-book distances (positive u)
- [ ] Extractors: `rho` / `kg/m³`, `vSound`, `turns`, `mode` from “series”/“parallel” (matcher maps words → 0/1 if LLM omits mode)
- [ ] Tests: series `R1=2,R2=3,V=10` → I=2 A; echo `d=340, v=340` → t=2 s

### Phase 3 exit criteria

- [ ] Quote “two resistors 2 Ω and 3 Ω in series on 10 V” → `series_parallel`
- [ ] Quote “echo from a cliff 340 m away, speed of sound 340 m/s” → `echo` with t=2
- [ ] No new biology templates

---

## Phase 4 — Chemistry gaps (4)

| # | id | Class | Params | Metrics | Keywords |
|---|----|-------|--------|---------|----------|
| 29 | `separation_mix` | 6 | `method` (0 settle / 1 filter / 2 magnet) | — | sedimentation, filtration, magnetic separation |
| 30 | `ph_strip` | 7–10 | `pH` | acid/base/neutral flag | pH, indicator, acids bases salts |
| 31 | `state_change_curve` | 9 | `T`, `melting`, `boiling` | phase label | heating curve, melting point, latent heat |
| 32 | `reactivity_swap` | 10 | `metalA`, `metalB` (0–4 ranked) | `willDisplace` | displacement reaction, reactivity series |

**Tasks**

- [ ] Encode metals as numbers so params stay `Record<string, number>`: 0 Na, 1 Mg, 2 Zn, 3 Fe, 4 Cu (document in `description`)
- [ ] `separation_mix`: particles fall / stuck on filter / stick to magnet via `$expr`
- [ ] Extractor: `pH` from `pH = 3`; method keywords
- [ ] Test: pH 3 → acid; Zn vs Cu → displace true; Cu vs Zn → false

### Phase 4 exit criteria

- [ ] Catalog **73** templates (41 + 32)
- [ ] Chemistry domain count = 9 + 4 = 13
- [ ] Shared tests green

---

## Phase 5 — LLM uses numbers + explains

**Goal:** Curator and chat actually **prefer** the new ids and explain `metrics`, not generic prose.

### Deliverables

- [ ] Add 4–6 few-shot JSON blobs to `server/src/prompts/simspec.v3.md` (st_vt_graph, vi_graph, series_parallel, ap_graph, section_formula, ph_strip). Keep “never emit stage”.
- [ ] `match.ts`: unique keywords so AP does not steal `a` from acceleration; “series/parallel” sets `mode`.
- [ ] Chat path (`explainService` / ChatPane): when `spec.metrics` exists, instruct the model to walk through **those** numbers (caption + metrics). If that prompt is missing, add one short rule: “Explain using spec.params and computed metrics only.”
- [ ] `classify` tests: fixture page text → expected `templateId` + extracted param (extend `server/src/services/sim/__tests__/classify.test.ts` with mocked LLM or matcher-only tests).

### Dependencies

- Phase 1 minimum (graphs). Best after Phase 3.

### Exit criteria

- [ ] Matcher unit tests for 8 representative textbook sentences
- [ ] On-demand sim (`generateCustomSimulation`) still rejects unknown `templateId`
- [ ] Chat explanation mentions the extracted value (e.g. “20 m/s”) when `paramMeta.v0.source === 'extracted'`

### Files touched

| Action | File |
|--------|------|
| MODIFY | `server/src/prompts/simspec.v3.md` |
| MODIFY | `shared/templates/match.ts` |
| MODIFY | `server/src/services/sim/explainService.ts` (if metrics not passed through) |
| MODIFY | `server/src/services/sim/__tests__/classify.test.ts` |
| MODIFY | `server/src/services/sim/__tests__/explainService.test.ts` |

---

## Phase 6 — Verification & freeze

**Goal:** Safe to ingest real books against the new catalog.

### Deliverables

- [ ] Golden fixtures: 15–20 short NCERT-like quotes in `shared/templates/__tests__/goldenQuotes.test.ts` → `{ templateId, params subset }`
- [ ] Manual QA on Sim tab for one template per family (graph, motion already exists, geometry, ray, wave/echo, particles, circuit, fill)
- [ ] Confirm ingest still strips `stage` (`ingest` tests)
- [ ] Typecheck: `npm run typecheck`
- [ ] Full test: `npm test`

### Exit criteria

- [ ] All 32 new ids in `TEMPLATE_IDS`
- [ ] No biology ids
- [ ] Golden quote suite ≥ 80% exact templateId match (params may use defaults for missing numbers)
- [ ] Dev app: open a Class 9 motion page / Class 10 electricity page and see the **new** graph templates, not only the cart

---

## Suggested calendar (one-by-one)

Do **one template per PR** (or per sitting) using the recipe. Suggested order:

1. Phase 0 harness  
2. `st_vt_graph`  
3. `vi_graph`  
4. `series_parallel`  
5. `ap_graph`  
6. `bar_chart`  
7. `section_formula`  
8. `parallel_transversal`  
9. `mirror_ray`  
10. `pressure_area`  
11. `echo`  
12. `ph_strip`  
13. Remainder of 2A → 2B → 3 → 4  
14. Phase 5 prompt/matcher  
15. Phase 6 goldens  

`clock_hands` is optional (Class 3–4). If you want Class 6–10 only, drop it and the catalog target becomes **72**.

---

## Out of scope

- Rebuilding the existing 41 templates
- Biology (life processes, cells, heredity, plants, animals)
- Letting the LLM invent `stage.elements`
- New canvas primitives unless a template is blocked (prefer `line` / `path` / `particles` / `arrow` first)
- Changing ingest storage format

---

## Done when

The LLM can read a non-biology numerical from Classes 6–10, emit `{ templateId, params }`, the binder draws the correct family (graph, geometry, ray, circuit, particles, fill), and chat explains using those book numbers and `metrics`.
