// server/src/services/sim/repository.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { SimSpec } from '@pdf-sim/shared'

export type BookStatus = 'pending' | 'extracting' | 'classifying' | 'ready' | 'failed'

export interface BookRecord {
  id: string
  slug: string
  title: string
  storage_path: string
  page_count: number | null
  status: BookStatus
  error: string | null
  created_at: string
}

export interface AnnotationRecord {
  id: string
  book_id: string
  page_number: number
  quote: string
  spec: SimSpec
  spec_version: string
  content_hash: string | null
  created_at: string
}

export interface CreateBookInput {
  slug: string
  title: string
  storage_path: string
  page_count?: number
}

export interface CreateAnnotationInput {
  book_id: string
  page_number: number
  quote: string
  spec: SimSpec
  spec_version?: string
  content_hash?: string
}

let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  return supabaseClient
}

/**
 * Overrides supabase client (useful for unit tests and mocks)
 */
export function setSupabaseClient(client: SupabaseClient | null): void {
  supabaseClient = client
}

// ---------------------------------------------------------------------------
// Storage Operations
// ---------------------------------------------------------------------------

export async function uploadPdfToStorage(
  storagePath: string,
  fileBuffer: Uint8Array | Buffer,
  bucketName = 'pdfs'
): Promise<string> {
  const supabase = getSupabaseClient()

  // Ensure storage bucket exists
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    if (!buckets?.some((b) => b.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: true })
    }
  } catch {
    // Ignore bucket check error and attempt upload
  }

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload PDF to Supabase Storage: ${error.message}`)
  }

  return data.path
}

export async function downloadPdfFromStorage(
  storagePath: string,
  bucketName = 'pdfs'
): Promise<Buffer> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.storage.from(bucketName).download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download PDF from storage (${storagePath}): ${error?.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ---------------------------------------------------------------------------
// Books DB Operations
// ---------------------------------------------------------------------------

export async function createBook(input: CreateBookInput): Promise<BookRecord> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sim_books')
    .insert({
      slug: input.slug,
      title: input.title,
      storage_path: input.storage_path,
      page_count: input.page_count ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to create book: ${error?.message}`)
  }

  return data as BookRecord
}

export async function updateBookStatus(
  bookId: string,
  status: BookStatus,
  errorMsg?: string | null,
  pageCount?: number
): Promise<BookRecord> {
  const supabase = getSupabaseClient()
  const updatePayload: Record<string, any> = {
    status,
    error: errorMsg ?? null,
  }
  if (typeof pageCount === 'number') {
    updatePayload.page_count = pageCount
  }

  const { data, error } = await supabase
    .from('sim_books')
    .update(updatePayload)
    .eq('id', bookId)
    .select()
    .single()

  if (error || !data) {
    throw new Error(`Failed to update book ${bookId} status to ${status}: ${error?.message}`)
  }

  return data as BookRecord
}

export async function getBookById(bookId: string): Promise<BookRecord | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('sim_books').select().eq('id', bookId).maybeSingle()

  if (error) {
    throw new Error(`Failed to get book by id ${bookId}: ${error.message}`)
  }

  return (data as BookRecord) ?? null
}

export async function getBookBySlug(slug: string): Promise<BookRecord | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.from('sim_books').select().eq('slug', slug).maybeSingle()

  if (error) {
    throw new Error(`Failed to get book by slug ${slug}: ${error.message}`)
  }

  return (data as BookRecord) ?? null
}

export async function listBooks(): Promise<BookRecord[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sim_books')
    .select()
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list books: ${error.message}`)
  }

  return (data as BookRecord[]) ?? []
}

/**
 * Resets stale jobs stuck in 'extracting' or 'classifying' back to 'failed' or 'pending' on startup (KP-3).
 */
export async function resetStaleBookJobs(): Promise<number> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sim_books')
    .update({
      status: 'failed',
      error: 'Worker interrupted by server restart',
    })
    .in('status', ['extracting', 'classifying'])
    .select('id')

  if (error) {
    console.warn(`[repository] Warning: Could not reset stale book jobs: ${error.message}`)
    return 0
  }

  return data?.length ?? 0
}

// ---------------------------------------------------------------------------
// Annotations DB Operations
// ---------------------------------------------------------------------------

export async function insertAnnotations(
  annotations: CreateAnnotationInput[]
): Promise<AnnotationRecord[]> {
  if (annotations.length === 0) return []

  const supabase = getSupabaseClient()
  const payload = annotations.map((ann) => ({
    book_id: ann.book_id,
    page_number: ann.page_number,
    quote: ann.quote,
    spec: ann.spec,
    spec_version: ann.spec_version ?? '2.0',
    content_hash: ann.content_hash ?? null,
  }))

  const { data, error } = await supabase.from('sim_annotations').insert(payload).select()

  if (error || !data) {
    throw new Error(`Failed to insert annotations: ${error?.message}`)
  }

  return data as AnnotationRecord[]
}

export async function updateAnnotation(
  annotationId: string,
  spec: any,
  quote?: string
): Promise<AnnotationRecord | null> {
  const supabase = getSupabaseClient()
  const updatePayload: Record<string, any> = {
    spec,
    spec_version: spec.version ?? '2.0',
  }
  if (quote) {
    updatePayload.quote = quote
  }

  const { data, error } = await supabase
    .from('sim_annotations')
    .update(updatePayload)
    .eq('id', annotationId)
    .select()
    .single()

  if (error || !data) {
    console.warn(`[repository] Could not update annotation ${annotationId}:`, error?.message)
    return null
  }

  return data as AnnotationRecord
}

export async function getAnnotationsByBookId(
  bookId: string,
  pageNumber?: number
): Promise<AnnotationRecord[]> {
  const supabase = getSupabaseClient()
  let query = supabase
    .from('sim_annotations')
    .select()
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })

  if (typeof pageNumber === 'number') {
    query = query.eq('page_number', pageNumber)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch annotations for book ${bookId}: ${error.message}`)
  }

  return (data as AnnotationRecord[]) ?? []
}

export async function findAnnotationsByHash(contentHash: string): Promise<AnnotationRecord[]> {
  if (!contentHash) return []

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('sim_annotations')
    .select()
    .eq('content_hash', contentHash)
    .limit(3)

  if (error) {
    return []
  }

  return (data as AnnotationRecord[]) ?? []
}

export async function deleteBook(bookId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  const book = await getBookById(bookId)
  if (book?.storage_path) {
    try {
      await supabase.storage.from('pdfs').remove([book.storage_path])
    } catch (e) {
      console.warn(`[repository] Could not remove PDF file from storage:`, e)
    }
  }

  // Deleting the book cascades to sim_annotations
  const { error } = await supabase.from('sim_books').delete().eq('id', bookId)
  if (error) {
    throw new Error(`Failed to delete book ${bookId}: ${error.message}`)
  }

  return true
}

