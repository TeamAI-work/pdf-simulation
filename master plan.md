
# PDF Simulator — Final Master Plan (v2.0)

> **Status:** Final. All decisions locked. Build against this document only.
> **Stack:** TypeScript · Express · Node · React · Supabase (Postgres + Storage) · Zod · react-pdf · mathjs · Vitest
> **Domains:** physics · chemistry · math · general
> **Renderer:** React SVG only. No HTML generation. No iframe. No eval().
> **Animation:** Time-driven only. No sliders. No user controls.
> **UI Paradigm:** Page-Level Floating Action Button (FAB) + Bottom Sheet Drawer. **No spatial bounding box overlays.**

---

## 1. Locked Decisions — Do Not Re-open

| Decision | Why |
| :--- | :--- |
| **Storage is strictly Supabase.** No SQLite, no local JSON files, no Vector DBs (ChromaDB). | Postgres `jsonb` handles the `SimSpec` perfectly. Local files break in Docker. Vector DBs are unnecessary since we don't do runtime semantic search. |
| **UI is FAB + Drawer. No spatial bounding box (bbox) overlays.** | Bboxes caused coordinate-flipping bugs (KP-2) and fuzzy-match failures (KP-10). The FAB provides a clean reading experience and 100% backend reliability. |
| **LLM acts as an Educational Curator.** Max 3 simulations per page. | Prevents UI clutter. Forces the LLM to prioritize dynamic concepts (importance >= 6) over static diagrams. |
| **Backend Math Guard is mandatory.** `mathjs.parse()` runs on all `$expr` before DB insert. | Prevents LLM hallucinations (like Python's `x**2`) from reaching the frontend and freezing the animation (KP-1). |
| **One schema:** `shared/simSpec.ts`, Zod, imported by both server and client. | Single source of truth. Prevents schema drift between backend validation and frontend rendering. |
| **Formulas are marked explicitly:** `{ "$expr": "..." }`. Everything else is a literal. | Prevents hex colors and text labels from being accidentally evaluated as math. |
| **Simulation specs are generated once at upload, stored in Postgres.** | Clicking a FAB reads a DB row. It never calls an LLM at runtime. |
| **No fallback data, ever.** Invalid LLM output = dropped candidate, not fabricated physics. | A missing simulation is honest. A wrong simulation misleads the student. |
| **No user controls, no sliders.** Animations are driven by `time` only. | Simpler schema, simpler renderer, simpler prompt. |

---

## 2. Known Pitfalls — Read Before Each Phase

| ID | Pitfall | Severity | Phase | Status |
|---|---|---|---|---|
| **KP-1** | LLM outputs Python-syntax formulas (`x**2`) that `mathjs` can't parse → element sits at `0` silently | 🔴 High | 4, 5 | **Mitigated by Backend Math Guard** |
| ~~KP-2~~ | ~~Highlight overlay misaligned (PDF bottom-left vs screen top-left)~~ | ~~🔴 High~~ | ~~6~~ | **Resolved: Bboxes removed from architecture** |
| **KP-3** | Worker stuck in `extracting`/`classifying` on server restart — books never reach `ready` | 🔴 High | 4 | Stale-job reset on startup required |
| **KP-4** | LLM outputs `isSimulatable: true` with no `stage` (~30% rate during early prompt dev) | 🟠 Medium | 3 | Put `stage` first in prompt examples |
| **KP-5** | TS module resolution differs between `web/` (bundler) and `server/` (node16) | 🟠 Medium | 1 | Use npm workspaces / path aliases |
| **KP-6** | Supabase RLS silently returns `[]` with HTTP 200 when using anon key instead of service-role | 🟠 Medium | 4 | Backend uses `SERVICE_ROLE_KEY` |
| **KP-7** | `active-path` trajectory needs history across frames but `evalSpec` is stateless | 🟠 Medium | 5 | `SimStage` owns `historyRef`, caps length |
| **KP-8** | `particles`: 50 particles × 3 props = 150 mathjs evaluations/frame → drops to 30fps | 🟡 Low | 5 | Cap at 20 particles, pre-compute offsets |
| **KP-9** | `react-pdf` web worker not configured in Vite → PDF pane renders nothing | 🟡 Low | 6 | Configure `pdfjs-dist` worker explicitly |
| ~~KP-10~~| ~~LLM `quote` won't fuzzy-match extracted PDF text → pills null at 0.8 threshold~~ | ~~🟡 Low~~ | ~~2~~ | **Resolved: Bboxes removed, quote used for UI text only** |
| **KP-11** | Sending every page to the LLM hits rate limits fast | 🔴 High | 4 | Pre-filter + Inter-page throttle + Content hash cache |

---

## 3. Data Model

```sql
-- migrations/xxxx_sim_books.sql

create table sim_books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  storage_path text not null,             -- Supabase Storage key
  page_count int,
  status text not null default 'pending'  -- pending | extracting | classifying | ready | failed
    check (status in ('pending','extracting','classifying','ready','failed')),
  error text,
  created_at timestamptz not null default now()
);

-- NOTE: No bbox, page_width, or page_height columns. 
-- The 'quote' is retained purely for UI context in the Drawer, not spatial mapping.
create table sim_annotations (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references sim_books(id) on delete cascade,
  page_number int not null,
  quote text not null,               -- Verbatim text excerpt for the Drawer UI
  spec jsonb not null,               -- validated SimSpec — see shared/simSpec.ts
  spec_version text not null default '2.0',
  content_hash text,                 -- sha256 of page text (first 16 chars) — used to skip re-classification
  created_at timestamptz not null default now()
);

create index sim_annotations_book_page_idx on sim_annotations (book_id, page_number);
create index sim_annotations_hash_idx on sim_annotations (content_hash);

alter table sim_books enable row level security;
alter table sim_annotations enable row level security;

create policy sim_books_read on sim_books
  for select using (status = 'ready');

create policy sim_annotations_read on sim_annotations
  for select using (
    exists (select 1 from sim_books b where b.id = book_id and b.status = 'ready')
  );

-- All writes are service-role only. No insert/update policy for anon/authenticated.
```

---

## 4. Shared Schema — `shared/simSpec.ts`

The single most important file. Every other phase is built against this contract.

```ts
// shared/simSpec.ts
import { z } from 'zod'

const Expr = z.object({ $expr: z.string().min(1) })
const ValueSchema = z.union([z.number(), z.string(), Expr])
export type Value = z.infer<typeof ValueSchema>
export function isExpr(v: Value): v is z.infer<typeof Expr> {
  return typeof v === 'object' && v !== null && '$expr' in v
}

const ElementRole = z.enum(['projectile', 'trajectory', 'none']).default('none')
const BaseProps = z.record(z.string(), ValueSchema)

const ElementSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'circle', 'rect', 'line', 'path', 'text',
    'arrow', 'wave', 'particles', 'spring', 'arc', 'active-path',
  ]),
  role: ElementRole,
  props: BaseProps.default({}),
  text: ValueSchema.optional(),
})
export type SimElement = z.infer<typeof ElementSchema>

const StageSchema = z.object({
  viewBox: z.string().default('0 0 500 300'),
  elements: z.array(ElementSchema).min(1),
})

export const SimSpecSchema = z.object({
  version: z.literal('2.0'),
  parentTopic: z.string().default(''),
  title: z.string().min(1),
  subtitle: z.string().default(''),
  domain: z.enum(['physics', 'chemistry', 'math', 'general']),
  topicExplanation: z.string().default(''),
  caption: z.string().default(''),
  isSimulatable: z.boolean(),
  reasonIfNotSimulatable: z.string().default(''),
  quote: z.string().default(''),    // Verbatim text for UI context (Drawer)
  equations: z.array(z.string()).default([]),
  stage: StageSchema.optional(),
}).superRefine((spec, ctx) => {
  if (spec.isSimulatable && (!spec.stage || spec.stage.elements.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'isSimulatable=true requires stage.elements to be non-empty',
      path: ['stage'],
    })
  }
})

export type SimSpec = z.infer<typeof SimSpecSchema>
```

---

## 5. Extraction Logic — The "Curator" Pipeline

Because we dropped spatial bounding boxes, the backend pipeline is now a pure **semantic and syntactic funnel**.

### Step-by-step pipeline

1. **Spatial Extraction:** `pdfjs-dist` parses the PDF buffer into structured text (lines/words). *We only need the text content now, not the coordinates.*
2. **Pre-filter (`shouldClassify`):** Skip pages with `< 100` words.
3. **Cache Check:** Hash the page text. If `content_hash` exists in DB, skip.
4. **LLM Curation (`classifyPage`):** Send page text to LLM. Prompt demands **max 3 candidates**, each with an `importance` score (1-10) and a verbatim `quote`.
5. **Backend Triage (`ingest.ts`):**
   - Parse JSON via Zod.
   - Filter: Discard any candidate with `importance < 6`.
   - Sort: Rank remaining by `importance` descending.
   - Slice: Keep only the top 3.
6. **Math Guard:** Run `mathjs.parse()` on every `$expr` in the top 3. If it throws (invalid syntax), drop that candidate immediately.
7. **Persist:** Insert the validated `SimSpec` and `quote` into `sim_annotations`.

---

## 6. Target File Layout

```text
server/src/
  routes/
    simulation.ts             — POST /sim/books, GET /sim/books/:id/status
  services/
    pdf/
      extract.ts              — extractPdfStructure(buffer): Page[] (Text only)
      chunk.ts                — pageToText(page): string
      shouldClassify.ts       — shouldClassify(pageText): boolean
    sim/
      candidateSchema.ts      — Zod schema wrapping SimSpec with 'importance'
      classify.ts             — classifyPage(pageText): Candidate[]
      ingest.ts               — orchestrates: pre-filter -> LLM -> triage -> math guard -> store
      repository.ts           — typed Supabase reads/writes (service-role client)
  workers/
    annotateBook.ts           — background job: one book at a time, throttled
  prompts/
    simspec.v3.md             — the LLM "Curator" prompt

shared/
  simSpec.ts                  — THE schema. Single source of truth.

web/src/features/pdf-simulator/
  routes/
    ReaderRoute.tsx           — Main layout, manages state for Drawer and SimPanel
  components/
    PdfPane.tsx               — <Document> + <Page> via react-pdf, tracks currentPageNumber
    SimFAB.tsx                — The floating action button (NEW)
    SimDrawer.tsx             — The bottom sheet listing the sims (NEW)
    SimPanel.tsx              — renders SimStage from already-fetched annotation
    ExplainPanel.tsx          — reuses AI tutor's markdown+KaTeX renderer
    SplitResizer.tsx
  sim/
    evalSpec.ts               — pure function: evalSpec(spec, time): ResolvedElement[]
    SimStage.tsx              — rAF loop, historyRef for trajectory, maps to SVG
    elements/                 — Circle, Rect, Line, Path, Text, Arrow, Wave, Particles, etc.
  api.ts                      — typed fetchers with in-memory caching for annotations
```

---

## 7. Phase-by-Phase Build Checklist

### Phase 0 — Pre-flight & Supabase Setup
- [ ] Install Docker & Supabase CLI. Run `supabase init` and `supabase start`.
- [ ] Apply Data Model SQL to local Postgres.
- [ ] Create `pdfs` storage bucket in local Supabase dashboard.
- [ ] Confirm `shared/` import strategy (npm workspaces).

### Phase 1 — Shared Schema
- [x] Create `shared/simSpec.ts` (schema above).
- [x] Create `shared/simSpec.fixtures.ts` (one valid SimSpec per domain).
- [x] Write Vitest to ensure `SimSpecSchema.parse(fixture)` passes in both `web/` and `server/`.

### Phase 2 — PDF Extraction (Text Only)
- [x] Create `server/src/services/pdf/extract.ts`: Extract text structure (lines/words).
- [x] Create `server/src/services/pdf/chunk.ts`: Join lines into a single string.
- [x] Create `server/src/services/pdf/shouldClassify.ts`: Pre-filter logic.
- [x] Vitest: Ensure extraction returns clean text and pre-filter drops short pages.

### Phase 3 — LLM Classification (The Curator)
- [x] Create `server/src/prompts/simspec.v3.md`: Enforce max 3 candidates, importance scoring, mathjs syntax, and `stage` first.
- [x] Create `server/src/services/sim/candidateSchema.ts`: Zod schema extending `SimSpec` with `importance`.
- [x] Create `server/src/services/sim/classify.ts`: Call LLM, parse with `CandidateSchema`, handle 429s with backoff.
- [x] Vitest: Mock LLM to return valid candidates, invalid math, and >3 candidates. Assert correct parsing.

### Phase 4 — Persistence, Math Guard & Worker
- [x] Create `server/src/services/sim/repository.ts`: Supabase service-role client operations.
- [x] Create `server/src/services/sim/ingest.ts`: Implement the full funnel (Triage -> Math Guard -> Persist).
- [x] Create `server/src/workers/annotateBook.ts`: Process pages sequentially with delays. Reset stale jobs on startup.
- [x] Create `server/src/routes/simulation.ts`: Handle upload to Supabase Storage, trigger worker, return `<500ms`.
- [x] Vitest: Assert invalid math drops candidate. Assert DB inserts correctly.

### Phase 5 — Renderer (evalSpec & SVG)
- [x] Write Vitest tests for `evalSpec`: literals pass through, `$expr` evaluates correctly, unknown vars return `0`.
- [x] Create `web/src/features/pdf-simulator/sim/evalSpec.ts`: **Pre-compile** `mathjs` expressions for 60fps performance.
- [x] Create element renderers (`sim/elements/*.tsx`). Cap `particles` at 20.
- [x] Create `SimStage.tsx`: `requestAnimationFrame` loop, manage `historyRef` for trajectories (cap length).

### Phase 6 — Reader UI (FAB & Drawer)
- [x] Configure `react-pdf` web worker in Vite.
- [x] Create `web/src/features/pdf-simulator/api.ts`: Implement Supabase fetcher with **in-memory cache**.
- [x] Create `PdfPane.tsx`: Render PDF, track `currentPageNumber`.
- [x] Create `SimFAB.tsx`: Show/hide based on cached annotations for current page.
- [x] Create `SimDrawer.tsx`: Display list of sims with `quote` context.
- [x] Create `SimPanel.tsx`: Auto-play animation when a sim is selected from Drawer.
- [x] Verify: Scroll rapidly through 50 pages -> Network tab shows zero redundant API calls.

### Phase 7 — Wire-up + Teardown
- [ ] Add reader route to portal nav.
- [ ] Delete legacy `Backend/` directory and Python dependencies.
- [ ] Purge `chroma_db` from git history.

---

## 8. Final Acceptance Gate

- [ ] `vitest run evalSpec` — hex colour and plain text come out byte-identical to input.
- [ ] `vitest run evalSpec` — `sin(time)*100` at `time=1.5708` returns `~100`.
- [ ] Backend drops a candidate if it contains invalid `mathjs` syntax (e.g., `x**2`).
- [ ] Backend drops a candidate if `importance < 6`.
- [ ] Backend saves max 3 candidates per page.
- [ ] Network tab: Scroll rapidly through 20 pages -> **zero redundant API calls** (cache works).
- [ ] FAB appears only on pages with valid simulations.
- [ ] Clicking FAB opens Drawer. Clicking a card in Drawer auto-plays the SVG animation.
- [ ] PDF view is 100% clean (no overlapping highlight pills).
- [ ] `Backend/` absent from fresh clone, no Python in CI.

---

## 9. Bug → Fix Reference

| Prototype bug | Fixed by |
| :--- | :--- |
| Three incompatible JSON schemas | `shared/simSpec.ts` — single source of truth |
| Renderer fakes a result on failure | `superRefine` in schema + no-fallback rule |
| Colours/Text evaluated to `0` | `{$expr}` marker — literals are never passed to math evaluator |
| LLM outputs Python math (`x**2`) | **Backend Math Guard** (`mathjs.parse`) drops bad candidates before DB |
| BBox overlay misaligned / Y-axis flip bugs | **Removed bboxes entirely.** UI uses FAB + Drawer paradigm. |
| Fuzzy quote match failed, dropping valid sims | **Removed bboxes.** Quote is now just text context for the Drawer. |
| UI cluttered with 15 trivial pills per page | **LLM Curator prompt** forces max 3, importance >= 6 filter. |
| Ingestion blocked the upload request | `annotateBook.ts` worker + status polling |
| Vector DB / ChromaDB hallucinating locations | **Removed Vector DB.** Strict deterministic text extraction + Supabase Postgres. |
| Local JSON files lost on Docker restart | **Supabase Storage** for PDFs, **Postgres** for metadata. |