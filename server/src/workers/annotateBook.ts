// server/src/workers/annotateBook.ts

import {
  getBookById,
  updateBookStatus,
  downloadPdfFromStorage,
  resetStaleBookJobs,
} from '../services/sim/repository.js'
import { extractPdfStructure } from '../services/pdf/extract.js'
import { processPageIngestion } from '../services/sim/ingest.js'
import { shouldClassify } from '../services/pdf/shouldClassify.js'

export interface ProcessBookOptions {
  interPageDelayMs?: number
}

/**
 * Background worker task: downloads the PDF, extracts text per page,
 * runs the Curator + Math Guard ingestion funnel page-by-page, and updates status.
 */
export async function processBookJob(
  bookId: string,
  options: ProcessBookOptions = {}
): Promise<void> {
  const interPageDelayMs = options.interPageDelayMs ?? 600

  try {
    const book = await getBookById(bookId)
    if (!book) {
      console.error(`[worker] Book ${bookId} not found`)
      return
    }

    console.log(`[worker] Starting ingestion for book "${book.title}" (${bookId})`)

    // 1. Mark status as 'extracting'
    await updateBookStatus(bookId, 'extracting')

    // 2. Download PDF buffer from Supabase Storage
    const pdfBuffer = await downloadPdfFromStorage(book.storage_path)

    // 3. Extract text structures
    const pages = await extractPdfStructure(pdfBuffer)
    console.log(`[worker] Extracted ${pages.length} pages from "${book.title}"`)

    // 4. Update page count and status to 'classifying'
    await updateBookStatus(bookId, 'classifying', null, pages.length)

    // 5. Process pages sequentially with throttling
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const isClassifiable = shouldClassify(page.text)

      console.log(
        `[worker] Processing page ${page.pageNumber}/${pages.length} (${page.wordCount} words, classifiable=${isClassifiable})`
      )

      await processPageIngestion({
        bookId,
        pageNumber: page.pageNumber,
        pageText: page.text,
      })

      // Throttle only if this page involved an LLM call
      if (isClassifiable && i < pages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, interPageDelayMs))
      }
    }

    // 6. Mark book status as 'ready'
    await updateBookStatus(bookId, 'ready')
    console.log(`[worker] Successfully completed annotation for book ${bookId}`)
  } catch (err: any) {
    const errorMessage = err?.message || 'Unknown error during book processing'
    console.error(`[worker] Failed to process book ${bookId}:`, err)
    try {
      await updateBookStatus(bookId, 'failed', errorMessage)
    } catch (updateErr) {
      console.error(`[worker] Could not set failed status for book ${bookId}:`, updateErr)
    }
  }
}

/**
 * Initializes the background worker on server startup.
 * Resets any jobs that were left in 'extracting' or 'classifying' due to a server crash or restart (KP-3).
 */
export async function initWorker(): Promise<void> {
  try {
    const resetCount = await resetStaleBookJobs()
    if (resetCount > 0) {
      console.log(`[worker] Reset ${resetCount} stale book processing jobs on startup`)
    }
  } catch (err) {
    console.warn(`[worker] Startup stale job check encountered an error:`, err)
  }
}
