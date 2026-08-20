-- migrations/0001_sim_books.sql
-- Apply to Supabase cloud via dashboard SQL editor or CLI

-- ============================================================
-- sim_books: one row per uploaded PDF
-- ============================================================
create table sim_books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  storage_path text not null,             -- Supabase Storage key (bucket: pdfs)
  page_count int,
  status text not null default 'pending'  -- pending | extracting | classifying | ready | failed
    check (status in ('pending','extracting','classifying','ready','failed')),
  error text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- sim_annotations: one row per validated SimSpec (max 3 per page)
-- NOTE: No bbox, page_width, or page_height columns.
--       'quote' is retained purely for UI context in the Drawer, not spatial mapping.
-- ============================================================
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

-- ============================================================
-- Indexes
-- ============================================================
create index sim_annotations_book_page_idx on sim_annotations (book_id, page_number);
create index sim_annotations_hash_idx      on sim_annotations (content_hash);

-- ============================================================
-- Row Level Security
-- All writes are service-role only. Reads are public for 'ready' books.
-- ============================================================
alter table sim_books       enable row level security;
alter table sim_annotations enable row level security;

-- Public can read books that have finished processing
create policy sim_books_read on sim_books
  for select using (status = 'ready');

-- Public can read annotations that belong to a ready book
create policy sim_annotations_read on sim_annotations
  for select using (
    exists (select 1 from sim_books b where b.id = book_id and b.status = 'ready')
  );

-- No insert/update/delete policy for anon/authenticated roles.
-- All writes go through the service-role key on the backend.
