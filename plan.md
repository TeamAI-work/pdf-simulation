# Class 6–10 parameterized simulations

Every simulation is a **file that only needs parameters to run**. A textbook page is matched to a file, numbers are taken from the book, and that file produces the animation. The LLM never draws SVG.

Scope: **Class 6–10 Maths, Physics, and Chemistry**. Topic-based, not board-chapter-mapped. Class 1–5 and Biology are out of scope.

## Goal

Book page → sim file + book values → animation.

Example: the page says *“A ball is thrown at 20 m/s at 45° from ground level.”*

```
projectile_2d.run({
  v0: 20,        // from the book
  angleDeg: 45,  // from the book
  h0: 0,         // default
  g: 9.81        // default
})
```

`paramMeta` marks each value as `extracted` or `default` so the UI can show which numbers came from the book.

## Pipeline

```
Book page text
    → match topic to sim id
    → extract numbers from the page
    → fill params (book values + catalog defaults)
    → store templateId + params only
    → simFile.run(params)
    → SimStage (SVG)
```

### Locked rules

- **Params in, animation out.** A sim file has no dependency on the PDF, LLM, or page layout.
- **Books only supply values.** Classify picks `templateId` and a partial `params` object from the quote. Ingest clamps through the file’s schema and fills defaults.
- **No LLM-drawn `stage`.** If no sim file matches the page, store nothing. Do not invent SVG.
- **Bind at render.** Persist `templateId` + `params` in `sim_annotations.spec`. Call `run(params)` in the reader so fixing a sim file fixes every old book.
- **Time-driven only.** min/max/step clamp extracted values. No sliders in this cut.
- **Ideal textbook models.** Vacuum projectile, small-angle pendulum. Drag/Magnus stays in the MCP lab.

The curator (`server/src/prompts/simspec.v3.md` + `server/src/services/sim/classify.ts`) is only a matcher and number extractor. It receives the registry of ids and param names. It must not emit `stage.elements`.

This uses the existing `templateId`, `params`, and `paramMeta` fields in `shared/simSpec.ts`.

## Sim file contract

Path: `shared/templates/sims/<id>.ts`

Each file exports the same shape:

| Field | Meaning |
| --- | --- |
| `id` | e.g. `projectile_2d` |
| `domain` | `physics` \| `math` \| `chemistry` |
| `classBand` | `6-8` \| `9-10` |
| `params` | name, unit, min, max, default |
| `keywords` | for matching |
| `equations` | for the explain panel |
| `run(params)` | returns `SimStage` — the only way to animate |

A topic gets a file only if changing a param **changes the animation in a checkable way** (range, period, slope, temperature). Periodic table, balancing equations, and Euclidean proofs do not get files.

## File layout

```
shared/templates/
  sims/                 ← one file per simulation (target)
    projectile_2d.ts
    pendulum.ts
    ...
  catalog.ts            ← registry: TEMPLATE_IDS, getSim(id), runSim(id, params)
  physics.ts            ← shared solvers (range, collision, period)
  match.ts              ← keyword / id matching from page text
  bind.ts               ← thin dispatcher after split; delete per-template bodies
  index.ts              ← barrel
```

**Today:** eight physics sims already live as functions in `shared/templates/bind.ts`, with schemas in `catalog.ts` and solvers in `physics.ts`. `match.ts` and `bind.test.ts` exist. They are **not** one-file-per-sim yet, and the book pipeline still asks the LLM for `stage` JSON.

## Physics files (20)

Already implemented as binders — split into `sims/` first:

- `projectile_2d` — `v0`, `angleDeg`, `h0`, `g`
- `free_fall` — `h0`, `g`
- `collision_1d` — `m1`, `m2`, `u1`, `u2`, `e`
- `pendulum` — `length`, `g`, `theta0`
- `ramp_friction` — `angleDeg`, `mu`, `mass`
- `buoyancy` — `densityObject`, `densityFluid`, `volume`
- `bounce_energy` — `h0`, `e`, `g`
- `force_ma` — `mass`, `force`

Then add:

| id | classBand | params |
| --- | --- | --- |
| `uniform_motion` | 6–8 | `v`, `tMax` |
| `accelerated_motion` | 9–10 | `u`, `a`, `tMax` |
| `spring_shm` | 9–10 | `k`, `m`, `A` |
| `circular_motion` | 9–10 | `r`, `omega` |
| `reflection_plane` | 6–10 | `angleDeg` |
| `snell_refraction` | 8–10 | `n1`, `n2`, `theta1` |
| `convex_lens` | 9–10 | `u`, `f` |
| `ohm_circuit` | 7–10 | `V`, `R` |
| `magnetic_wire` | 9–10 | `I` |
| `sound_wave` | 8–9 | `A`, `f` |
| `heat_conduction` | 6–8 | `conductivity` |
| `shadow_light` | 6–8 | `sourceDistance`, `objectHeight` |

Skip for now: orbital mechanics, AC circuits, electromagnetic induction.

## Chemistry files (9)

| id | params |
| --- | --- |
| `kinetic_particles` | `temperature`, `count` |
| `states_of_matter` | `temperature` or discrete `state` |
| `diffusion` | `temperature` |
| `gas_piston` | `T` or `P` |
| `electron_shells` | `n` |
| `ionic_bond` | optional timing only |
| `covalent_bond` | optional timing only |
| `collision_theory` | `temperature`, `activationEnergy` |
| `electrolysis` | `voltage` |

Skip: balancing equations, periodic table, organic nomenclature, mole calculations with no motion.

## Maths files (12)

| id | params |
| --- | --- |
| `number_line_walk` | `start`, `delta` |
| `fraction_bar` | `numerator`, `denominator` |
| `linear_graph` | `m`, `c` (optional `m2`, `c2`) |
| `quadratic_parabola` | `a`, `b`, `c` |
| `unit_circle` | `omega` |
| `angle_of_elevation` | `angleDeg`, `distance` |
| `pythagoras` | `a`, `b` |
| `circle_unroll` | `r` |
| `similar_triangles` | `scale` |
| `transform_2d` | `dx`, `dy`, `angleDeg` |
| `volume_fill` | `r`, `h`, `shape` |
| `coordinate_plot` | `x1`, `y1` (optional `x2`, `y2`) |

Skip: long division algorithms, statistics tables, probability word problems, Euclidean proof text.

## Build order

### Wave 0 — generator actually runs

1. Define the one-file-per-sim contract and a registry that lists every sim file.
2. Split the existing eight physics binders out of `bind.ts` into `shared/templates/sims/<id>.ts`.
3. Wire classify / ingest / SimPanel so books only store `templateId` + `params`, then `run(params)` at render.
4. Rewrite `simspec.v3.md` so the curator picks from the allowed id list and extracts param numbers. No `stage.elements`.
5. Prove with the projectile fixture: book values `v0=20`, `angleDeg=45` produce the correct range.

### Wave 1 — remaining physics

Add the twelve physics files in the table above.

### Wave 2 — chemistry

Add the nine chemistry files. Replace the Bohr SVG in `server/src/services/sim/proceduralSim.ts` with `electron_shells` / `kinetic_particles`.

### Wave 3 — maths

Add maths files, graphs first (`linear_graph`, `quadratic_parabola`, `unit_circle`), then 6–8 geometry (`pythagoras`, `number_line_walk`, `volume_fill`).

## Tests

Per sim file:

- Book-like params in → valid `SimSpec` / `SimStage` out
- Missing params filled from defaults and marked `paramMeta.source = 'default'`
- Extracted params marked `extracted`
- Solver gates where they exist (projectile range vs \(R = v_0^2\sin 2\theta / g\), collision energy, pendulum period)

## Out of scope

- LLM-generated `stage` JSON
- Class 1–5 activities and Biology
- Board-specific chapter titles (NCERT vs state)
- Sliders, bbox overlays, MCP drag/Magnus inside these files
- Running a physics file as a fallback for unmatched maths or chemistry
