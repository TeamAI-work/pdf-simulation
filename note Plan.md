# Notes Taker Module — Implementation Plan

## Background

The existing reader (`ReaderRoute.tsx`) renders a **left PDF pane + right sim/explain workspace**. The right panel currently shows only `SimPanel` + `ExplainPanel` when a simulation is selected.

The goal is to redesign the right panel into a **3-section workspace** with:

1. **Chat** — existing `TextSelectionExplainer` elevated to a persistent chat pane  
2. **Simulation** — the existing `SimPanel` + `ExplainPanel`  
3. **Notebook** — a new note-taking feature backed by Supabase

Notes are created by **highlighting text in the PDF** (text layer is already enabled via `renderTextLayer={true}` in `PdfPane`), then editing the captured text in a rich inline editor.

---

## Layout Architecture

```
┌──────────────────────┬──────────────────────────────────┐
│                      │  [💬 Chat] [🔬 Sim] [📓 Notes]  │  ← tab bar
│    PDF Viewer        ├──────────────────────────────────┤
│    (left pane)       │                                  │
│                      │   (only the active tab renders)  │
│  • text layer on     │                                  │
│  • highlight →       │                                  │
│    note / explain    │                                  │
│                      │                                  │
└──────────────────────┴──────────────────────────────────┘
```

The right panel is a **tab-switched container**. Three tab buttons sit at the top of the panel — only one tab's content is visible at a time. Clicking a button swaps the active view:

| Tab button | Content rendered |
|------------|------------------|
| 💬 **Chat** | `ChatPane` — persistent AI conversation |
| 🔬 **Sim** | `SimPanel` + `ExplainPanel` — animation + explanation |
| 📓 **Notes** | `NotebookPanel` — Supabase-backed notebook |

**Programmatic tab switching:**
- Clicking a simulation annotation in the drawer → auto-switches to **Sim** tab
- Adding a note from a PDF highlight → auto-switches to **Notes** tab
- Clicking "✨ Explain" on selected PDF text → auto-switches to **Chat** tab

---

## Open Questions

> **Q1: Right panel always visible?**  
> Currently the right panel only appears when a simulation is selected. Should the right panel (Chat + Sim + Notebook) always be visible when a book is open, or should it still only appear when a sim is selected?  
> **Proposed:** Always visible. Notebook and Chat are useful even without a sim.

> **Q2: Note ownership / user auth?**  
> Currently the app has no authentication. Should notes be **per-book only** (no user identity), or should we add a lightweight user identity (e.g., `localStorage` UUID as `user_id`)?  
> **Proposed:** `user_id` stored in `localStorage` as a stable anonymous UUID. This keeps notes private per device without requiring auth.

> **Q3: Highlight-to-note trigger UX?**  
> When the user highlights text in the PDF, should the note capture happen:  
> (a) via a small floating button near the selection ("Add to Notebook"), or  
> (b) via the existing SimFAB-style floating button?  
> **Proposed:** (a) — a small floating **"+ Note"** button near the selection, separate from the "Explain" button that already exists.

> **Q4: Chat section content?**  
> Is the Chat section the existing `TextSelectionExplainer` modal repurposed as a persistent chat, or a new AI chat interface linked to the current book?  
> **Proposed:** A persistent chat panel using the existing `/api/sim/explain-selection` endpoint, with conversation history stored in `useState`.

---

## Proposed Changes

---

### 1. Database — New Migration

#### [NEW] `migrations/0002_notes.sql`

New Supabase table:

```sql
create table sim_notes (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references sim_books(id) on delete cascade,
  user_id      text not null,           -- anonymous localStorage UUID
  page_number  int not null,
  highlight    text not null,           -- raw captured text from PDF selection
  note         text not null default '',-- user-edited note body (markdown allowed)
  color        text not null default 'yellow',  -- highlight color tag
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index sim_notes_book_user_idx on sim_notes (book_id, user_id);

alter table sim_notes enable row level security;

-- Public read/write using user_id match (no auth required)
create policy sim_notes_select on sim_notes
  for select using (true);

create policy sim_notes_insert on sim_notes
  for insert with check (true);

create policy sim_notes_update on sim_notes
  for update using (true);

create policy sim_notes_delete on sim_notes
  for delete using (true);
```

> **Note:** RLS is permissive here since there's no real auth. The `user_id` acts as a soft namespace. If auth is added later, tighten the policies.

---

### 2. Backend — Notes API Routes

#### [MODIFY] `server/src/services/sim/repository.ts`

Add CRUD functions for `sim_notes`:
- `createNote(payload)` → inserts a new note row
- `getNotesByBookAndUser(bookId, userId)` → list all notes for a book+user
- `updateNote(noteId, body)` → patches `note` text + `updated_at`
- `deleteNote(noteId)` → removes a note row

#### [MODIFY] `server/src/routes/simulation.ts`

Add 4 new routes under `/api/sim/notes`:

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/sim/notes/:bookId` | Fetch all notes for a book (pass `user_id` as query param) |
| `POST` | `/sim/notes` | Create a note from a highlight |
| `PATCH` | `/sim/notes/:noteId` | Update the note body text |
| `DELETE` | `/sim/notes/:noteId` | Delete a note |

---

### 3. Frontend — Notes Feature

#### [NEW] `web/src/features/pdf-simulator/api.ts` additions

Add `NoteRecord` type and note API methods to `simApiClient`:
- `fetchNotes(bookId, userId): Promise<NoteRecord[]>`
- `createNote(payload): Promise<NoteRecord>`
- `updateNote(noteId, noteText): Promise<NoteRecord>`
- `deleteNote(noteId): Promise<void>`

`user_id` is read from `localStorage` (generated on first use as `crypto.randomUUID()`).

---

#### [NEW] `web/src/features/pdf-simulator/components/NotebookPanel.tsx`

The main notebook UI. Rendered inside the right panel's Notebook section.

**Features:**
- Displays all notes for the current book, sorted by `page_number` then `created_at`
- Each note card shows:
  - 📄 Page number badge
  - 🖊 Highlighted text (dimmed, from PDF)
  - ✏️ Editable note body — `<textarea>` inline, auto-saves on blur
  - 🎨 Color tag dot
  - 🗑 Delete button
- "Filter by current page" toggle chip
- Empty state with a friendly prompt ("Highlight text in the PDF to add a note")

---

#### [NEW] `web/src/features/pdf-simulator/components/NoteHighlightButton.tsx`

A small floating button that appears above a PDF text selection, alongside the existing `TextSelectionExplainer` button.

**Behavior:**
1. Listens for `mouseup` on the PDF pane container
2. If `window.getSelection().toString().trim()` has content, shows a **"+ Note"** button near the selection anchor
3. Clicking it calls `onAddNote(selectedText, currentPage)` — hides the button
4. The button disappears if the user clicks elsewhere or the selection is cleared

---

#### [NEW] `web/src/features/pdf-simulator/components/RightPanel.tsx`

Replaces the current inline `reader-sim-container` div in `ReaderRoute.tsx`.

Renders a **tab bar at the top** + the **active tab's content** below:

```tsx
<RightPanel activeTab={activeTab} onTabChange={setActiveTab}>
  <Tab id="chat" icon="💬" label="Chat">
    <ChatPane ... />
  </Tab>
  <Tab id="sim" icon="🔬" label="Sim">
    <SimPanel ... />
    <ExplainPanel ... />
  </Tab>
  <Tab id="notes" icon="📓" label="Notes">
    <NotebookPanel ... />
  </Tab>
</RightPanel>
```

`activeTab` state is lifted to `ReaderRoute` so it can be switched programmatically:
- Selecting a simulation → `setActiveTab('sim')`
- Adding a note → `setActiveTab('notes')`
- Triggering explain from PDF selection → `setActiveTab('chat')`

The inactive tab content is **unmounted** (not hidden with CSS) to keep memory clean. Chat messages survive because state lives in `ReaderRoute`, not inside `ChatPane`.

---

#### [NEW] `web/src/features/pdf-simulator/components/ChatPane.tsx`

Persistent chat panel backed by the existing `/api/sim/explain-selection` endpoint.

**Features:**
- Message history in `useState` (not persisted — session only)
- Text input at the bottom
- Each user message shows the selected/typed text; each AI response renders as markdown
- Pre-populated if triggered from a PDF highlight (shares selection context)
- "Ask about this book" placeholder when no message sent

---

#### [MODIFY] `web/src/features/pdf-simulator/routes/ReaderRoute.tsx`

**Changes:**
1. Add `activeTab` state: `useState<'chat' | 'sim' | 'notes'>('chat')`
2. Add `notes` state: `useState<NoteRecord[]>([])`
3. Add `chatMessages` state: `useState<ChatMessage[]>([])`
4. On mount (when `bookId` is set), fetch notes via `simApiClient.fetchNotes(bookId, userId)` alongside annotations
5. Pass `onAddNote` handler → auto-switches to `'notes'` tab
6. Selecting a sim annotation → `setActiveTab('sim')`
7. Triggering explain from PDF highlight → `setActiveTab('chat')`
8. Replace the inline `reader-sim-container` div with `<RightPanel activeTab={activeTab} onTabChange={setActiveTab}>` — always visible
9. Right panel width: fixed `420px` by default; left PDF pane takes `calc(100% - 420px)`

---

#### [MODIFY] `web/src/features/pdf-simulator/components/PdfPane.tsx`

Add `onTextSelected?: (text: string, page: number) => void` prop. Wire it to `mouseup` events on the document container. This feeds both:
- the existing `TextSelectionExplainer` (which becomes part of `ChatPane`)
- the new `NoteHighlightButton`

---

#### [MODIFY] `web/src/index.css`

Add design tokens and styles for:
- `.right-panel` — flex column, fixed width, border-left separator
- `.right-panel__tab-bar` — horizontal tab button row at the top
- `.right-panel__tab-btn` — individual tab button, active state with underline/highlight
- `.right-panel__tab-content` — fills remaining height below tab bar, overflow-y scroll
- `.notebook-card` — note card with highlight quote, textarea, color dot, delete button
- `.note-highlight-btn` — small floating "＋ Note" button, positioned near text selection
- `.chat-pane` — message list + input footer

---

## Data Flow

```
User highlights text in PDF
        │
        ▼
NoteHighlightButton appears (mouseup listener in PdfPane)
        │
   User clicks "+ Note"
        │
        ▼
ReaderRoute.handleAddNote(selectedText, pageNumber)
        │
        ├─→ POST /api/sim/notes  (server → Supabase insert)
        │
        └─→ setNotes(prev => [newNote, ...prev])
                │
                ▼
        NotebookPanel re-renders with new card
                │
        User edits the textarea (typing custom note)
                │
        onBlur → PATCH /api/sim/notes/:id  (server → Supabase update)
```

---

## File Change Summary

| Status | File | Change |
|--------|------|--------|
| **NEW** | `migrations/0002_notes.sql` | `sim_notes` table + RLS |
| **MODIFY** | `server/src/services/sim/repository.ts` | Add note CRUD functions |
| **MODIFY** | `server/src/routes/simulation.ts` | Add 4 note routes |
| **MODIFY** | `web/src/features/pdf-simulator/api.ts` | Add `NoteRecord` type + note API methods |
| **NEW** | `web/src/features/pdf-simulator/components/NotebookPanel.tsx` | Note list + inline editor |
| **NEW** | `web/src/features/pdf-simulator/components/NoteHighlightButton.tsx` | Floating "add note" trigger |
| **NEW** | `web/src/features/pdf-simulator/components/RightPanel.tsx` | 3-section collapsible right panel |
| **NEW** | `web/src/features/pdf-simulator/components/ChatPane.tsx` | Persistent AI chat |
| **MODIFY** | `web/src/features/pdf-simulator/routes/ReaderRoute.tsx` | Wire notes state, use RightPanel |
| **MODIFY** | `web/src/features/pdf-simulator/components/PdfPane.tsx` | Expose `onTextSelected` prop |
| **MODIFY** | `web/src/index.css` | Right panel + notebook design tokens |

---

## Verification Plan

### Automated Tests
- `npm run typecheck` — TypeScript strict across all 3 workspaces
- `npm test` — existing Vitest suite must remain green

### Manual Verification
1. Open a book → right panel always visible with 3 sections
2. Highlight text in PDF → "＋ Note" button appears near selection
3. Click "＋ Note" → card appears in Notebook section with captured text
4. Type in the note textarea, click away → note body saved to Supabase
5. Reload page → notes persist (fetched from Supabase)
6. Delete a note → removed from UI and DB
7. Click a sim annotation → Simulation section shows `SimPanel` + `ExplainPanel`
8. Type in Chat → AI responds via `/api/sim/explain-selection`
9. Collapse a section → smooth CSS transition, content hidden
10. Filter Notebook to current page → only current-page notes shown
