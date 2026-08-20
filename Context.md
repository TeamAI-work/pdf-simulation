  # PDF Simulation — Full Project Context & Developer Onboarding Guide

> Written for anyone cloning this project to a **new device**. Read this top-to-bottom before touching any code.

---

## 1. What This Project Is

**PDF Simulation** is an AI-powered interactive textbook reader that:

1. Accepts a **PDF upload** of any educational textbook.
2. Automatically **extracts text per page** and sends it through an LLM pipeline to identify simulatable physics / chemistry / math concepts.
3. Renders animated **SVG simulations** alongside the PDF reader for each detected concept.
4. Generates rich **student explanations** (pedagogically structured with analogies, variable dictionaries, real-world applications, thought experiments, and an AI tutor Q&A).
5. Provides a floating **text-selection explainer**: highlight any text anywhere and get an instant AI breakdown.
6. Includes an isolated **Physics MCP Lab** (testing the IBM/chuk-mcp-physics calculation engine) with real-world aerodynamic ballistics, fluid dynamics, rigid-body collisions, and AI natural language problem solving.

---

## 2. Monorepo Structure

This is an **npm workspaces monorepo** with 3 packages:

```
pdf-simulation/              <- root (no src code, just workspace config)
├── package.json             <- workspace definition + root scripts
├── .env                     <- ALL environment variables (NOT committed to git)
├── migrations/              <- Supabase SQL migrations (apply manually)
│   └── 0001_sim_books.sql   <- Creates sim_books + sim_annotations tables
│
├── shared/                  <- @pdf-sim/shared — TypeScript types shared between server & web
│   ├── simSpec.ts           <- THE core schema (SimSpec, SimElement, SimStage — Zod-validated)
│   ├── simSpec.fixtures.ts  <- Demo SimSpec objects for testing
│   └── index.ts             <- Barrel export
│
├── server/                  <- @pdf-sim/server — Express.js backend
│   └── src/
│       ├── index.ts         <- App entry point, mounts all routes
│       ├── routes/
│       │   ├── simulation.ts     <- /api/sim/* routes (main app)
│       │   └── mcpPhysics.ts     <- /api/mcp-physics/* routes (isolated lab)
│       ├── services/
│       │   ├── pdf/
│       │   │   ├── extract.ts        <- PDF text extraction (pdfjs-dist)
│       │   │   └── shouldClassify.ts <- content_hash dedup guard
│       │   ├── sim/
│       │   │   ├── candidateSchema.ts <- Zod schema for LLM-generated Candidate
│       │   │   ├── classify.ts        <- LLM cascade: OpenRouter -> Groq -> Gemini -> Procedural
│       │   │   ├── explainService.ts  <- Student explanation + selection explanation generator
│       │   │   ├── ingest.ts          <- Math guard + page ingestion funnel
│       │   │   ├── proceduralSim.ts   <- Fallback procedural SimSpec generator (no LLM needed)
│       │   │   └── repository.ts      <- All Supabase DB queries (books + annotations)
│       │   └── mcp-physics/
│       │       └── mcpPhysicsEngine.ts <- IBM/chuk-mcp-physics analytical engine
│       ├── workers/
│       │   └── annotateBook.ts  <- Background job: PDF -> extract -> classify -> insert annotations
│       └── prompts/
│           └── simspec.v3.md   <- System prompt for the LLM SimSpec curator
│
└── web/                     <- @pdf-sim/web — React + Vite frontend
    └── src/
        ├── App.tsx           <- Root component, screen switcher (Library | Reader | Lab)
        ├── index.css         <- Global CSS design system (tokens, utilities, animations)
        ├── main.tsx          <- React DOM entry
        └── features/
            ├── pdf-simulator/              <- Main app feature
            │   ├── api.ts                 <- SimulationApiClient class (all /api/sim/* calls)
            │   ├── components/
            │   │   ├── BookManager.tsx      <- Library: upload + browse books
            │   │   ├── PdfPane.tsx          <- PDF viewer (react-pdf + text layer)
            │   │   ├── SimPanel.tsx         <- Animated SVG simulation panel + toggle
            │   │   ├── ExplainPanel.tsx     <- Tabbed student explanation panel
            │   │   ├── SimDrawer.tsx        <- Bottom drawer: annotations + custom sim generator
            │   │   ├── SimFAB.tsx           <- Floating action button (opens drawer)
            │   │   ├── SplitResizer.tsx     <- Draggable horizontal resizer (PDF | Sim)
            │   │   └── TextSelectionExplainer.tsx <- Floating "Explain Selection" button
            │   ├── routes/
            │   │   └── ReaderRoute.tsx      <- Orchestrates the full reader layout
            │   └── sim/
            │       └── SimStage.tsx         <- mathjs evaluator + SVG animation renderer
            └── mcp-physics/                <- Isolated Physics MCP Lab feature
                ├── api.ts                 <- McpPhysicsClient class
                ├── components/
                │   ├── PhysicsTrajectoryCanvas.tsx
                │   ├── InteractivePlayground.tsx
                │   └── AiPhysicsSolver.tsx
                └── routes/
                    └── ChukPhysicsLabRoute.tsx
```

---

## 3. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19 + TypeScript | UI component model |
| Build Tool | Vite 8 | HMR + fast dev server |
| PDF Rendering | react-pdf + pdfjs-dist | Text layer enabled for selection |
| Backend | Express 5 + TypeScript (tsx watch) | REST API server |
| Database | Supabase (PostgreSQL + RLS) | Cloud-hosted, row-level security |
| File Storage | Supabase Storage (bucket: pdfs) | Stores uploaded PDFs |
| LLM Cascade | OpenRouter -> Groq -> Gemini -> Procedural | Multi-provider reliability |
| SVG Animation | mathjs expressions evaluated at runtime | { $expr: "sin(time)*100" } |
| Physics Engine | Custom analytical solver | Drag, Magnus, buoyancy |
| Testing | Vitest | All 3 workspaces |
| Type Safety | Zod + TypeScript strict mode | Shared schema validation |
| Package Manager | npm workspaces | Monorepo dependency linking |

---

## 4. Environment Variables (.env — NEVER committed)

Create `.env` in the **project root**. Loaded by both Vite (prefix VITE_) and the Express server.

```
# Supabase (Frontend)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-jwt>

# Supabase (Backend — service role for write access)
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
SUPABASE_ANON_KEY=<anon-jwt>

# LLM Providers (cascades in order, all optional)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=nvidia/nemotron-3.5-lightning:free

GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b

GEMINI_API_KEY=AI...
GEMINI_MODEL=gemini-3.6-flash
```

Without LLM keys: App uses the procedural fallback engine — still fully functional.
Without Supabase keys: PDF upload/fetch fails, but demo fixtures still load in the reader.

---

## 5. Database Schema (Supabase)

Apply migrations/0001_sim_books.sql once in the Supabase SQL Editor.

### sim_books
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | Unique book ID |
| slug | text UNIQUE | URL-safe title slug |
| title | text | Display name |
| storage_path | text | Key in pdfs Supabase Storage bucket |
| page_count | int | Set after PDF extraction |
| status | text | pending -> extracting -> classifying -> ready -> failed |
| error | text | Error message if pipeline failed |

### sim_annotations
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | Unique annotation ID |
| book_id | uuid FK | Parent book |
| page_number | int | PDF page number (1-indexed) |
| quote | text | Verbatim textbook excerpt (shown in Drawer UI) |
| spec | jsonb | Full SimSpec JSON (Zod-validated) |
| spec_version | text | "2.0" |
| content_hash | text | SHA-256 of page text — deduplication guard |

RLS: Public can only read annotations for ready books. All writes use service-role key (server-side only).
Storage: Create a private bucket named `pdfs` in Supabase Storage.

---

## 6. The Core Data Model: SimSpec

Everything in the app revolves around the SimSpec type in shared/simSpec.ts.

```typescript
// The animated element definition
interface SimElement {
  id: string
  type: "circle" | "rect" | "line" | "path" | "text" | "arrow" | "wave" | "particles" | "spring" | "arc" | "active-path"
  role: "projectile" | "trajectory" | "none"
  props: Record<string, number | string | { $expr: string }>
  text?: number | string | { $expr: string }
}

// The animation stage
interface SimStage {
  viewBox: string   // e.g. "0 0 500 300"
  elements: SimElement[]
}

// One complete simulation concept
interface SimSpec {
  version: "2.0"
  title: string            // e.g. "Harmonic Oscillator & Resonance"
  subtitle: string
  domain: "physics" | "chemistry" | "math" | "general"
  parentTopic: string      // e.g. "Classical Mechanics"
  topicExplanation: string // Plain-English explanation
  caption: string
  isSimulatable: boolean
  reasonIfNotSimulatable: string
  quote: string            // Verbatim textbook text (for Drawer context)
  equations: string[]      // e.g. ["F = -kx", "w = sqrt(k/m)"]
  stage?: SimStage         // Absent when isSimulatable=false
}
```

The { $expr: "sin(time)*100" } marker is evaluated by mathjs at animation runtime in SimStage.tsx.

---

## 7. API Routes Reference

### Standard App (/api/sim/*)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/sim/books | Upload PDF -> creates book + fires background worker |
| GET | /api/sim/books | List all books |
| GET | /api/sim/books/:id | Get one book |
| DELETE | /api/sim/books/:id | Delete book + storage |
| GET | /api/sim/books/:id/status | Poll processing status |
| GET | /api/sim/books/:id/annotations | Get all SimSpec annotations for a book |
| POST | /api/sim/generate | On-demand custom simulation from a text prompt |
| POST | /api/sim/explain | Generate student explanation for a SimSpec |
| POST | /api/sim/explain-selection | Explain user-selected text with surrounding context |

### Physics MCP Lab (/api/mcp-physics/*)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/mcp-physics/projectile | Aerodynamic ballistics (drag, Magnus spin, altitude, wind) |
| POST | /api/mcp-physics/underwater | Hydrodynamic drag + Archimedes buoyancy simulator |
| POST | /api/mcp-physics/collision | 2D rigid-body elastic/inelastic collision solver |
| POST | /api/mcp-physics/ai-solve | Natural language -> verified physics calculation + trajectory |

---

## 8. How PDFs Become Simulations (The Processing Pipeline)

```
User uploads PDF (BookManager.tsx)
          |
          v
POST /api/sim/books
          |
          +-- Saves to Supabase Storage (bucket: pdfs)
          +-- Creates sim_books row (status: pending)
          +-- Fires processBookJob(bookId) asynchronously
                    |
                    v
           annotateBook.ts (background worker)
                    |
                    +-- status -> 'extracting'
                    +-- downloadPdfFromStorage() -> PDF buffer
                    +-- extractPdfStructure() -> text per page (pdfjs-dist)
                    +-- status -> 'classifying'
                    +-- For each page:
                              |
                              +-- shouldClassify() -- skip if content_hash matches
                              +-- processPageIngestion(pageText) [ingest.ts]
                                        |
                                        +-- classifyPage() [classify.ts]
                                        |   LLM cascade:
                                        |   1. OpenRouter (OPENROUTER_API_KEY)
                                        |   2. Groq (GROQ_API_KEY)
                                        |   3. Gemini (GEMINI_API_KEY)
                                        |   4. generateProceduralSimSpec() <- always works
                                        |
                                        +-- Validates output against CandidateSchema (Zod)
                                        +-- validateMathExpressions() -- mathjs syntax guard
                                        +-- insertAnnotations() -> sim_annotations rows
                    |
                    +-- status -> 'ready'

Frontend polls GET /api/sim/books/:id/status every 2s until 'ready',
then fetches GET /api/sim/books/:id/annotations to populate the Drawer.
```

---

## 9. The Animation Engine

web/src/features/pdf-simulator/sim/SimStage.tsx:

1. Maintains a `time` counter incremented by requestAnimationFrame.
2. For each SimElement, iterates all props and evaluates any { $expr: "..." } using mathjs with scope { time }.
3. Maps element types to SVG primitives.
4. SVG viewBox ensures responsive scaling.

Common expression patterns:
```
cx: { $expr: "250 + 80*cos(time*2)" }          <- circular motion
cy: { $expr: "150 + 60*sin(time*2)" }
x2: { $expr: "100 + 120*(1+0.4*sin(time*4))" } <- spring compression
opacity: { $expr: "0.5 + 0.5*sin(time)" }      <- fade pulse
```

---

## 10. Student Explanation System

Service: server/src/services/sim/explainService.ts

Output structure:
- summary: one-sentence hook
- intuition: 3-4 beginner-friendly paragraphs
- animationGuide: per-element descriptions ("The red circle represents...")
- equationBreakdown: per-equation variable dictionary
- thoughtExperiment: { question, hint, answer }
- realWorldApplications: string[]
- keyTakeaways: string[]
- tutorAnswer: response to a follow-up Q&A

Level adaptation: Pass mode: 'beginner' | 'standard' | 'advanced' to change vocabulary depth.

Caching: explanationCache Map in simApiClient caches per (spec.title, mode) — no redundant LLM calls within the same browser session.

---

## 11. Screen Architecture (3 Top-Level Screens)

```
App.tsx  (activeScreen: 'library' | 'reader' | 'lab')
|
+-- 'library' -> BookManager.tsx
|     Upload PDF, view book list, poll ingestion status, open books
|
+-- 'reader' -> ReaderRoute.tsx
|     +-- Left panel: PdfPane.tsx (PDF viewer, text layer, SimFAB)
|     +-- Resizer: SplitResizer.tsx (drag to change panel widths)
|     +-- Overlay: SimDrawer.tsx (annotation list + custom sim generator)
|     +-- Right panel: reader-sim-container
|           +-- SimPanel.tsx (SVG animation + Hide/Show Animation toggle)
|           +-- ExplainPanel.tsx (Intuition | Visual | Math | Quiz | Real-World tabs + AI Tutor)
|
+-- 'lab' -> ChukPhysicsLabRoute.tsx
      +-- InteractivePlayground (Ballistics | Underwater | Collision)
      +-- AiPhysicsSolver (natural language -> trajectory + proof)
```

---

## 12. New Device Setup — Complete Steps

### Prerequisites
- Node.js 20+: node --version
- npm 10+: npm --version
- A Supabase project (free tier: supabase.com)

### Step 1: Clone the repo
```
git clone <your-git-remote-url>
cd pdf-simulation
```

### Step 2: Create .env file
See Section 4 for the complete template. Fill in your Supabase keys + at least one LLM key.

### Step 3: Apply database migration
1. Go to your Supabase project -> SQL Editor
2. Open migrations/0001_sim_books.sql and paste + run it
3. Go to Storage -> create a new bucket named `pdfs` (set to private)

### Step 4: Install dependencies
```
npm install
```

### Step 5: Start the app (two terminals)
```
# Terminal 1: Backend Express server on port 3001
npm run server

# Terminal 2: Frontend Vite dev server on port 5173
npm run dev
```

Open http://localhost:5173

Vite proxies /api, /sim, /health to localhost:3001 via vite.config.ts.

---

## 13. npm Scripts Quick Reference

| Script | Command | What it runs |
|--------|---------|-------------|
| Frontend | npm run dev | Vite dev server on port 5173 |
| Backend | npm run server | Express + tsx watch on port 3001 |
| Type check | npm run typecheck | tsc --noEmit in all 3 workspaces |
| Tests | npm test | Vitest in all 3 workspaces |
| Build | npm run build | Production build of all workspaces |

---

## 14. Key Design Decisions & Gotchas

| Topic | Decision & Reason |
|-------|-------------------|
| Monorepo | npm workspaces — @pdf-sim/shared resolves to ../shared via vite.config.ts alias without a compile step |
| $expr marker | Distinguishes dynamic props from literal strings/numbers. Always check isExpr(v) before passing to mathjs |
| LLM cascade | OpenRouter -> Groq -> Gemini -> Procedural. App NEVER breaks due to LLM failure |
| Service role on server | Supabase writes require service role key — never expose it to the browser |
| flex: 1; min-height: 0 | Required on flex children that need their own scrollbar. Without min-height: 0, flex items overflow |
| content_hash dedup | SHA-256 of first 16 chars of page text — skips re-classifying identical pages if re-uploaded |
| Text layer | react-pdf with renderTextLayer={true} overlays selectable text on the PDF canvas |
| MCP Lab isolation | Entirely separate feature folder, API routes, and service directory. Nothing in the main app imports from mcp-physics/ |
| In-memory caching | explanationCache Map caches by title:mode — prevents duplicate LLM calls per session |
